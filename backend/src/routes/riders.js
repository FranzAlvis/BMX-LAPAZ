const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const { authenticate, requireSecretaria, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

// Multer configuration for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 } // 5MB
});

// Validation schemas
const createRiderSchema = Joi.object({
  plate: Joi.number().integer().min(1).max(9999).required(),
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required(),
  club: Joi.string().max(100).allow(''),
  dateOfBirth: Joi.date().required(),
  gender: Joi.string().valid('M', 'F').required(),
  license: Joi.string().max(50).allow(''),
  phone: Joi.string().max(20).allow(''),
  email: Joi.string().email().allow(''),
  categoryId: Joi.string().uuid().allow('')
});

const updateRiderSchema = Joi.object({
  plate: Joi.number().integer().min(1).max(9999),
  firstName: Joi.string().min(2).max(100),
  lastName: Joi.string().min(2).max(100),
  club: Joi.string().max(100).allow(''),
  dateOfBirth: Joi.date(),
  gender: Joi.string().valid('M', 'F'),
  license: Joi.string().max(50).allow(''),
  phone: Joi.string().max(20).allow(''),
  email: Joi.string().email().allow(''),
  categoryId: Joi.string().uuid().allow(''),
  isActive: Joi.boolean()
});

// Helper function to calculate age
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// GET /api/riders - List all riders
router.get('/', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, gender, club, isActive = 'true' } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (isActive !== 'all') where.isActive = isActive === 'true';
    if (gender) where.gender = gender;
    if (club) where.club = { contains: club, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { plate: { equals: parseInt(search) || 0 } }
      ];
    }

    const [riders, total] = await Promise.all([
      req.prisma.rider.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ],
        include: {
          category: {
            select: {
              id: true,
              name: true,
              minAge: true,
              maxAge: true,
              gender: true,
              wheel: true
            }
          },
          _count: {
            select: {
              registrations: true
            }
          }
        }
      }),
      req.prisma.rider.count({ where })
    ]);

    // Add calculated age to each rider
    const ridersWithAge = riders.map(rider => ({
      ...rider,
      age: calculateAge(rider.dateOfBirth)
    }));

    res.json({
      riders: ridersWithAge,
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

// GET /api/riders/:id - Get rider by ID
router.get('/:id', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const rider = await req.prisma.rider.findUnique({
      where: { id: req.params.id },
      include: {
        registrations: {
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
            }
          },
          orderBy: {
            event: {
              date: 'desc'
            }
          }
        }
      }
    });

    if (!rider) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Rider not found'
      });
    }

    // Add calculated age
    const riderWithAge = {
      ...rider,
      age: calculateAge(rider.dateOfBirth)
    };

    res.json({ rider: riderWithAge });
  } catch (error) {
    next(error);
  }
});

