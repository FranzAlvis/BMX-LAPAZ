const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('Admin', 'Secretaria', 'Cronometraje', 'Juez', 'Publico').required()
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  role: Joi.string().valid('Admin', 'Secretaria', 'Cronometraje', 'Juez', 'Publico'),
  isActive: Joi.boolean()
});

const resetPasswordSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  newPassword: Joi.string().min(6).required()
});

const pointsTableSchema = Joi.object({
  place: Joi.number().integer().min(1).max(9).required(),
  points: Joi.number().integer().min(1).max(9).required()
});

// GET /api/admin/users - List all users
router.get('/users', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, isActive = 'all' } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (isActive !== 'all') where.isActive = isActive === 'true';

    const [users, total] = await Promise.all([
      req.prisma.user.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: [
          { name: 'asc' }
        ],
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      req.prisma.user.count({ where })
    ]);

    res.json({
      users,
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

// GET /api/admin/users/:id - Get user by ID
router.get('/users/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            auditLogs: true,
            results: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/users - Create new user
router.post('/users', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) return next(error);

    const { name, email, password, role } = value;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await req.prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    // Log user creation
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entity: 'User',
        entityId: user.id,
        newValues: { name, email, role }
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/users/:id - Update user
router.put('/users/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) return next(error);

    // Get current user for audit log
    const currentUser = await req.prisma.user.findUnique({
      where: { id: req.params.id }
    });

    if (!currentUser) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating themselves
    if (req.params.id === req.user.id && value.isActive === false) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot deactivate your own account'
      });
    }

    const updateData = { ...value };
    if (value.email) {
      updateData.email = value.email.toLowerCase();
    }

    const user = await req.prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Log user update
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'User',
        entityId: user.id,
        oldValues: currentUser,
        newValues: value
      }
    });

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/reset-password - Reset user password
router.post('/reset-password', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) return next(error);

    const { userId, newPassword } = value;

    const user = await req.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await req.prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    // Log password reset
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PASSWORD_RESET',
        entity: 'User',
        entityId: userId,
        newValues: { resetBy: req.user.id, timestamp: new Date() }
      }
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/points-table - Get points table
router.get('/points-table', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const pointsTable = await req.prisma.pointsTable.findMany({
      where: { isDefault: true },
      orderBy: { place: 'asc' }
    });

    res.json({ pointsTable });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/points-table - Update points table
router.put('/points-table', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { error, value } = Joi.array().items(pointsTableSchema).validate(req.body);
    if (error) return next(error);

    // Get current points table for audit log
    const currentPointsTable = await req.prisma.pointsTable.findMany({
      where: { isDefault: true }
    });

    // Delete current default points table
    await req.prisma.pointsTable.deleteMany({
      where: { isDefault: true }
    });

    // Create new points table
    const newPointsTable = await Promise.all(
      value.map(point => 
        req.prisma.pointsTable.create({
          data: {
            place: point.place,
            points: point.points,
            isDefault: true
          }
        })
      )
    );

    // Log points table update
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'PointsTable',
        entityId: 'default',
        oldValues: currentPointsTable,
        newValues: value
      }
    });

    res.json({
      message: 'Points table updated successfully',
      pointsTable: newPointsTable
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/audit-logs - Get audit logs
router.get('/audit-logs', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      entity, 
      action, 
      userId,
      startDate,
      endDate
    } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [auditLogs, total] = await Promise.all([
      req.prisma.auditLog.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      }),
      req.prisma.auditLog.count({ where })
    ]);

    res.json({
      auditLogs,
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

// GET /api/admin/stats - Get system statistics
router.get('/stats', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalRiders,
      totalEvents,
      totalRaces,
      activeEvents,
      completedEvents,
      totalRegistrations,
      totalResults
    ] = await Promise.all([
      req.prisma.user.count(),
      req.prisma.rider.count({ where: { isActive: true } }),
      req.prisma.event.count(),
      req.prisma.race.count(),
      req.prisma.event.count({ where: { status: 'ACTIVE' } }),
      req.prisma.event.count({ where: { status: 'COMPLETED' } }),
      req.prisma.registration.count({ where: { status: { in: ['REGISTERED', 'CONFIRMED'] } } }),
      req.prisma.result.count()
    ]);

    // Get recent activity
    const recentActivity = await req.prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            role: true
          }
        }
      }
    });

    // Get user role distribution
    const userRoles = await req.prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
      where: { isActive: true }
    });

    const stats = {
      overview: {
        totalUsers,
        totalRiders,
        totalEvents,
        totalRaces,
        activeEvents,
        completedEvents,
        totalRegistrations,
        totalResults
      },
      userRoles: userRoles.map(role => ({
        role: role.role,
        count: role._count.role
      })),
      recentActivity: recentActivity.map(log => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        user: log.user?.name || 'System',
        userRole: log.user?.role,
        createdAt: log.createdAt
      }))
    };

    res.json({ stats });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/backup - Create system backup
router.post('/backup', authenticate, requireAdmin, async (req, res, next) => {
  try {
    // This would typically create a database backup
    // For now, we'll just log the backup request
    
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'BACKUP',
        entity: 'System',
        entityId: 'database',
        newValues: { 
          requestedBy: req.user.id,
          timestamp: new Date()
        }
      }
    });

    res.json({ 
      message: 'Backup requested successfully',
      note: 'Backup functionality would be implemented based on deployment environment'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/cleanup - Clean up old data
router.delete('/cleanup', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { days = 90 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    // Clean up old audit logs
    const deletedAuditLogs = await req.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    // Log cleanup action
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CLEANUP',
        entity: 'System',
        entityId: 'database',
        newValues: {
          cutoffDate,
          deletedAuditLogs: deletedAuditLogs.count
        }
      }
    });

    res.json({
      message: 'Cleanup completed successfully',
      deletedRecords: {
        auditLogs: deletedAuditLogs.count
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
