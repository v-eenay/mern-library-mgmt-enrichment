const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Borrow, Book, User } = require('../models');
const { authenticate, requireLibrarian } = require('../middleware/auth');
const { sendSuccess, sendError, asyncHandler, isValidObjectId, getPagination } = require('../utils/helpers');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// @desc    Borrow a book
// @route   POST /api/borrows
// @access  Private
router.post('/', [
  body('bookId')
    .notEmpty()
    .withMessage('Book ID is required')
    .custom(value => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid book ID');
      }
      return true;
    })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { bookId } = req.body;
  const userId = req.user._id;

  // Check if book exists and is available
  const book = await Book.findById(bookId);
  if (!book) {
    return sendError(res, 'Book not found', 404);
  }

  if (!book.isAvailable()) {
    return sendError(res, 'Book is not available for borrowing', 400);
  }

  // Check if user already has this book borrowed
  const existingBorrow = await Borrow.hasActiveBorrow(userId, bookId);
  if (existingBorrow) {
    return sendError(res, 'You have already borrowed this book', 400);
  }

  // Create borrow record
  const borrow = new Borrow({
    userId,
    bookId,
    borrowDate: new Date()
  });

  await borrow.save();

  // Update book availability
  await book.borrowBook();

  // Populate the borrow record for response
  await borrow.populate('bookId', 'title author isbn');

  sendSuccess(res, 'Book borrowed successfully', { borrow }, 201);
}));

// @desc    Return a book
// @route   PUT /api/borrows/:id/return
// @access  Private
router.put('/:id/return', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid borrow ID', 400);
  }

  const borrow = await Borrow.findById(id).populate('bookId', 'title author isbn');
  if (!borrow) {
    return sendError(res, 'Borrow record not found', 404);
  }

  // Check if the borrow belongs to the user (unless librarian)
  if (req.user.role !== 'librarian' && borrow.userId.toString() !== userId.toString()) {
    return sendError(res, 'You can only return your own borrowed books', 403);
  }

  // Check if book is already returned
  if (borrow.returnDate) {
    return sendError(res, 'Book has already been returned', 400);
  }

  // Mark as returned
  await borrow.markAsReturned();

  // Update book availability
  const book = await Book.findById(borrow.bookId._id);
  await book.returnBook();

  sendSuccess(res, 'Book returned successfully', { borrow });
}));

// @desc    Get user's borrow history
// @route   GET /api/borrows/my-borrows
// @access  Private
router.get('/my-borrows', [
  query('status')
    .optional()
    .isIn(['active', 'returned', 'all'])
    .withMessage('Status must be one of: active, returned, all'),
  query('page')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Page must be a non-negative integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { status = 'all', page = 0, limit = 10 } = req.query;
  const { limit: pageLimit, offset } = getPagination(page, limit);
  const userId = req.user._id;

  let query = { userId };
  if (status === 'active') {
    query.returnDate = null;
  } else if (status === 'returned') {
    query.returnDate = { $ne: null };
  }

  const borrows = await Borrow.find(query)
    .populate('bookId', 'title author isbn coverImage')
    .sort({ borrowDate: -1 })
    .limit(pageLimit)
    .skip(offset);

  const total = await Borrow.countDocuments(query);

  sendSuccess(res, 'Borrow history retrieved successfully', {
    borrows,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
}));

// @desc    Get all borrows (Librarian only)
// @route   GET /api/borrows
// @access  Private (Librarian only)
router.get('/', requireLibrarian, [
  query('status')
    .optional()
    .isIn(['active', 'returned', 'all'])
    .withMessage('Status must be one of: active, returned, all'),
  query('userId')
    .optional()
    .custom(value => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid user ID');
      }
      return true;
    }),
  query('bookId')
    .optional()
    .custom(value => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid book ID');
      }
      return true;
    }),
  query('page')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Page must be a non-negative integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { status = 'all', userId, bookId, page = 0, limit = 10 } = req.query;
  const { limit: pageLimit, offset } = getPagination(page, limit);

  let query = {};
  if (status === 'active') {
    query.returnDate = null;
  } else if (status === 'returned') {
    query.returnDate = { $ne: null };
  }
  if (userId) query.userId = userId;
  if (bookId) query.bookId = bookId;

  const borrows = await Borrow.find(query)
    .populate('userId', 'name email')
    .populate('bookId', 'title author isbn')
    .sort({ borrowDate: -1 })
    .limit(pageLimit)
    .skip(offset);

  const total = await Borrow.countDocuments(query);

  sendSuccess(res, 'Borrows retrieved successfully', {
    borrows,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
}));

// @desc    Get borrow by ID
// @route   GET /api/borrows/:id
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid borrow ID', 400);
  }

  const borrow = await Borrow.findById(id)
    .populate('userId', 'name email')
    .populate('bookId', 'title author isbn coverImage');

  if (!borrow) {
    return sendError(res, 'Borrow record not found', 404);
  }

  // Check if user can access this borrow record
  if (req.user.role !== 'librarian' && borrow.userId._id.toString() !== req.user._id.toString()) {
    return sendError(res, 'Access denied', 403);
  }

  sendSuccess(res, 'Borrow record retrieved successfully', { borrow });
}));

// @desc    Get active borrows for a specific book
// @route   GET /api/borrows/book/:bookId/active
// @access  Private (Librarian only)
router.get('/book/:bookId/active', requireLibrarian, asyncHandler(async (req, res) => {
  const { bookId } = req.params;

  if (!isValidObjectId(bookId)) {
    return sendError(res, 'Invalid book ID', 400);
  }

  const borrows = await Borrow.findActiveByBook(bookId);

  sendSuccess(res, 'Active borrows for book retrieved successfully', { borrows });
}));

// @desc    Get borrow statistics
// @route   GET /api/borrows/stats/overview
// @access  Private (Librarian only)
router.get('/stats/overview', requireLibrarian, asyncHandler(async (req, res) => {
  const totalBorrows = await Borrow.countDocuments();
  const activeBorrows = await Borrow.countDocuments({ returnDate: null });
  const returnedBorrows = await Borrow.countDocuments({ returnDate: { $ne: null } });

  // Borrows in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentBorrows = await Borrow.countDocuments({
    borrowDate: { $gte: thirtyDaysAgo }
  });

  // Most borrowed books
  const mostBorrowedBooks = await Borrow.aggregate([
    {
      $group: {
        _id: '$bookId',
        borrowCount: { $sum: 1 }
      }
    },
    {
      $sort: { borrowCount: -1 }
    },
    {
      $limit: 5
    },
    {
      $lookup: {
        from: 'books',
        localField: '_id',
        foreignField: '_id',
        as: 'book'
      }
    },
    {
      $unwind: '$book'
    },
    {
      $project: {
        _id: 0,
        bookId: '$_id',
        title: '$book.title',
        author: '$book.author',
        borrowCount: 1
      }
    }
  ]);

  sendSuccess(res, 'Borrow statistics retrieved successfully', {
    stats: {
      totalBorrows,
      activeBorrows,
      returnedBorrows,
      recentBorrows,
      mostBorrowedBooks
    }
  });
}));

module.exports = router;
