const express = require('express');
const { 
  authenticate, 
  requirePermission, 
  requireMinimumRole 
} = require('../middleware/auth');
const { PERMISSIONS } = require('../services/rbacService');
const rbacController = require('../controllers/rbacController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// @desc    Get user's permissions
// @route   GET /api/rbac/my-permissions
// @access  Private
router.get('/my-permissions', rbacController.getMyPermissions);

// @desc    Check if user has specific permission
// @route   POST /api/rbac/check-permission
// @access  Private
router.post('/check-permission', rbacController.checkPermission);

// @desc    Get all available roles and permissions
// @route   GET /api/rbac/roles-permissions
// @access  Private (Librarian only)
router.get('/roles-permissions', 
  requirePermission(PERMISSIONS.SYSTEM_STATS),
  rbacController.getRolesAndPermissions
);

// @desc    Get API endpoints with required permissions
// @route   GET /api/rbac/api-documentation
// @access  Private (Librarian only)
router.get('/api-documentation', 
  requirePermission(PERMISSIONS.SYSTEM_STATS),
  rbacController.getAPIDocumentation
);

// @desc    Get audit logs
// @route   GET /api/rbac/audit-logs
// @access  Private (Librarian only)
router.get('/audit-logs', 
  requirePermission(PERMISSIONS.SYSTEM_AUDIT_LOG),
  rbacController.getAuditLogs
);

// @desc    Get audit statistics
// @route   GET /api/rbac/audit-stats
// @access  Private (Librarian only)
router.get('/audit-stats', 
  requirePermission(PERMISSIONS.SYSTEM_AUDIT_LOG),
  rbacController.getAuditStats
);

module.exports = router;
