const express = require('express');
const { authenticate, requireLibrarian } = require('../middleware/auth');
const { validationMiddleware } = require('../services/validationService');
const usersController = require('../controllers/usersController');

const router = express.Router();

// All routes require authentication and librarian role
router.use(authenticate);
router.use(requireLibrarian);

// @desc    Get all users with pagination and filtering
// @route   GET /api/users
// @access  Private (Librarian only)
router.get('/', validationMiddleware.pagination, usersController.getAllUsers);

// @desc    Get user statistics
// @route   GET /api/users/stats/overview
// @access  Private (Librarian only)
router.get('/stats/overview', usersController.getUserStats);

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Librarian only)
router.get('/:id', usersController.getUserById);

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Librarian only)
router.post('/', validationMiddleware.register, usersController.createUser);

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Librarian only)
router.put('/:id', validationMiddleware.updateProfile, usersController.updateUser);

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Librarian only)
router.delete('/:id', usersController.deleteUser);

module.exports = router;
