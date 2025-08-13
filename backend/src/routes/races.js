const express = require('express');
const Joi = require('joi');
const seedrandom = require('seedrandom');
const { authenticate, requireSecretaria, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createRaceSchema = Joi.object({
  eventId: Joi.string().uuid().required(),
  categoryId: Joi.string().uuid().required(),
  roundCount: Joi.number().integer().min(3).max(6).default(4)
});

const buildRaceSchema = Joi.object({
  gateChoiceForFinal: Joi.boolean().default(false), // true = gate choice by ranking, false = random
  customSeed: Joi.string().optional() // Optional custom seed for reproducibility
});

// Lane assignment algorithm (BEM-like)
class LaneAssignmentEngine {
  constructor(seed) {
    this.rng = seedrandom(seed);
  }

  // Generate lane assignments for all motos ensuring fairness
  generateLaneAssignments(riders, roundCount = 4) {
    const assignments = {};
    const riderCount = riders.length;
    
    if (riderCount <= 8) {
      // Single heat per moto
      assignments.M1 = this.generateSingleHeatAssignment(riders, 1);
      assignments.M2 = this.generateSingleHeatAssignment(riders, 2);
      assignments.M3 = this.generateSingleHeatAssignment(riders, 3);
      assignments.Final = this.generateSingleHeatAssignment(riders, 4);
    } else {
      // Multiple heats per moto
      const heatsPerMoto = Math.ceil(riderCount / 8);
      
      for (let moto = 1; moto <= roundCount; moto++) {
        const motoKey = moto === roundCount ? 'Final' : `M${moto}`;
        assignments[motoKey] = this.generateMultipleHeatAssignments(riders, moto, heatsPerMoto);
      }
    }

    return assignments;
  }

  generateSingleHeatAssignment(riders, motoNumber) {
    const shuffledRiders = [...riders].sort(() => this.rng() - 0.5);
    const gates = this.generateGateSequence(riders.length, motoNumber);
    
    return [{
      heatNo: 1,
      entries: shuffledRiders.map((rider, index) => ({
        riderId: rider.id,
        gateNo: gates[index % 8] || (index % 8) + 1
      }))
    }];
  }

  generateMultipleHeatAssignments(riders, motoNumber, heatsCount) {
    const heats = [];
    const shuffledRiders = [...riders].sort(() => this.rng() - 0.5);
    
    for (let heatNo = 1; heatNo <= heatsCount; heatNo++) {
      const heatRiders = shuffledRiders.slice((heatNo - 1) * 8, heatNo * 8);
      const gates = this.generateGateSequence(heatRiders.length, motoNumber + heatNo);
      
      heats.push({
        heatNo,
        entries: heatRiders.map((rider, index) => ({
          riderId: rider.id,
          gateNo: gates[index] || (index % 8) + 1
        }))
      });
    }
    
    return heats;
  }

  // Generate gate sequence ensuring different gates for each rider across motos
  generateGateSequence(riderCount, seed) {
    const localRng = seedrandom(`${seed}-gates`);
    const gates = [];
    const maxGates = Math.min(8, riderCount);
    
    // Create base sequence
    for (let i = 1; i <= maxGates; i++) {
      gates.push(i);
    }
    
    // Shuffle based on seed
    for (let i = gates.length - 1; i > 0; i--) {
      const j = Math.floor(localRng() * (i + 1));
      [gates[i], gates[j]] = [gates[j], gates[i]];
    }
    
    return gates;
  }

  // Generate final gate assignments (gate choice or random)
  generateFinalAssignment(qualifiedRiders, useGateChoice = false) {
    if (useGateChoice) {
      // Gate choice by ranking (best rider chooses first)
      const sortedRiders = [...qualifiedRiders].sort((a, b) => a.totalPoints - b.totalPoints);
      const assignments = [];
      const availableGates = [1, 2, 3, 4, 5, 6, 7, 8];
      
      sortedRiders.forEach((rider, index) => {
        // Simulate gate choice (in real implementation, this would be interactive)
        const preferredGates = this.getPreferredGates(index + 1);
        const chosenGate = availableGates.find(gate => preferredGates.includes(gate)) || availableGates[0];
        
        assignments.push({
          riderId: rider.id,
          gateNo: chosenGate,
          choiceOrder: index + 1
        });
        
        availableGates.splice(availableGates.indexOf(chosenGate), 1);
      });
      
      return assignments;
    } else {
      // Random assignment for final
      return this.generateSingleHeatAssignment(qualifiedRiders, 999)[0].entries;
    }
  }

  getPreferredGates(ranking) {
    // Typical gate preferences based on ranking
    const preferences = {
      1: [4, 5, 3, 6, 2, 7, 1, 8], // Best rider prefers middle gates
      2: [3, 4, 5, 2, 6, 1, 7, 8],
      3: [5, 4, 6, 3, 7, 2, 8, 1],
      4: [6, 5, 4, 7, 3, 8, 2, 1]
    };
    
    return preferences[ranking] || [1, 2, 3, 4, 5, 6, 7, 8];
  }
}

// GET /api/races - List races with filters
router.get('/', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const { eventId, categoryId, status } = req.query;

    const where = {};
    if (eventId) where.eventId = eventId;
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;

    const races = await req.prisma.race.findMany({
      where,
      orderBy: [
        { event: { date: 'desc' } },
        { category: { name: 'asc' } }
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
            wheel: true
          }
        },
        motos: {
          include: {
            heats: {
              include: {
                _count: {
                  select: {
                    heatEntries: true
                  }
                }
              }
            }
          }
        }
      }
    });

    res.json({ races });
  } catch (error) {
    next(error);
  }
});

