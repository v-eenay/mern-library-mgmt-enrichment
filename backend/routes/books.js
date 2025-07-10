const express = require('express');
const { authenticate, requireLibrarian } = require('../middleware/auth');
const { validationMiddleware } = require('../services/validationService');
const { uploadBookCover, uploadBookCoverMemory, handleMulterError } = require('../middleware/upload');
const { bookCoverUploadRateLimit, bookCoverUploadAbuseProtection } = require('../middleware/uploadRateLimit');
const booksController = require('../controllers/booksController');

const router = express.Router();

// @desc    Get all books with pagination, search, and filtering
// @route   GET /api/books
// @access  Public
router.get('/', validationMiddleware.bookQuery, booksController.getAllBooks);

// @desc    Advanced search books with comprehensive filtering
// @route   GET /api/books/search/advanced
// @access  Public
router.get('/search/advanced', validationMiddleware.advancedSearch, booksController.advancedSearchBooks);

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

// @desc    Upload book cover image
// @route   POST /api/books/:id/upload-cover
// @access  Private (Librarian only)
router.post('/:id/upload-cover',
  authenticate,
  requireLibrarian,
  bookCoverUploadRateLimit,
  uploadBookCover.single('coverImage'),
  handleMulterError,
  booksController.uploadBookCover
);

// @desc    Update book cover image
// @route   PUT /api/books/:id/update-cover
// @access  Private (Librarian only)
router.put('/:id/update-cover',
  authenticate,
  requireLibrarian,
  bookCoverUploadRateLimit,
  uploadBookCover.single('coverImage'),
  handleMulterError,
  booksController.updateBookCover
);

// @desc    Upload book cover with enhanced processing
// @route   POST /api/books/:id/cover
// @access  Private (Librarian only)
router.post('/:id/cover',
  authenticate,
  requireLibrarian,
  bookCoverUploadRateLimit,
  bookCoverUploadAbuseProtection,
  uploadBookCoverMemory.single('coverImage'),
  handleMulterError,
  booksController.uploadBookCoverEnhanced
);

// @desc    Delete book cover image
// @route   DELETE /api/books/:id/cover
// @access  Private (Librarian only)
router.delete('/:id/cover',
  authenticate,
  requireLibrarian,
  booksController.deleteBookCover
);

// @desc    Cleanup orphaned image files
// @route   POST /api/books/cleanup-orphaned-images
// @access  Private (Librarian only)
router.post('/cleanup-orphaned-images',
  authenticate,
  requireLibrarian,
  booksController.cleanupOrphanedImages
);

module.exports = router;
