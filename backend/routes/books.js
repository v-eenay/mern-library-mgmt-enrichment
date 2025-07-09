const express = require('express');
const { authenticate, requireLibrarian } = require('../middleware/auth');
const { validationMiddleware } = require('../services/validationService');
const booksController = require('../controllers/booksController');

const router = express.Router();

// @desc    Get all books with pagination, search, and filtering
// @route   GET /api/books
// @access  Public
router.get('/', validationMiddleware.bookQuery, booksController.getAllBooks);

// @desc    Get available books
// @route   GET /api/books/available/list
// @access  Public
router.get('/available/list', booksController.getAvailableBooks);

// @desc    Search books by category
// @route   GET /api/books/category/:category
// @access  Public
router.get('/category/:category', booksController.getBooksByCategory);

// @desc    Get book by ID with reviews
// @route   GET /api/books/:id
// @access  Public
router.get('/:id', booksController.getBookById);

// @desc    Create new book
// @route   POST /api/books
// @access  Private (Librarian only)
router.post('/', authenticate, requireLibrarian, validationMiddleware.createBook, booksController.createBook);

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Librarian only)
router.put('/:id', authenticate, requireLibrarian, validationMiddleware.updateBook, booksController.updateBook);

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Librarian only)
router.delete('/:id', authenticate, requireLibrarian, booksController.deleteBook);

module.exports = router;
