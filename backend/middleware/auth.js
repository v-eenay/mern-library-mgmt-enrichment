const { User } = require('../models');
const jwtService = require('../services/jwtService');
const { rbacService } = require('../services/rbacService');

/**
 * Common error response helper
 */
const sendErrorResponse = (res, status, message, code, additional = {}) => {
  return res.status(status).json({
    status: 'error',
    message,
    code,
    ...additional
  });
};

/**
 * Common authentication logic helper
 */
const authenticateUser = async (token) => {
  if (!token) {
    throw new Error('NO_TOKEN:Access denied. No token provided.');
  }

  const decoded = jwtService.verifyAccessToken(token);
  const user = await User.findById(decoded.id);

  if (!user) {
    throw new Error('USER_NOT_FOUND:Invalid token. User not found.');
  }

  return {
    user,
    tokenInfo: {
      jti: decoded.jti,
      iat: decoded.iat,
      exp: decoded.exp,
      type: decoded.type
    }
  };
};

/**
 * Parse authentication error
 */
const parseAuthError = (error) => {
  if (error.message.includes('NO_TOKEN:')) {
    return { message: error.message.split(':')[1], code: 'NO_TOKEN' };
  }
  if (error.message.includes('USER_NOT_FOUND:')) {
    return { message: error.message.split(':')[1], code: 'USER_NOT_FOUND' };
  }
  if (error.message.includes('expired')) {
    return { message: 'Token has expired. Please refresh your session.', code: 'TOKEN_EXPIRED' };
  }
  if (error.message.includes('revoked')) {
    return { message: 'Token has been revoked. Please log in again.', code: 'TOKEN_REVOKED' };
  }
  if (error.message.includes('malformed')) {
    return { message: 'Malformed token.', code: 'MALFORMED_TOKEN' };
  }
  return { message: 'Invalid token.', code: 'INVALID_TOKEN' };
};

/**
 * Enhanced middleware to verify JWT token with improved security
 */
const authenticate = async (req, res, next) => {
  try {
    const token = jwtService.extractToken(req);
    const { user, tokenInfo } = await authenticateUser(token);

    req.user = user;
    req.tokenInfo = tokenInfo;
    next();
  } catch (error) {
    const { message, code } = parseAuthError(error);
    return sendErrorResponse(res, 401, message, code);
  }
};

/**
 * Generic role requirement middleware factory
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendErrorResponse(res, 401, 'Authentication required', 'AUTHENTICATION_REQUIRED');
    }

    if (req.user.role !== role) {
      return sendErrorResponse(res, 403, `Access denied. ${role.charAt(0).toUpperCase() + role.slice(1)} role required.`, 'INSUFFICIENT_ROLE');
    }

    next();
  };
};

// Specific role middleware
const requireLibrarian = requireRole('librarian');
const requireBorrower = requireRole('borrower');

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = jwtService.extractToken(req);

    if (token) {
      const { user, tokenInfo } = await authenticateUser(token);
      req.user = user;
      req.tokenInfo = tokenInfo;
    }
  } catch (error) {
    // Don't fail on optional authentication, just continue without user
  }

  next();
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
 * Generic permission check helper
 */
const checkPermissions = (user, permissions, checkType = 'any') => {
  if (!user) {
    throw new Error('AUTHENTICATION_REQUIRED:Authentication required');
  }

  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
  const hasPermission = checkType === 'all'
    ? rbacService.hasAllPermissions(user, requiredPermissions)
    : rbacService.hasAnyPermission(user, requiredPermissions);

  if (!hasPermission) {
    throw new Error(`INSUFFICIENT_PERMISSIONS:Insufficient permissions:${JSON.stringify(requiredPermissions)}:${user.role}`);
  }
};

/**
 * Enhanced permission-based authorization middleware
 * @param {string|Array} permissions - Required permission(s)
 * @returns {Function} Express middleware
 */
const requirePermission = (permissions) => {
  return (req, res, next) => {
    try {
      checkPermissions(req.user, permissions, 'any');
      next();
    } catch (error) {
      const [code, message, required, userRole] = error.message.split(':');
      const additional = required ? {
        required: JSON.parse(required),
        userRole
      } : {};

      return sendErrorResponse(
        res,
        code === 'AUTHENTICATION_REQUIRED' ? 401 : 403,
        message,
        code,
        additional
      );
    }
  };
};

/**
 * Require all specified permissions
 * @param {Array} permissions - Required permissions (all must be present)
 * @returns {Function} Express middleware
 */
const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    try {
      checkPermissions(req.user, permissions, 'all');
      next();
    } catch (error) {
      const [code, message, required, userRole] = error.message.split(':');
      const additional = required ? {
        required: JSON.parse(required),
        userRole
      } : {};

      return sendErrorResponse(
        res,
        code === 'AUTHENTICATION_REQUIRED' ? 401 : 403,
        message,
        code,
        additional
      );
    }
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
      return sendErrorResponse(res, 401, 'Authentication required', 'AUTHENTICATION_REQUIRED');
    }

    const userRole = rbacService.roles[req.user.role];
    const requiredRole = rbacService.roles[minimumRole];

    if (!userRole || !requiredRole) {
      return sendErrorResponse(res, 403, 'Invalid role configuration', 'INVALID_ROLE');
    }

    if (userRole.level < requiredRole.level) {
      return sendErrorResponse(
        res,
        403,
        `Minimum role required: ${requiredRole.name}`,
        'INSUFFICIENT_ROLE_LEVEL',
        { required: minimumRole, userRole: req.user.role }
      );
    }

    next();
  };
};

// Convenience middleware for common roles
const requireAdmin = requireMinimumRole('admin');
const requireLibrarianEnhanced = requireMinimumRole('librarian');

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
