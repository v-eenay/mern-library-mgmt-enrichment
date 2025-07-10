const express = require('express');
const {
  authenticate,
  requirePermission,
  requireMinimumRole
} = require('../middleware/auth');
const { PERMISSIONS } = require('../services/rbacService');
const rbacController = require('../controllers/rbacController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Permission:
 *       type: string
 *       description: System permission identifier
 *       example: book:create
 *
 *     Role:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Human-readable role name
 *           example: Librarian
 *         level:
 *           type: integer
 *           description: Role hierarchy level (higher = more permissions)
 *           example: 2
 *         permissions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Permission'
 *           description: List of permissions granted to this role
 *
 *     UserPermissions:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [success]
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: objectId
 *                 email:
 *                   type: string
 *                   format: email
 *                 role:
 *                   type: string
 *                   enum: [borrower, librarian, admin]
 *             permissions:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Permission'
 *             roleInfo:
 *               $ref: '#/components/schemas/Role'
 *
 *     AuditLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: objectId
 *         userId:
 *           type: string
 *           format: objectId
 *         userEmail:
 *           type: string
 *           format: email
 *         userRole:
 *           type: string
 *           enum: [borrower, librarian, admin]
 *         action:
 *           type: string
 *           description: Action performed
 *           example: BOOK_CREATE
 *         resourceType:
 *           type: string
 *           enum: [User, Book, Borrow, Review, Category, Contact, System, File, Auth]
 *         resourceId:
 *           type: string
 *           format: objectId
 *         targetUserId:
 *           type: string
 *           format: objectId
 *         details:
 *           type: object
 *           description: Additional action details
 *         ipAddress:
 *           type: string
 *           description: Client IP address
 *         userAgent:
 *           type: string
 *           description: Client user agent
 *         timestamp:
 *           type: string
 *           format: date-time
 *         severity:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         success:
 *           type: boolean
 *           description: Whether the action was successful
 *         errorMessage:
 *           type: string
 *           description: Error message if action failed
 */

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/rbac/my-permissions:
 *   get:
 *     summary: Get current user's permissions and role information
 *     description: |
 *       Retrieve the current user's role, permissions, and role hierarchy information.
 *
 *       **Use Cases:**
 *       - Frontend permission checks
 *       - UI element visibility control
 *       - Feature availability verification
 *     tags: [RBAC]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: User permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPermissions'
 *             example:
 *               status: success
 *               message: User permissions retrieved successfully
 *               data:
 *                 user:
 *                   id: 507f1f77bcf86cd799439011
 *                   email: john.doe@example.com
 *                   role: borrower
 *                 permissions:
 *                   - profile:read:own
 *                   - profile:update:own
 *                   - book:read
 *                   - borrow:create
 *                   - borrow:read:own
 *                 roleInfo:
 *                   name: Borrower
 *                   level: 1
 *                   permissions: [...]
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/my-permissions', rbacController.getMyPermissions);

/**
 * @swagger
 * /api/rbac/check-permission:
 *   post:
 *     summary: Check if current user has a specific permission
 *     description: |
 *       Verify whether the current user has a specific permission.
 *
 *       **Use Cases:**
 *       - Dynamic permission checking
 *       - API endpoint access validation
 *       - Feature-specific authorization
 *     tags: [RBAC]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permission
 *             properties:
 *               permission:
 *                 $ref: '#/components/schemas/Permission'
 *           examples:
 *             book_create:
 *               summary: Check book creation permission
 *               value:
 *                 permission: book:create
 *             user_read_all:
 *               summary: Check user read all permission
 *               value:
 *                 permission: user:read:all
 *     responses:
 *       200:
 *         description: Permission check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [success]
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                     permission:
 *                       $ref: '#/components/schemas/Permission'
 *                     hasPermission:
 *                       type: boolean
 *             examples:
 *               has_permission:
 *                 summary: User has permission
 *                 value:
 *                   status: success
 *                   message: Permission check completed
 *                   data:
 *                     user:
 *                       id: 507f1f77bcf86cd799439011
 *                       email: librarian@test.com
 *                       role: librarian
 *                     permission: book:create
 *                     hasPermission: true
 *               no_permission:
 *                 summary: User lacks permission
 *                 value:
 *                   status: success
 *                   message: Permission check completed
 *                   data:
 *                     user:
 *                       id: 507f1f77bcf86cd799439012
 *                       email: borrower@test.com
 *                       role: borrower
 *                     permission: book:create
 *                     hasPermission: false
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
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
