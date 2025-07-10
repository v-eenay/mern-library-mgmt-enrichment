const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validationMiddleware } = require('../services/validationService');
const { passwordChangeRateLimit } = require('../middleware/uploadRateLimit');
const authController = require('../controllers/authController');

const router = express.Router();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validationMiddleware.register, authController.register);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validationMiddleware.login, authController.login);

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

module.exports = router;
