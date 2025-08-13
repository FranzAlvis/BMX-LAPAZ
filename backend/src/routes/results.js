const express = require('express');
const Joi = require('joi');
const { authenticate, requireCronometraje, requireJuez, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createResultSchema = Joi.object({
  heatEntryId: Joi.string().uuid().required(),
  finishPos: Joi.number().integer().min(1).max(8).optional(),
  timeMs: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('OK', 'DQ', 'DNS', 'DNF').default('OK'),
  notes: Joi.string().max(500).allow('')
});

const updateResultSchema = Joi.object({
  finishPos: Joi.number().integer().min(1).max(8).optional(),
  timeMs: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('OK', 'DQ', 'DNS', 'DNF').optional(),
  notes: Joi.string().max(500).allow('')
});

const bulkResultsSchema = Joi.object({
  heatId: Joi.string().uuid().required(),
  results: Joi.array().items(
    Joi.object({
      heatEntryId: Joi.string().uuid().required(),
      finishPos: Joi.number().integer().min(1).max(8).optional(),
      timeMs: Joi.number().integer().min(0).optional(),
      status: Joi.string().valid('OK', 'DQ', 'DNS', 'DNF').default('OK'),
      notes: Joi.string().max(500).allow('')
    })
  ).min(1).required()
});

// GET /api/results - List results with filters
router.get('/', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      eventId, 
      raceId, 
      motoId, 
      heatId,
      riderId 
    } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    
    if (heatId) {
      where.heatEntry = { heatId };
    } else if (motoId) {
      where.heatEntry = { heat: { motoId } };
    } else if (raceId) {
      where.heatEntry = { heat: { moto: { raceId } } };
    } else if (eventId) {
      where.heatEntry = { heat: { moto: { race: { eventId } } } };
    }
    
    if (riderId) {
      where.heatEntry = { 
        ...where.heatEntry,
        riderId 
      };
    }

    const [results, total] = await Promise.all([
      req.prisma.result.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: [
          { recordedAt: 'desc' }
        ],
        include: {
          heatEntry: {
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
              heat: {
                include: {
                  moto: {
                    include: {
                      race: {
                        include: {
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
                              name: true
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          recorder: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      }),
      req.prisma.result.count({ where })
    ]);

    res.json({
      results,
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

// GET /api/results/:id - Get result by ID
router.get('/:id', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const result = await req.prisma.result.findUnique({
      where: { id: req.params.id },
      include: {
        heatEntry: {
          include: {
            rider: true,
            heat: {
              include: {
                moto: {
                  include: {
                    race: {
                      include: {
                        event: true,
                        category: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        recorder: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    if (!result) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Result not found'
      });
    }

    res.json({ result });
  } catch (error) {
    next(error);
  }
});

// POST /api/results - Create new result
router.post('/', authenticate, requireCronometraje, async (req, res, next) => {
  try {
    const { error, value } = createResultSchema.validate(req.body);
    if (error) return next(error);

    const { heatEntryId, finishPos, timeMs, status, notes } = value;

    // Validate heat entry exists
    const heatEntry = await req.prisma.heatEntry.findUnique({
      where: { id: heatEntryId },
      include: {
        result: true,
        heat: {
          include: {
            moto: {
              include: {
                race: {
                  include: {
                    event: true
                  }
                }
              }
            }
          }
        },
        rider: {
          select: {
            id: true,
            plate: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!heatEntry) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Heat entry not found'
      });
    }

    if (heatEntry.result) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Result already exists for this heat entry'
      });
    }

    // Validate finish position is unique within the heat (for OK status)
    if (status === 'OK' && finishPos) {
      const existingResult = await req.prisma.result.findFirst({
        where: {
          heatEntry: {
            heatId: heatEntry.heatId
          },
          finishPos,
          status: 'OK'
        }
      });

      if (existingResult) {
        return res.status(409).json({
          error: 'Conflict',
          message: `Position ${finishPos} is already taken in this heat`
        });
      }
    }

    // Create result
    const result = await req.prisma.result.create({
      data: {
        heatEntryId,
        finishPos: status === 'OK' ? finishPos : null,
        timeMs: status === 'OK' ? timeMs : null,
        status,
        notes,
        recordedBy: req.user.id
      },
      include: {
        heatEntry: {
          include: {
            rider: {
              select: {
                id: true,
                plate: true,
                firstName: true,
                lastName: true
              }
            },
            heat: {
              include: {
                moto: {
                  include: {
                    race: {
                      select: {
                        id: true,
                        eventId: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        recorder: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    // Log result creation
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entity: 'Result',
        entityId: result.id,
        newValues: value
      }
    });

    // Emit real-time update
    const eventId = result.heatEntry.heat.moto.race.eventId;
    const raceId = result.heatEntry.heat.moto.race.id;
    
    req.io.to(`event-${eventId}`).emit('result-created', { result });
    req.io.to(`race-${raceId}`).emit('result-created', { result });

    res.status(201).json({
      message: 'Result created successfully',
      result
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/results/bulk - Create multiple results for a heat
router.post('/bulk', authenticate, requireCronometraje, async (req, res, next) => {
  try {
    const { error, value } = bulkResultsSchema.validate(req.body);
    if (error) return next(error);

    const { heatId, results: resultsData } = value;

    // Validate heat exists
    const heat = await req.prisma.heat.findUnique({
      where: { id: heatId },
      include: {
        heatEntries: {
          include: {
            result: true,
            rider: {
              select: {
                id: true,
                plate: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        moto: {
          include: {
            race: {
              select: {
                id: true,
                eventId: true
              }
            }
          }
        }
      }
    });

    if (!heat) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Heat not found'
      });
    }

    // Check if any results already exist
    const existingResults = heat.heatEntries.filter(entry => entry.result);
    if (existingResults.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Some results already exist for this heat'
      });
    }

    // Validate all heat entry IDs belong to this heat
    const heatEntryIds = heat.heatEntries.map(entry => entry.id);
    const invalidEntries = resultsData.filter(result => 
      !heatEntryIds.includes(result.heatEntryId)
    );

    if (invalidEntries.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Some heat entry IDs do not belong to this heat'
      });
    }

    // Validate unique positions for OK status
    const okResults = resultsData.filter(r => r.status === 'OK' && r.finishPos);
    const positions = okResults.map(r => r.finishPos);
    const uniquePositions = [...new Set(positions)];

    if (positions.length !== uniquePositions.length) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Duplicate finish positions found'
      });
    }

    // Create all results
    const createdResults = [];
    const errors = [];

    for (const resultData of resultsData) {
      try {
        const result = await req.prisma.result.create({
          data: {
            heatEntryId: resultData.heatEntryId,
            finishPos: resultData.status === 'OK' ? resultData.finishPos : null,
            timeMs: resultData.status === 'OK' ? resultData.timeMs : null,
            status: resultData.status,
            notes: resultData.notes,
            recordedBy: req.user.id
          },
          include: {
            heatEntry: {
              include: {
                rider: {
                  select: {
                    id: true,
                    plate: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        });

        createdResults.push(result);
      } catch (err) {
        errors.push({
          heatEntryId: resultData.heatEntryId,
          error: err.message
        });
      }
    }

    // Log bulk result creation
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'BULK_CREATE',
        entity: 'Result',
        entityId: heatId,
        newValues: {
          heatId,
          resultsCount: createdResults.length,
          errorsCount: errors.length
        }
      }
    });

    // Emit real-time update
    const eventId = heat.moto.race.eventId;
    const raceId = heat.moto.race.id;
    
    req.io.to(`event-${eventId}`).emit('bulk-results-created', { 
      heatId, 
      results: createdResults 
    });
    req.io.to(`race-${raceId}`).emit('bulk-results-created', { 
      heatId, 
      results: createdResults 
    });

    res.status(201).json({
      message: 'Bulk results created',
      created: createdResults.length,
      errors: errors.length,
      results: createdResults,
      errorDetails: errors
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/results/:id - Update result
router.put('/:id', authenticate, requireCronometraje, async (req, res, next) => {
  try {
    const { error, value } = updateResultSchema.validate(req.body);
    if (error) return next(error);

    // Get current result for validation and audit log
    const currentResult = await req.prisma.result.findUnique({
      where: { id: req.params.id },
      include: {
        heatEntry: {
          include: {
            heat: true
          }
        }
      }
    });

    if (!currentResult) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Result not found'
      });
    }

    // Validate finish position is unique within the heat (for OK status)
    if (value.status === 'OK' && value.finishPos) {
      const existingResult = await req.prisma.result.findFirst({
        where: {
          heatEntry: {
            heatId: currentResult.heatEntry.heatId
          },
          finishPos: value.finishPos,
          status: 'OK',
          id: { not: req.params.id }
        }
      });

      if (existingResult) {
        return res.status(409).json({
          error: 'Conflict',
          message: `Position ${value.finishPos} is already taken in this heat`
        });
      }
    }

    // Clear position and time if status is not OK
    const updateData = { ...value };
    if (value.status && value.status !== 'OK') {
      updateData.finishPos = null;
      updateData.timeMs = null;
    }

    const result = await req.prisma.result.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        heatEntry: {
          include: {
            rider: {
              select: {
                id: true,
                plate: true,
                firstName: true,
                lastName: true
              }
            },
            heat: {
              include: {
                moto: {
                  include: {
                    race: {
                      select: {
                        id: true,
                        eventId: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        recorder: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    // Log result update
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'Result',
        entityId: result.id,
        oldValues: currentResult,
        newValues: value
      }
    });

    // Emit real-time update
    const eventId = result.heatEntry.heat.moto.race.eventId;
    const raceId = result.heatEntry.heat.moto.race.id;
    
    req.io.to(`event-${eventId}`).emit('result-updated', { result });
    req.io.to(`race-${raceId}`).emit('result-updated', { result });

    res.json({
      message: 'Result updated successfully',
      result
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/results/:id - Delete result
router.delete('/:id', authenticate, requireCronometraje, async (req, res, next) => {
  try {
    const result = await req.prisma.result.findUnique({
      where: { id: req.params.id },
      include: {
        heatEntry: {
          include: {
            heat: {
              include: {
                moto: {
                  include: {
                    race: {
                      select: {
                        id: true,
                        eventId: true
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

    if (!result) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Result not found'
      });
    }

    await req.prisma.result.delete({
      where: { id: req.params.id }
    });

    // Log result deletion
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        entity: 'Result',
        entityId: req.params.id,
        oldValues: result
      }
    });

    // Emit real-time update
    const eventId = result.heatEntry.heat.moto.race.eventId;
    const raceId = result.heatEntry.heat.moto.race.id;
    
    req.io.to(`event-${eventId}`).emit('result-deleted', { 
      resultId: req.params.id,
      heatEntryId: result.heatEntryId
    });
    req.io.to(`race-${raceId}`).emit('result-deleted', { 
      resultId: req.params.id,
      heatEntryId: result.heatEntryId
    });

    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/results/heat/:heatId - Get all results for a heat
router.get('/heat/:heatId', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const heat = await req.prisma.heat.findUnique({
      where: { id: req.params.heatId },
      include: {
        moto: {
          include: {
            race: {
              include: {
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
                    name: true
                  }
                }
              }
            }
          }
        },
        heatEntries: {
          orderBy: { gateNo: 'asc' },
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
            result: {
              include: {
                recorder: {
                  select: {
                    id: true,
                    name: true,
                    role: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!heat) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Heat not found'
      });
    }

    // Sort entries by finish position for completed heats
    const sortedEntries = [...heat.heatEntries];
    const hasResults = sortedEntries.some(entry => entry.result);

    if (hasResults) {
      sortedEntries.sort((a, b) => {
        if (!a.result && !b.result) return a.gateNo - b.gateNo;
        if (!a.result) return 1;
        if (!b.result) return -1;
        
        if (a.result.status !== 'OK' && b.result.status !== 'OK') {
          return a.gateNo - b.gateNo;
        }
        if (a.result.status !== 'OK') return 1;
        if (b.result.status !== 'OK') return -1;
        
        return (a.result.finishPos || 9) - (b.result.finishPos || 9);
      });
    }

    res.json({
      heat: {
        ...heat,
        heatEntries: sortedEntries
      },
      stats: {
        totalEntries: heat.heatEntries.length,
        completedResults: heat.heatEntries.filter(entry => entry.result).length,
        isComplete: heat.heatEntries.every(entry => entry.result)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
