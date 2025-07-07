const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { User } = require('../models');
const { authenticate, requireLibrarian } = require('../middleware/auth');
const { sendSuccess, sendError, asyncHandler, isValidObjectId, getPagination } = require('../utils/helpers');

const router = express.Router();

// All routes require authentication and librarian role
router.use(authenticate);
router.use(requireLibrarian);

// @desc    Get all users with pagination and filtering
// @route   GET /api/users
// @access  Private (Librarian only)
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Page must be a non-negative integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(['borrower', 'librarian'])
    .withMessage('Role must be either borrower or librarian'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search term must not be empty')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { page = 0, limit = 10, role, search } = req.query;
  const { limit: pageLimit, offset } = getPagination(page, limit);

  // Build query
  let query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(pageLimit)
    .skip(offset);

  const total = await User.countDocuments(query);

  sendSuccess(res, 'Users retrieved successfully', {
    users,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
}));

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Librarian only)
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid user ID', 400);
  }

  const user = await User.findById(id).select('-password');
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  sendSuccess(res, 'User retrieved successfully', { user });
}));

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Librarian only)
router.post('/', [
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
    .isIn(['borrower', 'librarian'])
    .withMessage('Role must be either borrower or librarian')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { name, email, password, role } = req.body;

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

  sendSuccess(res, 'User created successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }
  }, 201);
}));

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Librarian only)
router.put('/:id', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(['borrower', 'librarian'])
    .withMessage('Role must be either borrower or librarian')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { id } = req.params;
  const { name, email, role } = req.body;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid user ID', 400);
  }

  const user = await User.findById(id);
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // Check if email is being changed and if it already exists
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'Email already exists', 400);
    }
    user.email = email;
  }

  if (name) user.name = name;
  if (role) user.role = role;

  await user.save();

  sendSuccess(res, 'User updated successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }
  });
}));

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Librarian only)
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid user ID', 400);
  }

  // Prevent deletion of own account
  if (id === req.user._id.toString()) {
    return sendError(res, 'Cannot delete your own account', 400);
  }

  const user = await User.findById(id);
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // Check if user has active borrows
  const { Borrow } = require('../models');
  const activeBorrows = await Borrow.findActiveByUser(id);
  if (activeBorrows.length > 0) {
    return sendError(res, 'Cannot delete user with active borrows', 400);
  }

  await User.findByIdAndDelete(id);

  sendSuccess(res, 'User deleted successfully');
}));

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Librarian only)
router.get('/stats/overview', asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalBorrowers = await User.countDocuments({ role: 'borrower' });
  const totalLibrarians = await User.countDocuments({ role: 'librarian' });

  // Users registered in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentUsers = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });

  sendSuccess(res, 'User statistics retrieved successfully', {
    stats: {
      totalUsers,
      totalBorrowers,
      totalLibrarians,
      recentUsers
    }
  });
}));

module.exports = router;
