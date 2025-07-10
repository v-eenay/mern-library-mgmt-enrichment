const { rbacService, PERMISSIONS, ROLES } = require('../services/rbacService');
const auditService = require('../services/auditService');
const { sendSuccess, sendError, asyncHandler } = require('../utils/helpers');

/**
 * RBAC Management Controller
 * Provides endpoints for role and permission management
 */

// @desc    Get user's permissions
// @route   GET /api/rbac/my-permissions
// @access  Private
const getMyPermissions = asyncHandler(async (req, res) => {
  const permissions = rbacService.getUserPermissions(req.user);
  
  sendSuccess(res, 'User permissions retrieved successfully', {
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    },
    permissions,
    roleInfo: rbacService.roles[req.user.role]
  });
});

// @desc    Get all available roles and permissions
// @route   GET /api/rbac/roles-permissions
// @access  Private (Librarian only)
const getRolesAndPermissions = asyncHandler(async (req, res) => {
  const roles = rbacService.getAllRoles();
  const permissions = rbacService.getAllPermissions();
  
  sendSuccess(res, 'Roles and permissions retrieved successfully', {
    roles,
    permissions,
    permissionCategories: {
      user: Object.keys(permissions).filter(p => p.startsWith('USER_') || p.startsWith('PROFILE_')),
      book: Object.keys(permissions).filter(p => p.startsWith('BOOK_')),
      borrow: Object.keys(permissions).filter(p => p.startsWith('BORROW_')),
      review: Object.keys(permissions).filter(p => p.startsWith('REVIEW_')),
      category: Object.keys(permissions).filter(p => p.startsWith('CATEGORY_')),
      contact: Object.keys(permissions).filter(p => p.startsWith('CONTACT_')),
      system: Object.keys(permissions).filter(p => p.startsWith('SYSTEM_')),
      file: Object.keys(permissions).filter(p => p.startsWith('FILE_'))
    }
  });
});

// @desc    Check if user has specific permission
// @route   POST /api/rbac/check-permission
// @access  Private
const checkPermission = asyncHandler(async (req, res) => {
  const { permission } = req.body;
  
  if (!permission) {
    return sendError(res, 'Permission parameter is required', 400);
  }
  
  const hasPermission = rbacService.hasPermission(req.user, permission);
  
  sendSuccess(res, 'Permission check completed', {
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    },
    permission,
    hasPermission
  });
});

