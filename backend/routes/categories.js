const express = require('express');
const { authenticate, requireLibrarian } = require('../middleware/auth');
const { validationMiddleware } = require('../services/validationService');
const categoriesController = require('../controllers/categoriesController');

const router = express.Router();

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
router.get('/', categoriesController.getAllCategories);

// @desc    Get category statistics
// @route   GET /api/categories/stats/overview
// @access  Private (Librarian only)
router.get('/stats/overview', authenticate, requireLibrarian, categoriesController.getCategoryStats);

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
router.get('/:id', categoriesController.getCategoryById);

// @desc    Get books by category
// @route   GET /api/categories/:id/books
// @access  Public
router.get('/:id/books', validationMiddleware.pagination, categoriesController.getBooksByCategory);

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Librarian only)
router.post('/', authenticate, requireLibrarian, validationMiddleware.createCategory, categoriesController.createCategory);

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Librarian only)
router.put('/:id', authenticate, requireLibrarian, validationMiddleware.updateCategory, categoriesController.updateCategory);

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Librarian only)
router.delete('/:id', authenticate, requireLibrarian, categoriesController.deleteCategory);

module.exports = router;