// GET /api/races/:id - Get race by ID with full details
router.get('/:id', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const race = await req.prisma.race.findUnique({
      where: { id: req.params.id },
      include: {
        event: true,
        category: true,
        motos: {
          orderBy: { orderNo: 'asc' },
          include: {
            heats: {
              orderBy: { heatNo: 'asc' },
              include: {
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
                    result: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!race) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Race not found'
      });
    }

    res.json({ race });
  } catch (error) {
    next(error);
  }
});

// POST /api/races - Create new race
router.post('/', authenticate, requireSecretaria, async (req, res, next) => {
  try {
    const { error, value } = createRaceSchema.validate(req.body);
    if (error) return next(error);

    const { eventId, categoryId, roundCount } = value;

    // Validate event and category exist
    const [event, category] = await Promise.all([
      req.prisma.event.findUnique({ where: { id: eventId } }),
      req.prisma.category.findUnique({ where: { id: categoryId } })
    ]);

    if (!event) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Event not found'
      });
    }

    if (!category) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
    }

    // Check if race already exists for this event/category
    const existingRace = await req.prisma.race.findUnique({
      where: {
        eventId_categoryId: {
          eventId,
          categoryId
        }
      }
    });

    if (existingRace) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Race already exists for this event and category'
      });
    }

    // Generate seed for reproducible lane assignments
    const seedValue = `${eventId}-${categoryId}-${Date.now()}`;

    const race = await req.prisma.race.create({
      data: {
        eventId,
        categoryId,
        roundCount,
        seedValue
      },
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
            name: true,
            gender: true,
            wheel: true
          }
        }
      }
    });

    // Log race creation
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entity: 'Race',
        entityId: race.id,
        newValues: value
      }
    });

    res.status(201).json({
      message: 'Race created successfully',
      race
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/races/:id/build - Build motos, heats, and lane assignments
router.post('/:id/build', authenticate, requireSecretaria, async (req, res, next) => {
  try {
    const { error, value } = buildRaceSchema.validate(req.body);
    if (error) return next(error);

    const { gateChoiceForFinal = false, customSeed } = value;

    // Get race with registrations
    const race = await req.prisma.race.findUnique({
      where: { id: req.params.id },
      include: {
        event: true,
        category: true,
        motos: true
      }
    });

    if (!race) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Race not found'
      });
    }

    if (race.motos.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Race has already been built'
      });
    }

    // Get registered riders for this race
    const registrations = await req.prisma.registration.findMany({
      where: {
        eventId: race.eventId,
        categoryId: race.categoryId,
        status: { in: ['REGISTERED', 'CONFIRMED'] }
      },
      include: {
        rider: {
          select: {
            id: true,
            plate: true,
            firstName: true,
            lastName: true,
            club: true
          }
        }
      },
      orderBy: [
        { seed: 'asc' },
        { rider: { lastName: 'asc' } }
      ]
    });

    if (registrations.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No registered riders found for this race'
      });
    }

    // Initialize lane assignment engine
    const seed = customSeed || race.seedValue;
    const laneEngine = new LaneAssignmentEngine(seed);

    // Generate lane assignments
    const riders = registrations.map(reg => reg.rider);
    const assignments = laneEngine.generateLaneAssignments(riders, race.roundCount);

    // Create motos, heats, and heat entries
    const createdMotos = [];

    for (let motoOrder = 1; motoOrder <= race.roundCount; motoOrder++) {
      const motoType = motoOrder === race.roundCount ? 'Final' : `M${motoOrder}`;
      const motoKey = motoType;

      // Create moto
      const moto = await req.prisma.moto.create({
        data: {
          raceId: race.id,
          orderNo: motoOrder,
          type: motoType
        }
      });

      const createdHeats = [];

      // Create heats for this moto
      for (const heatData of assignments[motoKey]) {
        const heat = await req.prisma.heat.create({
          data: {
            motoId: moto.id,
            heatNo: heatData.heatNo
          }
        });

        // Create heat entries
        const heatEntries = [];
        for (const entry of heatData.entries) {
          const heatEntry = await req.prisma.heatEntry.create({
            data: {
              heatId: heat.id,
              riderId: entry.riderId,
              gateNo: entry.gateNo
            },
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
          });
          heatEntries.push(heatEntry);
        }

        createdHeats.push({
          ...heat,
          heatEntries
        });
      }

      createdMotos.push({
        ...moto,
        heats: createdHeats
      });
    }

    // Update race status
    await req.prisma.race.update({
      where: { id: race.id },
      data: { status: 'ACTIVE' }
    });

    // Log race build
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'BUILD',
        entity: 'Race',
        entityId: race.id,
        newValues: {
          ridersCount: riders.length,
          motosCount: createdMotos.length,
          seed,
          gateChoiceForFinal
        }
      }
    });

    // Emit real-time update
    req.io.to(`event-${race.eventId}`).emit('race-built', { 
      raceId: race.id,
      motos: createdMotos
    });

    res.json({
      message: 'Race built successfully',
      race: {
        ...race,
        status: 'ACTIVE',
        motos: createdMotos
      },
      stats: {
        ridersCount: riders.length,
        motosCount: createdMotos.length,
        heatsCount: createdMotos.reduce((sum, moto) => sum + moto.heats.length, 0),
        seed
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/races/:id/standings - Get current standings/points
router.get('/:id/standings', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const race = await req.prisma.race.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        motos: {
          where: { type: { not: 'Final' } }, // Only qualifying motos
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
                        lastName: true,
                        club: true
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
    });

    if (!race) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Race not found'
      });
    }

    // Get points table
    const pointsTable = await req.prisma.pointsTable.findMany({
      where: { isDefault: true },
      orderBy: { place: 'asc' }
    });

    const pointsMap = {};
    pointsTable.forEach(pt => {
      pointsMap[pt.place] = pt.points;
    });

    // Calculate standings
    const riderStandings = {};

    race.motos.forEach(moto => {
      moto.heats.forEach(heat => {
        heat.heatEntries.forEach(entry => {
          if (!riderStandings[entry.riderId]) {
            riderStandings[entry.riderId] = {
              rider: entry.rider,
              motos: [],
              totalPoints: 0,
              bestPosition: 9,
              bestTime: null,
              completedMotos: 0
            };
          }

          const standing = riderStandings[entry.riderId];
          
          if (entry.result) {
            const points = entry.result.status === 'OK' 
              ? (pointsMap[entry.result.finishPos] || 9)
              : 9; // DNF/DNS/DQ = 9 points

            standing.motos.push({
              motoType: moto.type,
              position: entry.result.finishPos,
              points,
              time: entry.result.timeMs,
              status: entry.result.status
            });

            standing.totalPoints += points;
            standing.completedMotos++;

            if (entry.result.status === 'OK' && entry.result.finishPos < standing.bestPosition) {
              standing.bestPosition = entry.result.finishPos;
            }

            if (entry.result.timeMs && (!standing.bestTime || entry.result.timeMs < standing.bestTime)) {
              standing.bestTime = entry.result.timeMs;
            }
          }
        });
      });
    });

    // Convert to array and sort by standings
    const standings = Object.values(riderStandings).sort((a, b) => {
      // Primary: total points (lower is better)
      if (a.totalPoints !== b.totalPoints) {
        return a.totalPoints - b.totalPoints;
      }
      
      // Tiebreaker 1: best position
      if (a.bestPosition !== b.bestPosition) {
        return a.bestPosition - b.bestPosition;
      }
      
      // Tiebreaker 2: best time
      if (a.bestTime && b.bestTime) {
        return a.bestTime - b.bestTime;
      }
      
      // Tiebreaker 3: rider plate number
      return a.rider.plate - b.rider.plate;
    });

    // Add ranking
    standings.forEach((standing, index) => {
      standing.rank = index + 1;
      standing.qualifiesForFinal = index < 8; // Top 8 qualify
    });

    res.json({
      race: {
        id: race.id,
        category: race.category,
        status: race.status
      },
      standings,
      stats: {
        totalRiders: standings.length,
        completedMotos: race.motos.filter(m => m.type !== 'Final').length,
        qualifiedForFinal: standings.filter(s => s.qualifiesForFinal).length
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/races/:id - Delete race (only if no results)
router.delete('/:id', authenticate, requireSecretaria, async (req, res, next) => {
  try {
    const race = await req.prisma.race.findUnique({
      where: { id: req.params.id },
      include: {
        motos: {
          include: {
            heats: {
              include: {
                heatEntries: {
                  include: {
                    result: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!race) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Race not found'
      });
    }

    // Check if race has results
    const hasResults = race.motos.some(moto => 
      moto.heats.some(heat => 
        heat.heatEntries.some(entry => entry.result)
      )
    );

    if (hasResults) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot delete race with existing results'
      });
    }

    await req.prisma.race.delete({
      where: { id: req.params.id }
    });

    // Log race deletion
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        entity: 'Race',
        entityId: req.params.id,
        oldValues: race
      }
    });

    res.json({ message: 'Race deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
