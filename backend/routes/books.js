const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Book, Review } = require('../models');
const { authenticate, requireLibrarian } = require('../middleware/auth');
const { sendSuccess, sendError, asyncHandler, isValidObjectId, getPagination } = require('../utils/helpers');

const router = express.Router();

// @desc    Get all books with pagination, search, and filtering
// @route   GET /api/books
// @access  Public
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Page must be a non-negative integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('category')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Category must not be empty'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search term must not be empty'),
  query('available')
    .optional()
    .isBoolean()
    .withMessage('Available must be a boolean value'),
  query('sortBy')
    .optional()
    .isIn(['title', 'author', 'createdAt', 'category'])
    .withMessage('SortBy must be one of: title, author, createdAt, category'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('SortOrder must be either asc or desc')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { 
    page = 0, 
    limit = 10, 
    category, 
    search, 
    available, 
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query;
  
  const { limit: pageLimit, offset } = getPagination(page, limit);

  // Build query
  let query = {};
  if (category) query.category = new RegExp(category, 'i');
  if (available === 'true') query.available = { $gt: 0 };
  if (search) {
    query.$or = [
      { title: new RegExp(search, 'i') },
      { author: new RegExp(search, 'i') },
      { isbn: new RegExp(search, 'i') }
    ];
  }

  // Build sort
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const books = await Book.find(query)
    .sort(sort)
    .limit(pageLimit)
    .skip(offset);

  const total = await Book.countDocuments(query);

  sendSuccess(res, 'Books retrieved successfully', {
    books,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
}));

// @desc    Get book by ID with reviews
// @route   GET /api/books/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid book ID', 400);
  }

  const book = await Book.findById(id);
  if (!book) {
    return sendError(res, 'Book not found', 404);
  }

  // Get average rating and review count
  const reviewStats = await Review.getAverageRating(id);

  sendSuccess(res, 'Book retrieved successfully', {
    book: {
      ...book.toObject(),
      averageRating: reviewStats.averageRating,
      totalReviews: reviewStats.totalReviews,
      ratingDistribution: reviewStats.ratingDistribution
    }
  });
}));

// @desc    Create new book
// @route   POST /api/books
// @access  Private (Librarian only)
router.post('/', authenticate, requireLibrarian, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('author')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Author must be between 1 and 100 characters'),
  body('isbn')
    .trim()
    .matches(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/)
    .withMessage('Please provide a valid ISBN'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('coverImage')
    .optional()
    .isURL()
    .withMessage('Cover image must be a valid URL')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { title, author, isbn, category, description, quantity, coverImage } = req.body;

  // Check if ISBN already exists
  const existingBook = await Book.findOne({ isbn });
  if (existingBook) {
    return sendError(res, 'Book with this ISBN already exists', 400);
  }

  const book = new Book({
    title,
    author,
    isbn,
    category,
    description,
    quantity,
    available: quantity,
    coverImage
  });

  await book.save();

  sendSuccess(res, 'Book created successfully', { book }, 201);
}));

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Librarian only)
router.put('/:id', authenticate, requireLibrarian, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('author')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Author must be between 1 and 100 characters'),
  body('isbn')
    .optional()
    .trim()
    .matches(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/)
    .withMessage('Please provide a valid ISBN'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be at least 0'),
  body('available')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available must be at least 0'),
  body('coverImage')
    .optional()
    .isURL()
    .withMessage('Cover image must be a valid URL')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { id } = req.params;
  const updateData = req.body;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid book ID', 400);
  }

  const book = await Book.findById(id);
  if (!book) {
    return sendError(res, 'Book not found', 404);
  }

  // Check if ISBN is being changed and if it already exists
  if (updateData.isbn && updateData.isbn !== book.isbn) {
    const existingBook = await Book.findOne({ isbn: updateData.isbn });
    if (existingBook) {
      return sendError(res, 'Book with this ISBN already exists', 400);
    }
  }

  // Validate available count doesn't exceed quantity
  if (updateData.available !== undefined && updateData.quantity !== undefined) {
    if (updateData.available > updateData.quantity) {
      return sendError(res, 'Available count cannot exceed total quantity', 400);
    }
  } else if (updateData.available !== undefined) {
    if (updateData.available > book.quantity) {
      return sendError(res, 'Available count cannot exceed total quantity', 400);
    }
  } else if (updateData.quantity !== undefined) {
    if (book.available > updateData.quantity) {
      return sendError(res, 'Cannot reduce quantity below current available count', 400);
    }
  }

  Object.assign(book, updateData);
  await book.save();

  sendSuccess(res, 'Book updated successfully', { book });
}));

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Librarian only)
router.delete('/:id', authenticate, requireLibrarian, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid book ID', 400);
  }

  const book = await Book.findById(id);
  if (!book) {
    return sendError(res, 'Book not found', 404);
  }

  // Check if book has active borrows
  const { Borrow } = require('../models');
  const activeBorrows = await Borrow.findActiveByBook(id);
  if (activeBorrows.length > 0) {
    return sendError(res, 'Cannot delete book with active borrows', 400);
  }

  await Book.findByIdAndDelete(id);

  sendSuccess(res, 'Book deleted successfully');
}));

// @desc    Get available books
// @route   GET /api/books/available/list
// @access  Public
router.get('/available/list', asyncHandler(async (req, res) => {
  const books = await Book.findAvailable().sort({ title: 1 });

  sendSuccess(res, 'Available books retrieved successfully', { books });
}));

// @desc    Search books by category
// @route   GET /api/books/category/:category
// @access  Public
router.get('/category/:category', asyncHandler(async (req, res) => {
  const { category } = req.params;
  const books = await Book.findByCategory(category).sort({ title: 1 });

  sendSuccess(res, 'Books by category retrieved successfully', { books, category });
}));

module.exports = router;