// POST /api/riders - Create new rider
router.post('/', authenticate, requireSecretaria, async (req, res, next) => {
  try {
    const { error, value } = createRiderSchema.validate(req.body);
    if (error) return next(error);

    const rider = await req.prisma.rider.create({
      data: value,
      include: {
        _count: {
          select: {
            registrations: true
          }
        }
      }
    });

    // Log rider creation
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entity: 'Rider',
        entityId: rider.id,
        newValues: value
      }
    });

    // Add calculated age
    const riderWithAge = {
      ...rider,
      age: calculateAge(rider.dateOfBirth)
    };

    res.status(201).json({
      message: 'Rider created successfully',
      rider: riderWithAge
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/riders/:id - Update rider
router.put('/:id', authenticate, requireSecretaria, async (req, res, next) => {
  try {
    const { error, value } = updateRiderSchema.validate(req.body);
    if (error) return next(error);

    // Get current rider for audit log
    const currentRider = await req.prisma.rider.findUnique({
      where: { id: req.params.id }
    });

    if (!currentRider) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Rider not found'
      });
    }

    const rider = await req.prisma.rider.update({
      where: { id: req.params.id },
      data: value,
      include: {
        _count: {
          select: {
            registrations: true
          }
        }
      }
    });

    // Log rider update
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'Rider',
        entityId: rider.id,
        oldValues: currentRider,
        newValues: value
      }
    });

    // Add calculated age
    const riderWithAge = {
      ...rider,
      age: calculateAge(rider.dateOfBirth)
    };

    res.json({
      message: 'Rider updated successfully',
      rider: riderWithAge
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/riders/:id - Delete rider
router.delete('/:id', authenticate, requireSecretaria, async (req, res, next) => {
  try {
    const rider = await req.prisma.rider.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            registrations: true
          }
        }
      }
    });

    if (!rider) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Rider not found'
      });
    }

    if (rider._count.registrations > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot delete rider with existing registrations'
      });
    }

    await req.prisma.rider.delete({
      where: { id: req.params.id }
    });

    // Log rider deletion
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        entity: 'Rider',
        entityId: req.params.id,
        oldValues: rider
      }
    });

    res.json({ message: 'Rider deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/riders/import - Import riders from CSV
router.post('/import', authenticate, requireSecretaria, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'CSV file is required'
      });
    }

    const results = [];
    const errors = [];
    let lineNumber = 1;

    // Read and parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        lineNumber++;
        try {
          // Validate and transform data
          const riderData = {
            plate: parseInt(data.plate),
            firstName: data.firstName || data.first_name || '',
            lastName: data.lastName || data.last_name || '',
            club: data.club || '',
            dateOfBirth: new Date(data.dateOfBirth || data.date_of_birth),
            gender: (data.gender || '').toUpperCase(),
            license: data.license || '',
            phone: data.phone || '',
            email: data.email || ''
          };

          const { error } = createRiderSchema.validate(riderData);
          if (error) {
            errors.push({
              line: lineNumber,
              error: error.details[0].message,
              data
            });
          } else {
            results.push(riderData);
          }
        } catch (err) {
          errors.push({
            line: lineNumber,
            error: 'Invalid data format',
            data
          });
        }
      })
      .on('end', async () => {
        try {
          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          if (errors.length > 0) {
            return res.status(400).json({
              error: 'Validation Error',
              message: 'CSV contains invalid data',
              errors,
              validRecords: results.length
            });
          }

          // Import valid riders
          const importedRiders = [];
          const importErrors = [];

          for (const riderData of results) {
            try {
              const rider = await req.prisma.rider.create({
                data: riderData
              });
              importedRiders.push(rider);
            } catch (err) {
              importErrors.push({
                plate: riderData.plate,
                name: `${riderData.firstName} ${riderData.lastName}`,
                error: err.message
              });
            }
          }

          // Log import
          await req.prisma.auditLog.create({
            data: {
              userId: req.user.id,
              action: 'IMPORT',
              entity: 'Rider',
              entityId: 'bulk',
              newValues: {
                totalRecords: results.length,
                imported: importedRiders.length,
                errors: importErrors.length
              }
            }
          });

          res.json({
            message: 'Import completed',
            imported: importedRiders.length,
            errors: importErrors.length,
            importErrors
          });
        } catch (err) {
          next(err);
        }
      })
      .on('error', (err) => {
        fs.unlinkSync(req.file.path);
        next(err);
      });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    next(error);
  }
});

// GET /api/riders/export - Export riders to CSV
router.get('/export', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const { format = 'csv' } = req.query;

    const riders = await req.prisma.rider.findMany({
      where: { isActive: true },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    if (format === 'csv') {
      const filename = `riders_${new Date().toISOString().split('T')[0]}.csv`;
      const filepath = path.join('uploads', filename);

      const csvWriter = createCsvWriter({
        path: filepath,
        header: [
          { id: 'plate', title: 'Placa' },
          { id: 'firstName', title: 'Nombre' },
          { id: 'lastName', title: 'Apellido' },
          { id: 'club', title: 'Club' },
          { id: 'dateOfBirth', title: 'Fecha Nacimiento' },
          { id: 'gender', title: 'Género' },
          { id: 'license', title: 'Licencia' },
          { id: 'phone', title: 'Teléfono' },
          { id: 'email', title: 'Email' }
        ]
      });

      await csvWriter.writeRecords(riders);

      res.download(filepath, filename, (err) => {
        if (err) {
          next(err);
        } else {
          // Clean up file after download
          fs.unlinkSync(filepath);
        }
      });
    } else {
      // Return JSON format
      const ridersWithAge = riders.map(rider => ({
        ...rider,
        age: calculateAge(rider.dateOfBirth)
      }));

      res.json({ riders: ridersWithAge });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
