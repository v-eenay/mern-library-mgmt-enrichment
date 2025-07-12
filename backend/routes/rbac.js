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

/**
 * @swagger
 * /api/rbac/roles-permissions:
 *   get:
 *     summary: Get all available roles and permissions
 *     description: |
 *       Retrieve all available roles and their associated permissions in the system.
 *
 *       **Required Permission:** `system:stats`
 *     tags: [RBAC]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Roles and permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Roles and permissions retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     roles:
 *                       type: object
 *                       properties:
 *                         borrower:
 *                           type: object
 *                           properties:
 *                             level:
 *                               type: integer
 *                               example: 1
 *                             permissions:
 *                               type: array
 *                               items:
 *                                 type: string
 *                               example: ["borrow:create", "borrow:read:own"]
 *                         librarian:
 *                           type: object
 *                           properties:
 *                             level:
 *                               type: integer
 *                               example: 2
 *                             permissions:
 *                               type: array
 *                               items:
 *                                 type: string
 *                               example: ["book:create", "book:update", "user:read:all"]
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/roles-permissions',
  requirePermission(PERMISSIONS.SYSTEM_STATS),
  rbacController.getRolesAndPermissions
);

/**
 * @swagger
 * /api/rbac/api-documentation:
 *   get:
 *     summary: Get API endpoints with required permissions
 *     description: |
 *       Retrieve documentation of all API endpoints and their required permissions.
 *
 *       **Required Permission:** `system:stats`
 *     tags: [RBAC]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: API documentation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: API documentation retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     endpoints:
 *                       type: object
 *                       properties:
 *                         authentication:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               method:
 *                                 type: string
 *                                 example: POST
 *                               path:
 *                                 type: string
 *                                 example: /api/auth/login
 *                               description:
 *                                 type: string
 *                                 example: User login
 *                               access:
 *                                 type: string
 *                                 example: Public
 *                               permissions:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                                 example: []
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/api-documentation',
  requirePermission(PERMISSIONS.SYSTEM_STATS),
  rbacController.getAPIDocumentation
);

/**
 * @swagger
 * /api/rbac/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     description: |
 *       Retrieve system audit logs for security monitoring and compliance.
 *
 *       **Required Permission:** `system:audit:log`
 *     tags: [RBAC]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: action
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by action type
 *         example: BOOK_CREATE
 *       - name: userId
 *         in: query
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Filter by user ID
 *         example: 507f1f77bcf86cd799439011
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from date
 *         example: 2023-01-01T00:00:00.000Z
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter to date
 *         example: 2023-12-31T23:59:59.999Z
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Audit logs retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: 507f1f77bcf86cd799439020
 *                           action:
 *                             type: string
 *                             example: BOOK_CREATE
 *                           userId:
 *                             type: string
 *                             example: 507f1f77bcf86cd799439011
 *                           resourceType:
 *                             type: string
 *                             example: Book
 *                           resourceId:
 *                             type: string
 *                             example: 507f1f77bcf86cd799439012
 *                           severity:
 *                             type: string
 *                             example: MEDIUM
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                             example: 2023-01-15T10:30:00.000Z
 *                           details:
 *                             type: object
 *                             example: { "title": "New Book Added" }
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/audit-logs',
  requirePermission(PERMISSIONS.SYSTEM_AUDIT_LOG),
  rbacController.getAuditLogs
);

/**
 * @swagger
 * /api/rbac/audit-stats:
 *   get:
 *     summary: Get audit statistics
 *     description: |
 *       Retrieve audit log statistics and analytics for security monitoring.
 *
 *       **Required Permission:** `system:audit:log`
 *     tags: [RBAC]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Audit statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Audit statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalLogs:
 *                       type: integer
 *                       example: 1250
 *                     logsByAction:
 *                       type: object
 *                       properties:
 *                         BOOK_CREATE:
 *                           type: integer
 *                           example: 45
 *                         BOOK_UPDATE:
 *                           type: integer
 *                           example: 32
 *                         BORROW_CREATE:
 *                           type: integer
 *                           example: 180
 *                     logsBySeverity:
 *                       type: object
 *                       properties:
 *                         LOW:
 *                           type: integer
 *                           example: 800
 *                         MEDIUM:
 *                           type: integer
 *                           example: 350
 *                         HIGH:
 *                           type: integer
 *                           example: 100
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                             example: "2023-01-15"
 *                           count:
 *                             type: integer
 *                             example: 25
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/audit-stats',
  requirePermission(PERMISSIONS.SYSTEM_AUDIT_LOG),
  rbacController.getAuditStats
);

module.exports = router;
