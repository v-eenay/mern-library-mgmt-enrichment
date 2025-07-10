const express = require('express');
const { authenticate, requireLibrarian } = require('../middleware/auth');
const { validationMiddleware } = require('../services/validationService');
const borrowsController = require('../controllers/borrowsController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// @desc    Borrow a book
// @route   POST /api/borrows
// @access  Private
router.post('/', validationMiddleware.borrowBook, borrowsController.borrowBook);

// @desc    Return a book
// @route   PUT /api/borrows/:id/return
// @access  Private
router.put('/:id/return', borrowsController.returnBook);

// @desc    Extend due date for a borrow
// @route   PUT /api/borrows/:id/extend
// @access  Private (Librarian only)
router.put('/:id/extend', requireLibrarian, validationMiddleware.extendDueDate, borrowsController.extendDueDate);

// @desc    Get user's borrow history
// @route   GET /api/borrows/my-borrows
// @access  Private
router.get('/my-borrows', validationMiddleware.pagination, borrowsController.getMyBorrows);

// @desc    Get user's overdue borrows
// @route   GET /api/borrows/my-overdue
// @access  Private
router.get('/my-overdue', borrowsController.getMyOverdueBorrows);

// @desc    Get borrow statistics
// @route   GET /api/borrows/stats/overview
// @access  Private (Librarian only)
router.get('/stats/overview', requireLibrarian, borrowsController.getBorrowStats);

// @desc    Get overdue borrows
// @route   GET /api/borrows/overdue
// @access  Private (Librarian only)
router.get('/overdue', requireLibrarian, validationMiddleware.pagination, borrowsController.getOverdueBorrows);

// @desc    Update overdue statuses
// @route   POST /api/borrows/update-overdue
// @access  Private (Librarian only)
router.post('/update-overdue', requireLibrarian, borrowsController.updateOverdueStatuses);

// @desc    Get active borrows for a specific book
// @route   GET /api/borrows/book/:bookId/active
// @access  Private (Librarian only)
router.get('/book/:bookId/active', requireLibrarian, borrowsController.getActiveBorrowsByBook);

// @desc    Get all borrows (Librarian only)
// @route   GET /api/borrows
// @access  Private (Librarian only)
router.get('/', requireLibrarian, validationMiddleware.pagination, borrowsController.getAllBorrows);

// @desc    Get borrow by ID
// @route   GET /api/borrows/:id
// @access  Private
router.get('/:id', borrowsController.getBorrowById);

module.exports = router;

