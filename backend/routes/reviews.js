const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Review, Book, Borrow } = require('../models');
const { authenticate, requireLibrarian } = require('../middleware/auth');
const { sendSuccess, sendError, asyncHandler, isValidObjectId, getPagination } = require('../utils/helpers');

const router = express.Router();

// @desc    Create a review for a book
// @route   POST /api/reviews
// @access  Private
router.post('/', authenticate, [
  body('bookId')
    .notEmpty()
    .withMessage('Book ID is required')
    .custom(value => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid book ID');
      }
      return true;
    }),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { bookId, rating, comment } = req.body;
  const userId = req.user._id;

  // Check if book exists
  const book = await Book.findById(bookId);
  if (!book) {
    return sendError(res, 'Book not found', 404);
  }

  // Check if user has already reviewed this book
  const existingReview = await Review.hasUserReviewed(userId, bookId);
  if (existingReview) {
    return sendError(res, 'You have already reviewed this book', 400);
  }

  // Check if user has borrowed this book (validation is also in the model)
  const hasBorrowed = await Borrow.findOne({ userId, bookId });
  if (!hasBorrowed) {
    return sendError(res, 'You can only review books you have borrowed', 400);
  }

  const review = new Review({
    userId,
    bookId,
    rating,
    comment: comment || ''
  });

  await review.save();

  // Populate the review for response
  await review.populate('userId', 'name');
  await review.populate('bookId', 'title author');

  sendSuccess(res, 'Review created successfully', { review }, 201);
}));

// @desc    Get reviews for a book
// @route   GET /api/reviews/book/:bookId
// @access  Public
router.get('/book/:bookId', [
  query('page')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Page must be a non-negative integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'rating'])
    .withMessage('SortBy must be either createdAt or rating'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('SortOrder must be either asc or desc')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { bookId } = req.params;
  const { page = 0, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  if (!isValidObjectId(bookId)) {
    return sendError(res, 'Invalid book ID', 400);
  }

  // Check if book exists
  const book = await Book.findById(bookId);
  if (!book) {
    return sendError(res, 'Book not found', 404);
  }

  const { limit: pageLimit, offset } = getPagination(page, limit);

  const reviews = await Review.findByBook(bookId, {
    limit: pageLimit,
    skip: offset,
    sortBy,
    sortOrder: sortOrder === 'asc' ? 1 : -1
  });

  const total = await Review.countDocuments({ bookId });

  // Get average rating and distribution
  const reviewStats = await Review.getAverageRating(bookId);

  sendSuccess(res, 'Book reviews retrieved successfully', {
    bookId,
    bookTitle: book.title,
    reviews,
    reviewStats,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
}));

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
router.get('/my-reviews', authenticate, [
  query('page')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Page must be a non-negative integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { page = 0, limit = 10 } = req.query;
  const userId = req.user._id;
  const { limit: pageLimit, offset } = getPagination(page, limit);

  const reviews = await Review.findByUser(userId, {
    limit: pageLimit,
    skip: offset
  });

  const total = await Review.countDocuments({ userId });

  sendSuccess(res, 'User reviews retrieved successfully', {
    reviews,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
}));

// @desc    Get review by ID
// @route   GET /api/reviews/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid review ID', 400);
  }

  const review = await Review.findById(id)
    .populate('userId', 'name')
    .populate('bookId', 'title author isbn');

  if (!review) {
    return sendError(res, 'Review not found', 404);
  }

  sendSuccess(res, 'Review retrieved successfully', { review });
}));

// @desc    Update user's review
// @route   PUT /api/reviews/:id
// @access  Private
router.put('/:id', authenticate, [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid review ID', 400);
  }

  const review = await Review.findById(id);
  if (!review) {
    return sendError(res, 'Review not found', 404);
  }

  // Check if user owns this review (unless librarian)
  if (req.user.role !== 'librarian' && review.userId.toString() !== userId.toString()) {
    return sendError(res, 'You can only update your own reviews', 403);
  }

  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;

  await review.save();

  // Populate for response
  await review.populate('userId', 'name');
  await review.populate('bookId', 'title author');

  sendSuccess(res, 'Review updated successfully', { review });
}));

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid review ID', 400);
  }

  const review = await Review.findById(id);
  if (!review) {
    return sendError(res, 'Review not found', 404);
  }

  // Check if user owns this review (unless librarian)
  if (req.user.role !== 'librarian' && review.userId.toString() !== userId.toString()) {
    return sendError(res, 'You can only delete your own reviews', 403);
  }

  await Review.findByIdAndDelete(id);

  sendSuccess(res, 'Review deleted successfully');
}));

// @desc    Get all reviews (Librarian only)
// @route   GET /api/reviews
// @access  Private (Librarian only)
router.get('/', authenticate, requireLibrarian, [
  query('page')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Page must be a non-negative integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
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
    })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { page = 0, limit = 10, rating, userId, bookId } = req.query;
  const { limit: pageLimit, offset } = getPagination(page, limit);

  // Build query
  let query = {};
  if (rating) query.rating = parseInt(rating);
  if (userId) query.userId = userId;
  if (bookId) query.bookId = bookId;

  const reviews = await Review.find(query)
    .populate('userId', 'name email')
    .populate('bookId', 'title author isbn')
    .sort({ createdAt: -1 })
    .limit(pageLimit)
    .skip(offset);

  const total = await Review.countDocuments(query);

  sendSuccess(res, 'All reviews retrieved successfully', {
    reviews,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
}));

// @desc    Get recent reviews
// @route   GET /api/reviews/recent/list
// @access  Public
router.get('/recent/list', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { limit = 10 } = req.query;

  const reviews = await Review.getRecentReviews(parseInt(limit));

  sendSuccess(res, 'Recent reviews retrieved successfully', { reviews });
}));

// @desc    Get top-rated books
// @route   GET /api/reviews/top-rated/books
// @access  Public
router.get('/top-rated/books', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { limit = 10 } = req.query;

  const topRatedBooks = await Review.getTopRatedBooks(parseInt(limit));

  sendSuccess(res, 'Top-rated books retrieved successfully', { books: topRatedBooks });
}));

module.exports = router;
