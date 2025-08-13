const express = require('express');
const Joi = require('joi');
const { authenticate, requireSecretaria, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createRegistrationSchema = Joi.object({
  eventId: Joi.string().uuid().required(),
  categoryId: Joi.string().uuid().required(),
  riderId: Joi.string().uuid().required(),
  seed: Joi.number().integer().min(1).optional()
});

const bulkRegistrationSchema = Joi.object({
  eventId: Joi.string().uuid().required(),
  categoryId: Joi.string().uuid().required(),
  riderIds: Joi.array().items(Joi.string().uuid()).min(1).required()
});

const updateRegistrationSchema = Joi.object({
  seed: Joi.number().integer().min(1).optional(),
  status: Joi.string().valid('REGISTERED', 'CONFIRMED', 'CANCELLED').optional()
});

// Helper function to calculate age at event date
const calculateAgeAtDate = (dateOfBirth, eventDate) => {
  const birthDate = new Date(dateOfBirth);
  const event = new Date(eventDate);
  let age = event.getFullYear() - birthDate.getFullYear();
  const monthDiff = event.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && event.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// GET /api/registrations - List registrations with filters
router.get('/', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      eventId, 
      categoryId, 
      riderId, 
      status = 'REGISTERED'
    } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (eventId) where.eventId = eventId;
    if (categoryId) where.categoryId = categoryId;
    if (riderId) where.riderId = riderId;
    if (status !== 'all') where.status = status;

    const [registrations, total] = await Promise.all([
      req.prisma.registration.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: [
          { event: { date: 'desc' } },
          { category: { name: 'asc' } },
          { rider: { lastName: 'asc' } }
        ],
        include: {
          event: {
            select: {
              id: true,
              name: true,
              date: true,
              venue: true,
              status: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              gender: true,
              wheel: true,
              minAge: true,
              maxAge: true
            }
          },
          rider: {
            select: {
              id: true,
              plate: true,
              firstName: true,
              lastName: true,
              club: true,
              dateOfBirth: true,
              gender: true
            }
          }
        }
      }),
      req.prisma.registration.count({ where })
    ]);

    // Add calculated age at event date
    const registrationsWithAge = registrations.map(reg => ({
      ...reg,
      rider: {
        ...reg.rider,
        ageAtEvent: calculateAgeAtDate(reg.rider.dateOfBirth, reg.event.date)
      }
    }));

    res.json({
      registrations: registrationsWithAge,
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

// GET /api/registrations/:id - Get registration by ID
router.get('/:id', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const registration = await req.prisma.registration.findUnique({
      where: { id: req.params.id },
      include: {
        event: true,
        category: true,
        rider: true
      }
    });

    if (!registration) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Registration not found'
      });
    }

    // Add calculated age at event date
    const registrationWithAge = {
      ...registration,
      rider: {
        ...registration.rider,
        ageAtEvent: calculateAgeAtDate(registration.rider.dateOfBirth, registration.event.date)
      }
    };

    res.json({ registration: registrationWithAge });
  } catch (error) {
    next(error);
  }
});

