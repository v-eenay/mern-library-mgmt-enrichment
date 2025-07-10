const { body, query, validationResult } = require('express-validator');
const { sendError, isValidObjectId } = require('../utils/helpers');

// Common validation rules
const validationRules = {
  // User validation rules
  user: {
    name: body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    email: body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    password: body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    role: body('role')
      .optional()
      .isIn(['borrower', 'librarian'])
      .withMessage('Role must be either borrower or librarian')
  },

  // Book validation rules
  book: {
    title: body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    author: body('author')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Author must be between 1 and 100 characters'),
    isbn: body('isbn')
      .trim()
      .matches(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/)
      .withMessage('Please provide a valid ISBN'),
    category: body('category')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Category must be between 1 and 50 characters'),
    description: body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    quantity: body('quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    coverImage: body('coverImage')
      .optional()
      .isURL()
      .withMessage('Cover image must be a valid URL')
  },

  // Category validation rules
  category: {
    name: body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Category name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Category name can only contain letters and spaces')
  },

  // Contact validation rules
  contact: {
    name: body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),
    email: body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    message: body('message')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Message must be between 10 and 1000 characters')
  },

  // Borrow validation rules
  borrow: {
    bookId: body('bookId')
      .isMongoId()
      .withMessage('Please provide a valid book ID'),
    borrowPeriodDays: body('borrowPeriodDays')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Borrow period must be between 1 and 30 days'),
    additionalDays: body('additionalDays')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Additional days must be between 1 and 30')
  },

  // Review validation rules
  review: {
    bookId: body('bookId')
      .notEmpty()
      .withMessage('Book ID is required')
      .custom(value => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid book ID');
        }
        return true;
      }),
    rating: body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be an integer between 1 and 5'),
    comment: body('comment')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Comment cannot exceed 500 characters')
  },

  // Query validation rules
  query: {
    page: query('page')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Page must be a non-negative integer'),
    limit: query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    search: query('search')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Search term must not be empty'),
    q: query('q')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Search term must not be empty'),
    title: query('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title search must be between 1 and 200 characters'),
    author: query('author')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Author search must be between 1 and 100 characters'),
    isbn: query('isbn')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('ISBN search must not be empty'),
    category: query('category')
      .optional()
      .custom((value) => {
        if (Array.isArray(value)) {
          return value.every(cat => typeof cat === 'string' && cat.trim().length > 0);
        }
        return typeof value === 'string' && value.trim().length > 0;
      })
      .withMessage('Category must be a non-empty string or array of non-empty strings'),
    available: query('available')
      .optional()
      .isIn(['true', 'false', 'all', true, false])
      .withMessage('Available must be true, false, or all'),
    minQuantity: query('minQuantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Minimum quantity must be a non-negative integer'),
    maxQuantity: query('maxQuantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Maximum quantity must be a non-negative integer'),
    dateFrom: query('dateFrom')
      .optional()
      .isISO8601()
      .withMessage('Date from must be a valid ISO 8601 date'),
    dateTo: query('dateTo')
      .optional()
      .isISO8601()
      .withMessage('Date to must be a valid ISO 8601 date'),
    sortBy: query('sortBy')
      .optional()
      .isIn(['title', 'author', 'createdAt', 'category', 'rating', 'quantity', 'available', 'isbn'])
      .withMessage('SortBy must be one of: title, author, createdAt, category, rating, quantity, available, isbn'),
    sortOrder: query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('SortOrder must be either asc or desc')
  }
};

// Validation middleware factory
const createValidationMiddleware = (rules) => {
  return [
    ...rules,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 'Validation failed', 400);
      }
      next();
    }
  ];
};

// Pre-defined validation middleware sets
const validationMiddleware = {
  // Auth validations
  register: createValidationMiddleware([
    validationRules.user.name,
    validationRules.user.email,
    validationRules.user.password,
    validationRules.user.role
  ]),
  
  login: createValidationMiddleware([
    validationRules.user.email,
    body('password').notEmpty().withMessage('Password is required')
  ]),

  updateProfile: createValidationMiddleware([
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email')
  ]),

  changePassword: createValidationMiddleware([
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
    body('confirmNewPassword')
      .notEmpty()
      .withMessage('Password confirmation is required')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Password confirmation does not match new password');
        }
        return true;
      })
  ]),

  // Book validations
  createBook: createValidationMiddleware([
    validationRules.book.title,
    validationRules.book.author,
    validationRules.book.isbn,
    validationRules.book.category,
    validationRules.book.description,
    validationRules.book.quantity,
    validationRules.book.coverImage
  ]),

  updateBook: createValidationMiddleware([
    body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
    body('author').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Author must be between 1 and 100 characters'),
    body('isbn').optional().trim().matches(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/).withMessage('Please provide a valid ISBN'),
    validationRules.book.category.optional(),
    validationRules.book.description,
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be at least 0'),
    body('available').optional().isInt({ min: 0 }).withMessage('Available must be at least 0'),
    validationRules.book.coverImage
  ]),

  // Other validations
  createCategory: createValidationMiddleware([validationRules.category.name]),
  updateCategory: createValidationMiddleware([validationRules.category.name]),
  submitContact: createValidationMiddleware([validationRules.contact.name, validationRules.contact.email, validationRules.contact.message]),
  createReview: createValidationMiddleware([validationRules.review.bookId, validationRules.review.rating, validationRules.review.comment]),
  updateReview: createValidationMiddleware([
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
    validationRules.review.comment
  ]),

  // Query validations
  pagination: createValidationMiddleware([validationRules.query.page, validationRules.query.limit]),
  bookQuery: createValidationMiddleware([
    validationRules.query.page,
    validationRules.query.limit,
    validationRules.query.search,
    validationRules.query.q,
    validationRules.query.title,
    validationRules.query.author,
    validationRules.query.isbn,
    validationRules.query.category,
    validationRules.query.available,
    validationRules.query.minQuantity,
    validationRules.query.maxQuantity,
    validationRules.query.dateFrom,
    validationRules.query.dateTo,
    validationRules.query.sortBy,
    validationRules.query.sortOrder,
    // Custom validation for quantity range
    query().custom((value, { req }) => {
      const { minQuantity, maxQuantity } = req.query;
      if (minQuantity && maxQuantity && parseInt(minQuantity) > parseInt(maxQuantity)) {
        throw new Error('Minimum quantity cannot be greater than maximum quantity');
      }
      return true;
    }),
    // Custom validation for date range
    query().custom((value, { req }) => {
      const { dateFrom, dateTo } = req.query;
      if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
        throw new Error('Date from cannot be later than date to');
      }
      return true;
    })
  ]),

  // Advanced search validation (alias for bookQuery)
  advancedSearch: createValidationMiddleware([
    validationRules.query.page,
    validationRules.query.limit,
    validationRules.query.search,
    validationRules.query.q,
    validationRules.query.title,
    validationRules.query.author,
    validationRules.query.isbn,
    validationRules.query.category,
    validationRules.query.available,
    validationRules.query.minQuantity,
    validationRules.query.maxQuantity,
    validationRules.query.dateFrom,
    validationRules.query.dateTo,
    validationRules.query.sortBy,
    validationRules.query.sortOrder
  ]),

  // Borrow validations
  borrowBook: createValidationMiddleware([
    validationRules.borrow.bookId,
    validationRules.borrow.borrowPeriodDays
  ]),

  extendDueDate: createValidationMiddleware([
    validationRules.borrow.additionalDays
  ])
};

module.exports = {
  validationRules,
  validationMiddleware,
  createValidationMiddleware
};
