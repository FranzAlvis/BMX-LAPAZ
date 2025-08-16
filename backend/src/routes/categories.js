const express = require('express');
const Joi = require('joi');
const { authenticate, requireSecretaria, requireAnyRole } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createCategorySchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  minAge: Joi.number().integer().min(0).max(99).required(),
  maxAge: Joi.number().integer().min(0).max(99).required(),
  gender: Joi.string().valid('M', 'F', 'Mixed').required(),
  wheel: Joi.string().valid('TWENTY_INCH', 'TWENTY_FOUR_INCH', 'Cruiser').default('TWENTY_INCH'),
  maxRiders: Joi.number().integer().min(1).max(64).default(32)
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(3).max(100),
  minAge: Joi.number().integer().min(0).max(99),
  maxAge: Joi.number().integer().min(0).max(99),
  gender: Joi.string().valid('M', 'F', 'Mixed'),
  wheel: Joi.string().valid('TWENTY_INCH', 'TWENTY_FOUR_INCH', 'Cruiser'),
  maxRiders: Joi.number().integer().min(1).max(64),
  isActive: Joi.boolean()
});

// GET /api/categories - List all categories (public access for dropdown)
router.get('/', async (req, res, next) => {
  try {
    const { isActive = 'true', gender, wheel } = req.query;

    const where = {};
    if (isActive !== 'all') where.isActive = isActive === 'true';
    if (gender) where.gender = gender;
    if (wheel) where.wheel = wheel;

    const categories = await req.prisma.category.findMany({
      where,
      orderBy: [
        { minAge: 'asc' },
        { gender: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: {
            registrations: true,
            races: true
          }
        }
      }
    });

    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

// GET /api/categories/:id - Get category by ID
router.get('/:id', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const category = await req.prisma.category.findUnique({
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
                club: true,
                dateOfBirth: true
              }
            },
            event: {
              select: {
                id: true,
                name: true,
                date: true
              }
            }
          },
          orderBy: {
            event: {
              date: 'desc'
            }
          }
        },
        races: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                date: true
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

    if (!category) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
    }

    res.json({ category });
  } catch (error) {
    next(error);
  }
});

// POST /api/categories - Create new category
router.post('/', authenticate, requireSecretaria, async (req, res, next) => {
  try {
    const { error, value } = createCategorySchema.validate(req.body);
    if (error) return next(error);

    // Validate age range
    if (value.minAge > value.maxAge) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Minimum age cannot be greater than maximum age'
      });
    }

    const category = await req.prisma.category.create({
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

    // Log category creation
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entity: 'Category',
        entityId: category.id,
        newValues: value
      }
    });

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', authenticate, requireSecretaria, async (req, res, next) => {
  try {
    const { error, value } = updateCategorySchema.validate(req.body);
    if (error) return next(error);

    // Validate age range if both ages are provided
    if (value.minAge !== undefined && value.maxAge !== undefined && value.minAge > value.maxAge) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Minimum age cannot be greater than maximum age'
      });
    }

    // Get current category for audit log
    const currentCategory = await req.prisma.category.findUnique({
      where: { id: req.params.id }
    });

    if (!currentCategory) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
    }

    const category = await req.prisma.category.update({
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

    // Log category update
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'Category',
        entityId: category.id,
        oldValues: currentCategory,
        newValues: value
      }
    });

    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', authenticate, requireSecretaria, async (req, res, next) => {
  try {
    const category = await req.prisma.category.findUnique({
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

    if (!category) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
    }

    if (category._count.registrations > 0 || category._count.races > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot delete category with existing registrations or races'
      });
    }

    await req.prisma.category.delete({
      where: { id: req.params.id }
    });

    // Log category deletion
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        entity: 'Category',
        entityId: req.params.id,
        oldValues: category
      }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/categories/:id/eligible-riders - Get riders eligible for this category
router.get('/:id/eligible-riders', authenticate, requireAnyRole, async (req, res, next) => {
  try {
    const { eventId } = req.query;

    const category = await req.prisma.category.findUnique({
      where: { id: req.params.id }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
    }

    // Calculate date range for age eligibility
    const today = new Date();
    const maxBirthDate = new Date(today.getFullYear() - category.minAge, today.getMonth(), today.getDate());
    const minBirthDate = new Date(today.getFullYear() - category.maxAge - 1, today.getMonth(), today.getDate());

    const where = {
      isActive: true,
      dateOfBirth: {
        gte: minBirthDate,
        lte: maxBirthDate
      }
    };

    // Filter by gender if not mixed
    if (category.gender !== 'Mixed') {
      where.gender = category.gender;
    }

    // Exclude already registered riders for this event/category
    if (eventId) {
      where.registrations = {
        none: {
          eventId,
          categoryId: req.params.id
        }
      };
    }

    const eligibleRiders = await req.prisma.rider.findMany({
      where,
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ],
      select: {
        id: true,
        plate: true,
        firstName: true,
        lastName: true,
        club: true,
        dateOfBirth: true,
        gender: true
      }
    });

    // Add calculated age
    const ridersWithAge = eligibleRiders.map(rider => ({
      ...rider,
      age: today.getFullYear() - new Date(rider.dateOfBirth).getFullYear()
    }));

    res.json({ 
      category: {
        id: category.id,
        name: category.name,
        minAge: category.minAge,
        maxAge: category.maxAge,
        gender: category.gender
      },
      eligibleRiders: ridersWithAge 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
