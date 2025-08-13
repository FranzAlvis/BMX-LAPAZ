const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or inactive user'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Authorization middleware factory
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Role-specific middleware
const requireAdmin = authorize('Admin');
const requireSecretaria = authorize('Admin', 'Secretaria');
const requireCronometraje = authorize('Admin', 'Secretaria', 'Cronometraje');
const requireJuez = authorize('Admin', 'Secretaria', 'Cronometraje', 'Juez');
const requireAnyRole = authorize('Admin', 'Secretaria', 'Cronometraje', 'Juez', 'Publico');

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  requireSecretaria,
  requireCronometraje,
  requireJuez,
  requireAnyRole
};