// @desc    Get API endpoints with required permissions
// @route   GET /api/rbac/api-documentation
// @access  Private (Librarian only)
const getAPIDocumentation = asyncHandler(async (req, res) => {
  const apiEndpoints = {
    authentication: [
      {
        method: 'POST',
        path: '/api/auth/register',
        description: 'Register new user',
        access: 'Public',
        permissions: []
      },
      {
        method: 'POST',
        path: '/api/auth/login',
        description: 'User login',
        access: 'Public',
        permissions: []
      },
      {
        method: 'POST',
        path: '/api/auth/logout',
        description: 'User logout',
        access: 'Private',
        permissions: ['Authenticated']
      },
      {
        method: 'POST',
        path: '/api/auth/refresh',
        description: 'Refresh access token',
        access: 'Public (with refresh token)',
        permissions: []
      }
    ],
    users: [
      {
        method: 'GET',
        path: '/api/users',
        description: 'Get all users',
        access: 'Private (Librarian only)',
        permissions: [PERMISSIONS.USER_READ_ALL]
      },
      {
        method: 'GET',
        path: '/api/users/:id',
        description: 'Get user by ID',
        access: 'Private (Librarian only)',
        permissions: [PERMISSIONS.USER_READ]
      },
      {
        method: 'PUT',
        path: '/api/users/:id',
        description: 'Update user',
        access: 'Private (Librarian only)',
        permissions: [PERMISSIONS.USER_UPDATE]
      },
      {
        method: 'DELETE',
        path: '/api/users/:id',
        description: 'Delete user',
        access: 'Private (Admin only)',
        permissions: [PERMISSIONS.USER_DELETE]
      },
      {
        method: 'POST',
        path: '/api/users/upload-profile-picture',
        description: 'Upload profile picture',
        access: 'Private (Own profile)',
        permissions: [PERMISSIONS.FILE_UPLOAD_PROFILE]
      }
    ],
    books: [
      {
        method: 'GET',
        path: '/api/books',
        description: 'Get all books',
        access: 'Public',
        permissions: []
      },
      {
        method: 'GET',
        path: '/api/books/:id',
        description: 'Get book by ID',
        access: 'Public',
        permissions: []
      },
      {
        method: 'POST',
        path: '/api/books',
        description: 'Create new book',
        access: 'Private (Librarian only)',
        permissions: [PERMISSIONS.BOOK_CREATE]
      },
      {
        method: 'PUT',
        path: '/api/books/:id',
        description: 'Update book',
        access: 'Private (Librarian only)',
        permissions: [PERMISSIONS.BOOK_UPDATE]
      },
      {
        method: 'DELETE',
        path: '/api/books/:id',
        description: 'Delete book',
        access: 'Private (Librarian only)',
        permissions: [PERMISSIONS.BOOK_DELETE]
      }
    ],
    borrowing: [
      {
        method: 'POST',
        path: '/api/borrows',
        description: 'Borrow a book',
        access: 'Private (Borrowers)',
        permissions: [PERMISSIONS.BORROW_CREATE]
      },
      {
        method: 'PUT',
        path: '/api/borrows/:id/return',
        description: 'Return a book',
        access: 'Private (Own borrows or Librarian)',
        permissions: [PERMISSIONS.BORROW_UPDATE_OWN, PERMISSIONS.BORROW_UPDATE_ANY]
      },
      {
        method: 'GET',
        path: '/api/borrows/my-borrows',
        description: 'Get user borrowing history',
        access: 'Private (Own borrows)',
        permissions: [PERMISSIONS.BORROW_READ_OWN]
      },
      {
        method: 'GET',
        path: '/api/borrows',
        description: 'Get all borrows',
        access: 'Private (Librarian only)',
        permissions: [PERMISSIONS.BORROW_READ_ALL]
      },
      {
        method: 'GET',
        path: '/api/borrows/stats/overview',
        description: 'Get borrowing statistics',
        access: 'Private (Librarian only)',
        permissions: [PERMISSIONS.BORROW_STATS]
      }
    ],
    reviews: [
      {
        method: 'POST',
        path: '/api/reviews',
        description: 'Create review',
        access: 'Private (Borrowers who borrowed the book)',
        permissions: [PERMISSIONS.REVIEW_CREATE]
      },
      {
        method: 'PUT',
        path: '/api/reviews/:id',
        description: 'Update review',
        access: 'Private (Own reviews or Librarian)',
        permissions: [PERMISSIONS.REVIEW_UPDATE_OWN, PERMISSIONS.REVIEW_UPDATE_ANY]
      },
      {
        method: 'DELETE',
        path: '/api/reviews/:id',
        description: 'Delete review',
        access: 'Private (Own reviews or Librarian)',
        permissions: [PERMISSIONS.REVIEW_DELETE_OWN, PERMISSIONS.REVIEW_DELETE_ANY]
      }
    ],
    system: [
      {
        method: 'GET',
        path: '/api/rbac/my-permissions',
        description: 'Get user permissions',
        access: 'Private',
        permissions: ['Authenticated']
      },
      {
        method: 'GET',
        path: '/api/rbac/roles-permissions',
        description: 'Get all roles and permissions',
        access: 'Private (Librarian only)',
        permissions: [PERMISSIONS.SYSTEM_STATS]
      },
      {
        method: 'GET',
        path: '/security/stats',
        description: 'Get security statistics',
        access: 'Private (Admin only)',
        permissions: [PERMISSIONS.SYSTEM_SECURITY_MONITOR]
      }
    ]
  };

  sendSuccess(res, 'API documentation retrieved successfully', {
    endpoints: apiEndpoints,
    totalEndpoints: Object.values(apiEndpoints).reduce((total, category) => total + category.length, 0),
    lastUpdated: new Date().toISOString()
  });
});

// @desc    Get audit logs
// @route   GET /api/rbac/audit-logs
// @access  Private (Librarian only)
const getAuditLogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    action,
    resourceType,
    severity,
    success,
    startDate,
    endDate,
    userId,
    targetUserId
  } = req.query;

  const filters = {
    action,
    resourceType,
    severity,
    success: success !== undefined ? success === 'true' : undefined,
    startDate,
    endDate,
    userId,
    targetUserId
  };

  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit)
  };

  const result = await auditService.getAuditLogs(filters, pagination);

  sendSuccess(res, 'Audit logs retrieved successfully', result);
});

// @desc    Get audit statistics
// @route   GET /api/rbac/audit-stats
// @access  Private (Librarian only)
const getAuditStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const filters = { startDate, endDate };
  const stats = await auditService.getAuditStats(filters);

  sendSuccess(res, 'Audit statistics retrieved successfully', stats);
});

module.exports = {
  getMyPermissions,
  getRolesAndPermissions,
  checkPermission,
  getAPIDocumentation,
  getAuditLogs,
  getAuditStats
};
