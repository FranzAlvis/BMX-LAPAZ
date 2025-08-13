const express = require('express');
const Joi = require('joi');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const { authenticate, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const reportSchema = Joi.object({
  eventId: Joi.string().uuid().required(),
  categoryId: Joi.string().uuid().optional(),
  raceId: Joi.string().uuid().optional(),
  format: Joi.string().valid('json', 'csv', 'pdf').default('json')
});

// GET /api/reports/starting-lists/:eventId - Generate starting lists
router.get('/starting-lists/:eventId', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { categoryId, format = 'json' } = req.query;

    const where = { eventId };
    if (categoryId) where.categoryId = categoryId;

    // Get event with races and starting lists
    const event = await req.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        races: {
          where: categoryId ? { categoryId } : {},
          include: {
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
                        }
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

    const startingLists = {
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        venue: event.venue,
        city: event.city
      },
      races: event.races.map(race => ({
        id: race.id,
        category: race.category,
        status: race.status,
        motos: race.motos.map(moto => ({
          id: moto.id,
          type: moto.type,
          orderNo: moto.orderNo,
          scheduledAt: moto.scheduledAt,
          heats: moto.heats.map(heat => ({
            id: heat.id,
            heatNo: heat.heatNo,
            entries: heat.heatEntries.map(entry => ({
              gateNo: entry.gateNo,
              rider: entry.rider
            }))
          }))
        }))
      }))
    };

    if (format === 'csv') {
      // Generate CSV format
      const csvData = [];
      
      startingLists.races.forEach(race => {
        race.motos.forEach(moto => {
          moto.heats.forEach(heat => {
            heat.entries.forEach(entry => {
              csvData.push({
                evento: event.name,
                categoria: race.category.name,
                moto: moto.type,
                manga: heat.heatNo,
                carril: entry.gateNo,
                placa: entry.rider.plate,
                nombre: `${entry.rider.firstName} ${entry.rider.lastName}`,
                club: entry.rider.club || ''
              });
            });
          });
        });
      });

      const filename = `starting_lists_${event.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      const filepath = path.join('uploads', filename);

      const csvWriter = createCsvWriter({
        path: filepath,
        header: [
          { id: 'evento', title: 'Evento' },
          { id: 'categoria', title: 'Categoría' },
          { id: 'moto', title: 'Moto' },
          { id: 'manga', title: 'Manga' },
          { id: 'carril', title: 'Carril' },
          { id: 'placa', title: 'Placa' },
          { id: 'nombre', title: 'Nombre' },
          { id: 'club', title: 'Club' }
        ]
      });

      await csvWriter.writeRecords(csvData);

      res.download(filepath, filename, (err) => {
        if (err) {
          next(err);
        } else {
          fs.unlinkSync(filepath);
        }
      });
    } else {
      res.json({ startingLists });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/results/:eventId - Generate results report
router.get('/results/:eventId', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { categoryId, format = 'json' } = req.query;

    const where = { eventId };
    if (categoryId) where.categoryId = categoryId;

    // Get event with complete results
    const event = await req.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        races: {
          where: categoryId ? { categoryId } : {},
          include: {
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
        }
      }
    });

    if (!event) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Event not found'
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

    const resultsReport = {
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        venue: event.venue,
        city: event.city
      },
      races: event.races.map(race => {
        // Calculate standings for this race
        const riderStandings = {};

        race.motos.forEach(moto => {
          moto.heats.forEach(heat => {
            heat.heatEntries.forEach(entry => {
              if (!riderStandings[entry.rider.id]) {
                riderStandings[entry.rider.id] = {
                  rider: entry.rider,
                  motos: [],
                  totalPoints: 0,
                  bestPosition: 9,
                  bestTime: null
                };
              }

              const standing = riderStandings[entry.rider.id];

              if (entry.result) {
                const points = entry.result.status === 'OK' 
                  ? (pointsMap[entry.result.finishPos] || 9)
                  : 9;

                standing.motos.push({
                  motoType: moto.type,
                  position: entry.result.finishPos,
                  points,
                  time: entry.result.timeMs,
                  status: entry.result.status
                });

                standing.totalPoints += points;

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

        // Sort standings
        const standings = Object.values(riderStandings).sort((a, b) => {
          if (a.totalPoints !== b.totalPoints) {
            return a.totalPoints - b.totalPoints;
          }
          if (a.bestPosition !== b.bestPosition) {
            return a.bestPosition - b.bestPosition;
          }
          if (a.bestTime && b.bestTime) {
            return a.bestTime - b.bestTime;
          }
          return a.rider.plate - b.rider.plate;
        });

        standings.forEach((standing, index) => {
          standing.rank = index + 1;
        });

        return {
          id: race.id,
          category: race.category,
          status: race.status,
          standings,
          motos: race.motos.map(moto => ({
            id: moto.id,
            type: moto.type,
            orderNo: moto.orderNo,
            heats: moto.heats.map(heat => ({
              id: heat.id,
              heatNo: heat.heatNo,
              results: heat.heatEntries
                .filter(entry => entry.result)
                .sort((a, b) => {
                  if (a.result.status !== 'OK' && b.result.status !== 'OK') {
                    return a.gateNo - b.gateNo;
                  }
                  if (a.result.status !== 'OK') return 1;
                  if (b.result.status !== 'OK') return -1;
                  return (a.result.finishPos || 9) - (b.result.finishPos || 9);
                })
                .map(entry => ({
                  rider: entry.rider,
                  gateNo: entry.gateNo,
                  result: entry.result
                }))
            }))
          }))
        };
      })
    };

    if (format === 'csv') {
      // Generate CSV format for final standings
      const csvData = [];
      
      resultsReport.races.forEach(race => {
        race.standings.forEach(standing => {
          csvData.push({
            evento: event.name,
            categoria: race.category.name,
            posicion: standing.rank,
            placa: standing.rider.plate,
            nombre: `${standing.rider.firstName} ${standing.rider.lastName}`,
            club: standing.rider.club || '',
            puntos_totales: standing.totalPoints,
            mejor_posicion: standing.bestPosition,
            mejor_tiempo: standing.bestTime ? (standing.bestTime / 1000).toFixed(3) : ''
          });
        });
      });

      const filename = `results_${event.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      const filepath = path.join('uploads', filename);

      const csvWriter = createCsvWriter({
        path: filepath,
        header: [
          { id: 'evento', title: 'Evento' },
          { id: 'categoria', title: 'Categoría' },
          { id: 'posicion', title: 'Posición' },
          { id: 'placa', title: 'Placa' },
          { id: 'nombre', title: 'Nombre' },
          { id: 'club', title: 'Club' },
          { id: 'puntos_totales', title: 'Puntos Totales' },
          { id: 'mejor_posicion', title: 'Mejor Posición' },
          { id: 'mejor_tiempo', title: 'Mejor Tiempo (s)' }
        ]
      });

      await csvWriter.writeRecords(csvData);

      res.download(filepath, filename, (err) => {
        if (err) {
          next(err);
        } else {
          fs.unlinkSync(filepath);
        }
      });
    } else {
      res.json({ resultsReport });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/podium/:eventId - Generate podium report
router.get('/podium/:eventId', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { format = 'json' } = req.query;

    // Get event with final results
    const event = await req.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        races: {
          where: { status: 'COMPLETED' },
          include: {
            category: true,
            motos: {
              where: { type: 'Final' },
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
        }
      }
    });

    if (!event) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Event not found'
      });
    }

    const podiumReport = {
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        venue: event.venue,
        city: event.city
      },
      podiums: event.races.map(race => {
        const finalMoto = race.motos.find(m => m.type === 'Final');
        if (!finalMoto || !finalMoto.heats.length) {
          return {
            category: race.category,
            podium: []
          };
        }

        // Get final results
        const finalResults = [];
        finalMoto.heats.forEach(heat => {
          heat.heatEntries.forEach(entry => {
            if (entry.result && entry.result.status === 'OK') {
              finalResults.push({
                rider: entry.rider,
                position: entry.result.finishPos,
                time: entry.result.timeMs
              });
            }
          });
        });

        // Sort by position
        finalResults.sort((a, b) => a.position - b.position);

        return {
          category: race.category,
          podium: finalResults.slice(0, 8) // Top 8 finishers
        };
      }).filter(p => p.podium.length > 0)
    };

    if (format === 'csv') {
      const csvData = [];
      
      podiumReport.podiums.forEach(podium => {
        podium.podium.forEach(result => {
          csvData.push({
            evento: event.name,
            categoria: podium.category.name,
            posicion: result.position,
            placa: result.rider.plate,
            nombre: `${result.rider.firstName} ${result.rider.lastName}`,
            club: result.rider.club || '',
            tiempo: result.time ? (result.time / 1000).toFixed(3) : ''
          });
        });
      });

      const filename = `podium_${event.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      const filepath = path.join('uploads', filename);

      const csvWriter = createCsvWriter({
        path: filepath,
        header: [
          { id: 'evento', title: 'Evento' },
          { id: 'categoria', title: 'Categoría' },
          { id: 'posicion', title: 'Posición' },
          { id: 'placa', title: 'Placa' },
          { id: 'nombre', title: 'Nombre' },
          { id: 'club', title: 'Club' },
          { id: 'tiempo', title: 'Tiempo (s)' }
        ]
      });

      await csvWriter.writeRecords(csvData);

      res.download(filepath, filename, (err) => {
        if (err) {
          next(err);
        } else {
          fs.unlinkSync(filepath);
        }
      });
    } else {
      res.json({ podiumReport });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/ranking - Generate annual ranking
router.get('/ranking', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const { year = new Date().getFullYear(), categoryId, format = 'json' } = req.query;

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const where = {
      date: {
        gte: startDate,
        lte: endDate
      },
      status: 'COMPLETED'
    };

    // Get completed events for the year
    const events = await req.prisma.event.findMany({
      where,
      include: {
        races: {
          where: categoryId ? { categoryId } : {},
          include: {
            category: true,
            motos: {
              where: { type: 'Final' },
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
        }
      },
      orderBy: { date: 'asc' }
    });

    // Calculate annual rankings
    const categoryRankings = {};

    events.forEach(event => {
      event.races.forEach(race => {
        const categoryKey = race.category.id;
        
        if (!categoryRankings[categoryKey]) {
          categoryRankings[categoryKey] = {
            category: race.category,
            riders: {},
            events: []
          };
        }

        categoryRankings[categoryKey].events.push({
          id: event.id,
          name: event.name,
          date: event.date,
          venue: event.venue
        });

        // Process final results
        const finalMoto = race.motos.find(m => m.type === 'Final');
        if (finalMoto && finalMoto.heats.length > 0) {
          finalMoto.heats.forEach(heat => {
            heat.heatEntries.forEach(entry => {
              if (entry.result && entry.result.status === 'OK') {
                const riderId = entry.rider.id;
                
                if (!categoryRankings[categoryKey].riders[riderId]) {
                  categoryRankings[categoryKey].riders[riderId] = {
                    rider: entry.rider,
                    events: [],
                    totalPoints: 0,
                    bestFinish: 8,
                    eventsCount: 0
                  };
                }

                const riderRanking = categoryRankings[categoryKey].riders[riderId];
                const points = 9 - entry.result.finishPos; // 1st = 8 pts, 2nd = 7 pts, etc.

                riderRanking.events.push({
                  eventId: event.id,
                  eventName: event.name,
                  position: entry.result.finishPos,
                  points,
                  time: entry.result.timeMs
                });

                riderRanking.totalPoints += points;
                riderRanking.eventsCount++;
                
                if (entry.result.finishPos < riderRanking.bestFinish) {
                  riderRanking.bestFinish = entry.result.finishPos;
                }
              }
            });
          });
        }
      });
    });

    // Convert to sorted arrays
    const rankingReport = {
      year: parseInt(year),
      categories: Object.values(categoryRankings).map(categoryRanking => {
        const sortedRiders = Object.values(categoryRanking.riders)
          .sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) {
              return b.totalPoints - a.totalPoints;
            }
            if (a.bestFinish !== b.bestFinish) {
              return a.bestFinish - b.bestFinish;
            }
            return b.eventsCount - a.eventsCount;
          })
          .map((rider, index) => ({
            ...rider,
            rank: index + 1
          }));

        return {
          category: categoryRanking.category,
          events: categoryRanking.events,
          riders: sortedRiders
        };
      })
    };

    if (format === 'csv') {
      const csvData = [];
      
      rankingReport.categories.forEach(category => {
        category.riders.forEach(rider => {
          csvData.push({
            año: year,
            categoria: category.category.name,
            posicion: rider.rank,
            placa: rider.rider.plate,
            nombre: `${rider.rider.firstName} ${rider.rider.lastName}`,
            club: rider.rider.club || '',
            puntos_totales: rider.totalPoints,
            mejor_posicion: rider.bestFinish,
            eventos_participados: rider.eventsCount
          });
        });
      });

      const filename = `ranking_${year}_${new Date().toISOString().split('T')[0]}.csv`;
      const filepath = path.join('uploads', filename);

      const csvWriter = createCsvWriter({
        path: filepath,
        header: [
          { id: 'año', title: 'Año' },
          { id: 'categoria', title: 'Categoría' },
          { id: 'posicion', title: 'Posición' },
          { id: 'placa', title: 'Placa' },
          { id: 'nombre', title: 'Nombre' },
          { id: 'club', title: 'Club' },
          { id: 'puntos_totales', title: 'Puntos Totales' },
          { id: 'mejor_posicion', title: 'Mejor Posición' },
          { id: 'eventos_participados', title: 'Eventos Participados' }
        ]
      });

      await csvWriter.writeRecords(csvData);

      res.download(filepath, filename, (err) => {
        if (err) {
          next(err);
        } else {
          fs.unlinkSync(filepath);
        }
      });
    } else {
      res.json({ rankingReport });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
