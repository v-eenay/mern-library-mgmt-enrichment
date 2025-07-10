const express = require('express');
const { authenticate, checkTokenExpiration } = require('../middleware/auth');
const { validationMiddleware } = require('../services/validationService');
const { passwordChangeRateLimit, authRateLimit, progressiveDelay } = require('../middleware/uploadRateLimit');
const authController = require('../controllers/authController');

const router = express.Router();

// Swagger documentation temporarily removed to fix path-to-regexp issue

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     description: Create a new user account in the system. New users are assigned the 'borrower' role by default.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             borrower:
 *               summary: Register as borrower
 *               value:
 *                 name: John Doe
 *                 email: john.doe@example.com
 *                 password: SecurePassword123!
 *                 role: borrower
 *             librarian:
 *               summary: Register as librarian (admin only)
 *               value:
 *                 name: Jane Smith
 *                 email: jane.smith@library.com
 *                 password: LibrarianPass123!
 *                 role: librarian
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *         headers:
 *           Set-Cookie:
 *             description: HTTP-only authentication cookies
 *             schema:
 *               type: string
 *               example: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/register', authRateLimit, progressiveDelay, validationMiddleware.register, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and obtain access tokens
 *     description: |
 *       Authenticate a user with email and password. Returns JWT tokens both as JSON response and HTTP-only cookies.
 *
 *       **Security Features:**
 *       - Rate limited to 5 attempts per 15 minutes
 *       - Progressive delay on repeated attempts
 *       - Tokens set as HTTP-only cookies for XSS protection
 *       - CSRF protection via SameSite cookies
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             borrower:
 *               summary: Borrower login
 *               value:
 *                 email: borrower@test.com
 *                 password: password123
 *             librarian:
 *               summary: Librarian login
 *               value:
 *                 email: librarian@test.com
 *                 password: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *         headers:
 *           Set-Cookie:
 *             description: HTTP-only authentication cookies (authToken and refreshToken)
 *             schema:
 *               type: string
 *               example: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Invalid credentials
 *               code: INVALID_CREDENTIALS
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/login', authRateLimit, progressiveDelay, validationMiddleware.login, authController.login);

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', authenticate, authController.getProfile);

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', authenticate, validationMiddleware.updateProfile, authController.updateProfile);

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', authenticate, passwordChangeRateLimit, validationMiddleware.changePassword, authController.changePassword);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     description: |
 *       Generate a new access token using a valid refresh token. The old refresh token is blacklisted and a new pair is issued.
 *
 *       **Security Features:**
 *       - Automatic token rotation (old tokens are blacklisted)
 *       - Refresh tokens have longer expiration (7 days vs 15 minutes for access tokens)
 *       - HTTP-only cookie support for secure token storage
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: false
 *       description: Refresh token can be provided in request body or HTTP-only cookie
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token (optional if provided via cookie)
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponse'
 *         headers:
 *           Set-Cookie:
 *             description: New HTTP-only authentication cookies
 *             schema:
 *               type: string
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Invalid refresh token
 *               code: INVALID_REFRESH_TOKEN
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify access token validity
 *     description: |
 *       Verify that the current access token is valid and return user information.
 *
 *       **Headers:**
 *       - `X-Token-Refresh-Suggested`: Set to 'true' if token expires in less than 5 minutes
 *       - `X-Token-Expires-In`: Seconds until token expiration
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [success]
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Token is valid
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokenInfo:
 *                       type: object
 *                       properties:
 *                         jti:
 *                           type: string
 *                           description: Unique token identifier
 *                         iat:
 *                           type: integer
 *                           description: Token issued at timestamp
 *                         exp:
 *                           type: integer
 *                           description: Token expiration timestamp
 *                         type:
 *                           type: string
 *                           enum: [access]
 *         headers:
 *           X-Token-Refresh-Suggested:
 *             description: Whether token refresh is suggested
 *             schema:
 *               type: string
 *               enum: ['true', 'false']
 *           X-Token-Expires-In:
 *             description: Seconds until token expiration
 *             schema:
 *               type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/verify', authenticate, checkTokenExpiration, authController.verifyToken);

module.exports = router;
