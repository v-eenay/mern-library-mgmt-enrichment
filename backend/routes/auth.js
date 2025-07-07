const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { generateToken, sendSuccess, sendError, asyncHandler } = require('../utils/helpers');

const router = express.Router();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['borrower', 'librarian'])
    .withMessage('Role must be either borrower or librarian')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { name, email, password, role = 'borrower' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, 'User already exists with this email', 400);
  }

  // Create new user
  const user = new User({
    name,
    email,
    password,
    role
  });

  await user.save();

  // Generate token
  const token = generateToken(user._id);

  sendSuccess(res, 'User registered successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  }, 201);
}));

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { email, password } = req.body;

  // Find user with password
  const user = await User.findByEmailWithPassword(email);
  if (!user) {
    return sendError(res, 'Invalid credentials', 401);
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return sendError(res, 'Invalid credentials', 401);
  }

  // Generate token
  const token = generateToken(user._id);

  sendSuccess(res, 'Login successful', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  });
}));

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  sendSuccess(res, 'Profile retrieved successfully', {
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt
    }
  });
}));

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', authenticate, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { name, email } = req.body;
  const user = req.user;

  // Check if email is being changed and if it already exists
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'Email already exists', 400);
    }
    user.email = email;
  }

  if (name) user.name = name;

  await user.save();

  sendSuccess(res, 'Profile updated successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
}));

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', authenticate, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findByEmailWithPassword(req.user.email);

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return sendError(res, 'Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  sendSuccess(res, 'Password changed successfully');
}));

module.exports = router;
