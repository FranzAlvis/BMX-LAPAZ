const express = require('express');
const Joi = require('joi');
const { authenticate, requireSecretaria, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createEventSchema = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  date: Joi.date().required(),
  venue: Joi.string().min(3).max(255).required(),
  city: Joi.string().min(2).max(100).required(),
  country: Joi.string().min(2).max(100).default('Bolivia')
});

const updateEventSchema = Joi.object({
  name: Joi.string().min(3).max(255),
  date: Joi.date(),
  venue: Joi.string().min(3).max(255),
  city: Joi.string().min(2).max(100),
  country: Joi.string().min(2).max(100),
  status: Joi.string().valid('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED')
});

// GET /api/events - List all events
router.get('/', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [events, total] = await Promise.all([
      req.prisma.event.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { date: 'desc' },
        include: {
          _count: {
            select: {
              registrations: true,
              races: true
            }
          }
        }
      }),
      req.prisma.event.count({ where })
    ]);

    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/events/:id - Get event by ID
router.get('/:id', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const event = await req.prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        registrations: {
          include: {
            rider: {
              select: {
                id: true,
                plate: true,
                firstName: true,
                lastName: true,
                club: true
              }
            },
            category: {
              select: {
                id: true,
                name: true,
                gender: true,
                wheel: true
              }
            }
          }
        },
        races: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                gender: true,
                wheel: true
              }
            },
            motos: {
              include: {
                heats: {
                  include: {
                    heatEntries: {
                      include: {
                        rider: {
                          select: {
                            id: true,
                            plate: true,
                            firstName: true,
                            lastName: true
                          }
                        },
                        result: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Event not found'
      });
    }

    res.json({ event });
  } catch (error) {
    next(error);
  }
});

// POST /api/events - Create new event
router.post('/', authenticate, requireSecretaria, async (req, res, next) => {
  try {
    const { error, value } = createEventSchema.validate(req.body);
    if (error) return next(error);

    const event = await req.prisma.event.create({
      data: value,
      include: {
        _count: {
          select: {
            registrations: true,
            races: true
          }
        }
      }
    });

    // Log event creation
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entity: 'Event',
        entityId: event.id,
        newValues: value
      }
    });

    // Emit real-time update
    req.io.emit('event-created', { event });

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', authenticate, requireSecretaria, async (req, res, next) => {
  try {
    const { error, value } = updateEventSchema.validate(req.body);
    if (error) return next(error);

    // Get current event for audit log
    const currentEvent = await req.prisma.event.findUnique({
      where: { id: req.params.id }
    });

    if (!currentEvent) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Event not found'
      });
    }

    const event = await req.prisma.event.update({
      where: { id: req.params.id },
      data: value,
      include: {
        _count: {
          select: {
            registrations: true,
            races: true
          }
        }
      }
    });

    // Log event update
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'Event',
        entityId: event.id,
        oldValues: currentEvent,
        newValues: value
      }
    });

    // Emit real-time update
    req.io.emit('event-updated', { event });

    res.json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', authenticate, requireSecretaria, async (req, res, next) => {
  try {
    const event = await req.prisma.event.findUnique({
      where: { id: req.params.id }
    });

    if (!event) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Event not found'
      });
    }

    // Check if event has registrations or races
    const counts = await req.prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            registrations: true,
            races: true
          }
        }
      }
    });

    if (counts._count.registrations > 0 || counts._count.races > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot delete event with existing registrations or races'
      });
    }

    await req.prisma.event.delete({
      where: { id: req.params.id }
    });

    // Log event deletion
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        entity: 'Event',
        entityId: req.params.id,
        oldValues: event
      }
    });

    // Emit real-time update
    req.io.emit('event-deleted', { eventId: req.params.id });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/events/:id/dashboard - Event dashboard data
router.get('/:id/dashboard', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const eventId = req.params.id;

    // Get event with comprehensive data for dashboard
    const [event, stats] = await Promise.all([
      req.prisma.event.findUnique({
        where: { id: eventId },
        include: {
          races: {
            include: {
              category: true,
              motos: {
                include: {
                  heats: {
                    include: {
                      heatEntries: {
                        include: {
                          rider: true,
                          result: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }),
      // Get statistics
      req.prisma.event.findUnique({
        where: { id: eventId },
        include: {
          _count: {
            select: {
              registrations: true,
              races: true
            }
          }
        }
      })
    ]);

    if (!event) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Event not found'
      });
    }

    // Calculate dashboard metrics
    const totalRiders = stats._count.registrations;
    const totalRaces = stats._count.races;
    
    let completedRaces = 0;
    let activeRaces = 0;
    let pendingRaces = 0;

    event.races.forEach(race => {
      switch (race.status) {
        case 'COMPLETED':
          completedRaces++;
          break;
        case 'ACTIVE':
          activeRaces++;
          break;
        case 'PENDING':
          pendingRaces++;
          break;
      }
    });

    const dashboard = {
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        venue: event.venue,
        city: event.city,
        status: event.status
      },
      stats: {
        totalRiders,
        totalRaces,
        completedRaces,
        activeRaces,
        pendingRaces,
        completionPercentage: totalRaces > 0 ? Math.round((completedRaces / totalRaces) * 100) : 0
      },
      races: event.races.map(race => ({
        id: race.id,
        category: race.category,
        status: race.status,
        motosCount: race.motos.length,
        completedMotos: race.motos.filter(m => m.status === 'COMPLETED').length
      }))
    };

    res.json({ dashboard });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
