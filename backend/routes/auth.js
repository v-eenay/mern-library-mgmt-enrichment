const express = require('express');
const { authenticate, checkTokenExpiration } = require('../middleware/auth');
const { validationMiddleware } = require('../services/validationService');
const { passwordChangeRateLimit, authRateLimit, progressiveDelay } = require('../middleware/uploadRateLimit');
const securityMiddleware = require('../middleware/securityMiddleware');
const authController = require('../controllers/authController');

const router = express.Router();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', authRateLimit, progressiveDelay, validationMiddleware.register, authController.register);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
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

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (requires refresh token)
router.post('/refresh', authController.refreshToken);

// @desc    Verify token validity
// @route   GET /api/auth/verify
// @access  Private
router.get('/verify', authenticate, checkTokenExpiration, authController.verifyToken);

module.exports = router;