// POST /api/registrations - Create new registration
router.post('/', authenticate, requireSecretaria, async (req, res, next) => {
  try {
    const { error, value } = createRegistrationSchema.validate(req.body);
    if (error) return next(error);

    const { eventId, categoryId, riderId, seed } = value;

    // Validate event exists and is not completed
    const event = await req.prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Event not found'
      });
    }

    if (event.status === 'COMPLETED' || event.status === 'CANCELLED') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot register for completed or cancelled events'
      });
    }

    // Validate category exists and is active
    const category = await req.prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category || !category.isActive) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found or inactive'
      });
    }

    // Validate rider exists and is active
    const rider = await req.prisma.rider.findUnique({
      where: { id: riderId }
    });

    if (!rider || !rider.isActive) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Rider not found or inactive'
      });
    }

    // Check age eligibility
    const ageAtEvent = calculateAgeAtDate(rider.dateOfBirth, event.date);
    if (ageAtEvent < category.minAge || ageAtEvent > category.maxAge) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Rider age (${ageAtEvent}) is not eligible for category ${category.name} (${category.minAge}-${category.maxAge} years)`
      });
    }

    // Check gender eligibility
    if (category.gender !== 'Mixed' && rider.gender !== category.gender) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Rider gender (${rider.gender}) is not eligible for category ${category.name}`
      });
    }

    // Check if already registered
    const existingRegistration = await req.prisma.registration.findUnique({
      where: {
        eventId_categoryId_riderId: {
          eventId,
          categoryId,
          riderId
        }
      }
    });

    if (existingRegistration) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Rider is already registered for this event and category'
      });
    }

    // Check category capacity
    const registrationCount = await req.prisma.registration.count({
      where: {
        eventId,
        categoryId,
        status: { in: ['REGISTERED', 'CONFIRMED'] }
      }
    });

    if (registrationCount >= category.maxRiders) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Category is full'
      });
    }

    // Create registration
    const registration = await req.prisma.registration.create({
      data: {
        eventId,
        categoryId,
        riderId,
        seed
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            venue: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            gender: true,
            wheel: true
          }
        },
        rider: {
          select: {
            id: true,
            plate: true,
            firstName: true,
            lastName: true,
            club: true,
            dateOfBirth: true,
            gender: true
          }
        }
      }
    });

    // Log registration creation
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entity: 'Registration',
        entityId: registration.id,
        newValues: value
      }
    });

    // Emit real-time update
    req.io.to(`event-${eventId}`).emit('registration-created', { registration });

    // Add calculated age
    const registrationWithAge = {
      ...registration,
      rider: {
        ...registration.rider,
        ageAtEvent: calculateAgeAtDate(registration.rider.dateOfBirth, registration.event.date)
      }
    };

    res.status(201).json({
      message: 'Registration created successfully',
      registration: registrationWithAge
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/registrations/bulk - Create multiple registrations
router.post('/bulk', authenticate, requireSecretaria, async (req, res, next) => {
  try {
    const { error, value } = bulkRegistrationSchema.validate(req.body);
    if (error) return next(error);

    const { eventId, categoryId, riderIds } = value;

    const results = {
      successful: [],
      failed: []
    };

    for (const riderId of riderIds) {
      try {
        // Use the same validation logic as single registration
        const singleRegistration = await req.prisma.registration.create({
          data: {
            eventId,
            categoryId,
            riderId
          },
          include: {
            event: { select: { id: true, name: true, date: true } },
            category: { select: { id: true, name: true } },
            rider: { select: { id: true, plate: true, firstName: true, lastName: true } }
          }
        });

        results.successful.push(singleRegistration);
      } catch (err) {
        results.failed.push({
          riderId,
          error: err.message
        });
      }
    }

    // Log bulk registration
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'BULK_CREATE',
        entity: 'Registration',
        entityId: 'bulk',
        newValues: {
          eventId,
          categoryId,
          riderIds,
          successful: results.successful.length,
          failed: results.failed.length
        }
      }
    });

    // Emit real-time update
    req.io.to(`event-${eventId}`).emit('bulk-registration-completed', { results });

    res.status(201).json({
      message: 'Bulk registration completed',
      results
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/registrations/:id - Update registration
router.put('/:id', authenticate, requireSecretaria, async (req, res, next) => {
  try {
    const { error, value } = updateRegistrationSchema.validate(req.body);
    if (error) return next(error);

    // Get current registration for audit log
    const currentRegistration = await req.prisma.registration.findUnique({
      where: { id: req.params.id }
    });

    if (!currentRegistration) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Registration not found'
      });
    }

    const registration = await req.prisma.registration.update({
      where: { id: req.params.id },
      data: value,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            venue: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            gender: true,
            wheel: true
          }
        },
        rider: {
          select: {
            id: true,
            plate: true,
            firstName: true,
            lastName: true,
            club: true,
            dateOfBirth: true,
            gender: true
          }
        }
      }
    });

    // Log registration update
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'Registration',
        entityId: registration.id,
        oldValues: currentRegistration,
        newValues: value
      }
    });

    // Emit real-time update
    req.io.to(`event-${registration.eventId}`).emit('registration-updated', { registration });

    // Add calculated age
    const registrationWithAge = {
      ...registration,
      rider: {
        ...registration.rider,
        ageAtEvent: calculateAgeAtDate(registration.rider.dateOfBirth, registration.event.date)
      }
    };

    res.json({
      message: 'Registration updated successfully',
      registration: registrationWithAge
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/registrations/:id - Delete registration
router.delete('/:id', authenticate, requireSecretaria, async (req, res, next) => {
  try {
    const registration = await req.prisma.registration.findUnique({
      where: { id: req.params.id },
      include: {
        event: true
      }
    });

    if (!registration) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Registration not found'
      });
    }

    // Check if event has started
    if (registration.event.status === 'ACTIVE') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot delete registration for active events'
      });
    }

    await req.prisma.registration.delete({
      where: { id: req.params.id }
    });

    // Log registration deletion
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        entity: 'Registration',
        entityId: req.params.id,
        oldValues: registration
      }
    });

    // Emit real-time update
    req.io.to(`event-${registration.eventId}`).emit('registration-deleted', { 
      registrationId: req.params.id 
    });

    res.json({ message: 'Registration deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/registrations/event/:eventId/category/:categoryId - Get registrations for event/category
router.get('/event/:eventId/category/:categoryId', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const { eventId, categoryId } = req.params;
    const { status = 'all' } = req.query;

    const where = {
      eventId,
      categoryId
    };

    if (status !== 'all') {
      where.status = status;
    }

    const registrations = await req.prisma.registration.findMany({
      where,
      orderBy: [
        { seed: 'asc' },
        { rider: { lastName: 'asc' } }
      ],
      include: {
        rider: {
          select: {
            id: true,
            plate: true,
            firstName: true,
            lastName: true,
            club: true,
            dateOfBirth: true,
            gender: true
          }
        },
        event: {
          select: {
            id: true,
            name: true,
            date: true
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
    });

    // Add calculated age at event date
    const registrationsWithAge = registrations.map(reg => ({
      ...reg,
      rider: {
        ...reg.rider,
        ageAtEvent: calculateAgeAtDate(reg.rider.dateOfBirth, reg.event.date)
      }
    }));

    res.json({ 
      registrations: registrationsWithAge,
      count: registrations.length
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
