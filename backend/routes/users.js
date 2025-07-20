const express = require('express');
const {
  authenticate,
  requirePermission,
  requireResourceOwnership,
  requireMinimumRole
} = require('../middleware/auth');
const { validationMiddleware } = require('../services/validationService');
const { uploadProfile, uploadProfileMemory, handleMulterError } = require('../middleware/upload');
const { profileUploadRateLimit, profileUploadAbuseProtection } = require('../middleware/uploadRateLimit');
const securityMiddleware = require('../middleware/securityMiddleware');
const { PERMISSIONS } = require('../services/rbacService');
const auditService = require('../services/auditService');
const usersController = require('../controllers/usersController');

const router = express.Router();

// Profile picture routes (accessible to all authenticated users)
router.use(authenticate);

// @desc    Upload profile picture
// @route   POST /api/users/upload-profile-picture
// @access  Private (Own profile only)
router.post('/upload-profile-picture',
  requirePermission(PERMISSIONS.FILE_UPLOAD_PROFILE),
  profileUploadRateLimit,
  securityMiddleware.fileUploadSecurity(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'], 5 * 1024 * 1024),
  uploadProfile.single('profilePicture'),
  handleMulterError,
  auditService.createAuditMiddleware('FILE_UPLOAD_PROFILE', 'File', 'MEDIUM'),
  usersController.uploadProfilePicture
);

// @desc    Update profile picture
// @route   PUT /api/users/update-profile-picture
// @access  Private
router.put('/update-profile-picture',
  profileUploadRateLimit,
  uploadProfile.single('profilePicture'),
  handleMulterError,
  usersController.updateProfilePicture
);

// @desc    Upload profile picture with enhanced processing
// @route   POST /api/users/profile/upload
// @access  Private
router.post('/profile/upload',
  profileUploadRateLimit,
  profileUploadAbuseProtection,
  uploadProfileMemory.single('profilePicture'),
  handleMulterError,
  usersController.uploadProfilePictureEnhanced
);

// @desc    Delete profile picture
// @route   DELETE /api/users/profile/image
// @access  Private (Own profile only)
router.delete('/profile/image',
  requirePermission(PERMISSIONS.FILE_DELETE_OWN),
  auditService.createAuditMiddleware('FILE_DELETE_OWN', 'File', 'MEDIUM'),
  usersController.deleteProfilePicture
);

// All remaining routes require librarian role or higher
router.use(requireMinimumRole('librarian'));

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users with pagination and filtering
 *     description: |
 *       Retrieve all users in the system with pagination and filtering options. Only librarians and admins can access this endpoint.
 *
 *       **Required Permission:** `user:read:all`
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - name: role
 *         in: query
 *         schema:
 *           type: string
 *           enum: [borrower, librarian, admin]
 *         description: Filter by user role
 *         example: borrower
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                   example: Users retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   post:
 *     summary: Create new user
 *     description: |
 *       Create a new user account. Only librarians and admins can create users.
 *
 *       **Required Permission:** `user:create`
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             name: Jane Smith
 *             email: jane.smith@example.com
 *             password: SecurePass2024!
 *             role: borrower
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                   example: User created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/',
  requirePermission(PERMISSIONS.USER_READ_ALL),
  validationMiddleware.pagination,
  usersController.getAllUsers
);

/**
 * @swagger
 * /api/users/stats/overview:
 *   get:
 *     summary: Get user statistics
 *     description: |
 *       Retrieve comprehensive user statistics for the dashboard. Only librarians and admins can access this endpoint.
 *
 *       **Required Permission:** `system:stats`
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
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
 *                   example: User statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                       example: 150
 *                     activeUsers:
 *                       type: integer
 *                       example: 120
 *                     usersByRole:
 *                       type: object
 *                       properties:
 *                         borrower:
 *                           type: integer
 *                           example: 140
 *                         librarian:
 *                           type: integer
 *                           example: 8
 *                         admin:
 *                           type: integer
 *                           example: 2
 *                     newUsersThisMonth:
 *                       type: integer
 *                       example: 15
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/stats/overview',
  requirePermission(PERMISSIONS.SYSTEM_STATS),
  usersController.getUserStats
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: |
 *       Retrieve detailed information about a specific user. Only librarians and admins can access this endpoint.
 *
 *       **Required Permission:** `user:read`
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: User retrieved successfully
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
 *                   example: User retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Update user
 *     description: |
 *       Update an existing user's information. Only librarians and admins can update users.
 *
 *       **Required Permission:** `user:update`
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *           example:
 *             name: Jane Smith Updated
 *             email: jane.updated@example.com
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                   example: User updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Delete user
 *     description: |
 *       Delete a user account. Only librarians and admins can delete users.
 *       Users with active borrows cannot be deleted.
 *
 *       **Required Permission:** `user:delete`
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                   example: User deleted successfully
 *       400:
 *         description: Cannot delete user with active borrows
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Cannot delete user with active borrows
 *               code: USER_HAS_ACTIVE_BORROWS
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id',
  requirePermission(PERMISSIONS.USER_READ),
  usersController.getUserById
);
router.post('/', validationMiddleware.register, usersController.createUser);
router.put('/:id', validationMiddleware.updateProfile, usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

module.exports = router;
