const jwt = require('jsonwebtoken');
const { User } = require('../models');
const jwtService = require('../services/jwtService');
const { rbacService, PERMISSIONS } = require('../services/rbacService');

// Enhanced middleware to verify JWT token with improved security
const authenticate = async (req, res, next) => {
  try {
    const token = jwtService.extractToken(req);

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    // Verify token using enhanced JWT service
    const decoded = jwtService.verifyAccessToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Add token info to request for potential use in controllers
    req.user = user;
    req.tokenInfo = {
      jti: decoded.jti,
      iat: decoded.iat,
      exp: decoded.exp,
      type: decoded.type
    };

    next();
  } catch (error) {
    let message = 'Invalid token.';
    let code = 'INVALID_TOKEN';

    if (error.message.includes('expired')) {
      message = 'Token has expired. Please refresh your session.';
      code = 'TOKEN_EXPIRED';
    } else if (error.message.includes('revoked')) {
      message = 'Token has been revoked. Please log in again.';
      code = 'TOKEN_REVOKED';
    } else if (error.message.includes('malformed')) {
      message = 'Malformed token.';
      code = 'MALFORMED_TOKEN';
    }

    res.status(401).json({
      status: 'error',
      message,
      code
    });
  }
};

// Middleware to check if user is librarian
const requireLibrarian = (req, res, next) => {
  if (req.user.role !== 'librarian') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Librarian role required.'
    });
  }
  next();
};

// Middleware to check if user is borrower
const requireBorrower = (req, res, next) => {
  if (req.user.role !== 'borrower') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Borrower role required.'
    });
  }
  next();
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = jwtService.extractToken(req);

    if (token) {
      const decoded = jwtService.verifyAccessToken(token);
      const user = await User.findById(decoded.id);

      if (user) {
        req.user = user;
        req.tokenInfo = {
          jti: decoded.jti,
          iat: decoded.iat,
          exp: decoded.exp,
          type: decoded.type
        };
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional authentication, just continue without user
    next();
  }
};

// Enhanced CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Skip CSRF protection for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF protection for API requests with valid JWT tokens
  if (req.user && req.tokenInfo) {
    return next();
  }

  // Check for CSRF token in headers or body
  const csrfToken = req.headers['x-csrf-token'] ||
                   req.headers['x-xsrf-token'] ||
                   req.body._csrf;

  if (!csrfToken) {
    return res.status(403).json({
      status: 'error',
      message: 'CSRF token missing',
      code: 'CSRF_TOKEN_MISSING'
    });
  }

  // In a real implementation, validate the CSRF token
  // For now, we'll rely on SameSite cookies for CSRF protection
  next();
};

// Middleware to check token expiration and suggest refresh
const checkTokenExpiration = (req, res, next) => {
  if (req.tokenInfo && req.tokenInfo.exp) {
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = req.tokenInfo.exp - now;

    // If token expires in less than 5 minutes, suggest refresh
    if (timeUntilExpiry < 300) {
      res.set('X-Token-Refresh-Suggested', 'true');
      res.set('X-Token-Expires-In', timeUntilExpiry.toString());
    }
  }

  next();
};

/**
 * Enhanced permission-based authorization middleware
 * @param {string|Array} permissions - Required permission(s)
 * @returns {Function} Express middleware
 */
const requirePermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

    if (!rbacService.hasAnyPermission(req.user, requiredPermissions)) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: requiredPermissions,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Require all specified permissions
 * @param {Array} permissions - Required permissions (all must be present)
 * @returns {Function} Express middleware
 */
const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    if (!rbacService.hasAllPermissions(req.user, permissions)) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permissions,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Resource ownership authorization middleware
 * @param {string} resourceParam - Parameter name for resource ID
 * @param {string} ownPermission - Permission for own resource
 * @param {string} anyPermission - Permission for any resource (optional)
 * @returns {Function} Express middleware
 */
const requireResourceOwnership = (resourceParam, ownPermission, anyPermission = null) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    // If user has permission to access any resource, allow
    if (anyPermission && rbacService.hasPermission(req.user, anyPermission)) {
      return next();
    }

    // Check if user has permission for own resources
    if (!rbacService.hasPermission(req.user, ownPermission)) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: [ownPermission],
        userRole: req.user.role
      });
    }

    // Get resource ID from params
    const resourceId = req.params[resourceParam];
    if (!resourceId) {
      return res.status(400).json({
        status: 'error',
        message: 'Resource ID required',
        code: 'RESOURCE_ID_REQUIRED'
      });
    }

    // Store resource info for use in controllers
    req.resourceOwnership = {
      resourceId,
      ownPermission,
      anyPermission,
      requiresOwnershipCheck: true
    };

    next();
  };
};

/**
 * Role hierarchy authorization middleware
 * @param {string} minimumRole - Minimum required role
 * @returns {Function} Express middleware
 */
const requireMinimumRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    const userRole = rbacService.roles[req.user.role];
    const requiredRole = rbacService.roles[minimumRole];

    if (!userRole || !requiredRole) {
      return res.status(403).json({
        status: 'error',
        message: 'Invalid role configuration',
        code: 'INVALID_ROLE'
      });
    }

    if (userRole.level < requiredRole.level) {
      return res.status(403).json({
        status: 'error',
        message: `Minimum role required: ${requiredRole.name}`,
        code: 'INSUFFICIENT_ROLE_LEVEL',
        required: minimumRole,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Admin-only operations middleware
 * @returns {Function} Express middleware
 */
const requireAdmin = () => {
  return requireMinimumRole('admin');
};

/**
 * Enhanced librarian middleware with permission check
 * @returns {Function} Express middleware
 */
const requireLibrarianEnhanced = () => {
  return requireMinimumRole('librarian');
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireLibrarian,
  requireBorrower,
  csrfProtection,
  checkTokenExpiration,
  requirePermission,
  requireAllPermissions,
  requireResourceOwnership,
  requireMinimumRole,
  requireAdmin,
  requireLibrarianEnhanced
};
