const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return next(new AppError('User not found', 404));
      }

      if (!req.user.isActive) {
        return next(new AppError('User account is deactivated', 403));
      }

      next();
    } catch (error) {
      return next(new AppError('Not authorized to access this route', 401));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Check if user owns the resource
 * @param {string} resourceUserField - Field name containing user ID
 */
const checkOwnership = (resourceUserField = 'owner') => {
  return (req, res, next) => {
    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if resource belongs to user
    const resourceUserId = req.resource?.[resourceUserField]?.toString();
    const currentUserId = req.user.id.toString();

    if (resourceUserId !== currentUserId) {
      return next(
        new AppError('Not authorized to access this resource', 403)
      );
    }

    next();
  };
};

/**
 * Verify email middleware
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    return next(
      new AppError('Please verify your email to access this feature', 403)
    );
  }
  next();
};

module.exports = { protect, authorize, checkOwnership, requireEmailVerification };
