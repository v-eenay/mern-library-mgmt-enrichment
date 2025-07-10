const { body, query, param, validationResult } = require('express-validator');
const { sendError, isValidObjectId } = require('../utils/helpers');
const securityValidation = require('./securityValidationService');
const validator = require('validator');

// Common validation rules
const validationRules = {
  // Enhanced user validation rules with security checks
  user: {
    name: body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s\-\.\']+$/)
      .withMessage('Name can only contain letters, spaces, hyphens, periods, and apostrophes')
      .custom((value) => {
        if (securityValidation.containsSuspiciousPatterns(value)) {
          throw new Error('Name contains invalid characters');
        }
        return true;
      })
      .customSanitizer((value) => securityValidation.sanitizeInput(value)),

    email: body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email')
      .custom((value) => {
        const validation = securityValidation.validateEmail(value);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }
        return true;
      }),

    password: body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .custom((value) => {
        const validation = securityValidation.validatePassword(value);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }
        return true;
      }),

    role: body('role')
      .optional()
      .isIn(['borrower', 'librarian'])
      .withMessage('Role must be either borrower or librarian')
      .custom((value) => {
        if (value && securityValidation.containsSuspiciousPatterns(value)) {
          throw new Error('Role contains invalid characters');
        }
        return true;
      })
  },

  // Enhanced book validation rules with security checks
  book: {
    title: body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters')
      .custom((value) => {
        if (securityValidation.containsSuspiciousPatterns(value)) {
          throw new Error('Title contains invalid characters');
        }
        return true;
      })
      .customSanitizer((value) => securityValidation.sanitizeInput(value)),

    author: body('author')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Author must be between 1 and 100 characters')
      .matches(/^[a-zA-Z\s\-\.\']+$/)
      .withMessage('Author name can only contain letters, spaces, hyphens, periods, and apostrophes')
      .custom((value) => {
        if (securityValidation.containsSuspiciousPatterns(value)) {
          throw new Error('Author contains invalid characters');
        }
        return true;
      })
      .customSanitizer((value) => securityValidation.sanitizeInput(value)),

    isbn: body('isbn')
      .trim()
      .custom((value) => {
        if (!securityValidation.isValidISBN(value)) {
          throw new Error('Invalid ISBN format');
        }
        if (securityValidation.containsSuspiciousPatterns(value)) {
          throw new Error('ISBN contains invalid characters');
        }
        return true;
      })
      .customSanitizer((value) => {
        // Normalize ISBN format
        return value.replace(/[-\s]/g, '');
      }),

    category: body('category')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Category must be between 1 and 50 characters')
      .matches(/^[a-zA-Z\s\-&]+$/)
      .withMessage('Category can only contain letters, spaces, hyphens, and ampersands')
      .custom((value) => {
        if (securityValidation.containsSuspiciousPatterns(value)) {
          throw new Error('Category contains invalid characters');
        }
        return true;
      })
      .customSanitizer((value) => securityValidation.sanitizeInput(value)),

    description: body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters')
      .custom((value) => {
        if (value && securityValidation.containsSuspiciousPatterns(value)) {
          throw new Error('Description contains invalid characters');
        }
        return true;
      })
      .customSanitizer((value) => {
        if (!value) return value;
        return securityValidation.sanitizeInput(value);
      }),

    quantity: body('quantity')
      .isInt({ min: 1, max: 10000 })
      .withMessage('Quantity must be a positive integer between 1 and 10000'),

    coverImage: body('coverImage')
      .optional()
      .custom((value) => {
        if (value && !validator.isURL(value)) {
          throw new Error('Cover image must be a valid URL');
        }
        if (value && securityValidation.containsSuspiciousPatterns(value)) {
          throw new Error('Cover image URL contains invalid characters');
        }
        return true;
      })
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
      .matches(/^[a-zA-Z\s\-\.]+$/)
      .withMessage('Name can only contain letters, spaces, hyphens, and periods'),
    email: body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address')
      .custom(async (value) => {
        // Enhanced email validation with domain verification
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(value)) {
          throw new Error('Invalid email format');
        }

        // Check for common disposable email domains
        const disposableDomains = [
          '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
          'mailinator.com', 'throwaway.email', 'temp-mail.org'
        ];
        const domain = value.split('@')[1].toLowerCase();
        if (disposableDomains.includes(domain)) {
          throw new Error('Disposable email addresses are not allowed');
        }

        return true;
      }),
    subject: body('subject')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Subject must be between 5 and 200 characters')
      .custom(value => {
        // Basic content sanitization
        if (/<script|javascript:|on\w+=/i.test(value)) {
          throw new Error('Subject contains invalid content');
        }
        return true;
      })
      .customSanitizer(value => {
        return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      }),
    category: body('category')
      .isIn(['general_inquiry', 'book_request', 'technical_support', 'complaint', 'suggestion'])
      .withMessage('Category must be one of: general_inquiry, book_request, technical_support, complaint, suggestion'),
    message: body('message')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Message must be between 10 and 1000 characters')
      .custom(value => {
        // Enhanced content sanitization and spam detection
        if (/<script|javascript:|on\w+=/i.test(value)) {
          throw new Error('Message contains invalid content');
        }
        // Check for excessive repeated characters (spam pattern)
        if (/(.)\1{10,}/.test(value)) {
          throw new Error('Message contains excessive repeated characters');
        }
        // Check for excessive URLs (spam pattern)
        const urlCount = (value.match(/https?:\/\/[^\s]+/g) || []).length;
        if (urlCount > 3) {
          throw new Error('Message contains too many URLs');
        }
        return true;
      })
      .customSanitizer(value => {
        return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      }),
    priority: body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Priority must be one of: low, medium, high, urgent'),
    status: body('status')
      .optional()
      .isIn(['unread', 'read', 'in_progress', 'resolved', 'archived'])
      .withMessage('Status must be one of: unread, read, in_progress, resolved, archived'),
    notes: body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
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
      .custom(value => {
        if (value && value.trim().length > 0 && value.trim().length < 10) {
          throw new Error('Comment must be at least 10 characters long if provided');
        }
        // Basic content sanitization - remove potentially harmful content
        if (value && /<script|javascript:|on\w+=/i.test(value)) {
          throw new Error('Comment contains invalid content');
        }
        // Check for excessive special characters or spam patterns
        if (value && /(.)\1{10,}/.test(value)) {
          throw new Error('Comment contains excessive repeated characters');
        }
        return true;
      })
      .customSanitizer(value => {
        if (!value) return value;
        // Remove HTML tags and normalize whitespace
        return value
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      })
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
  submitContact: createValidationMiddleware([
    validationRules.contact.name,
    validationRules.contact.email,
    validationRules.contact.subject,
    validationRules.contact.category,
    validationRules.contact.message,
    validationRules.contact.priority
  ]),

  updateContactStatus: createValidationMiddleware([
    validationRules.contact.status,
    validationRules.contact.notes
  ]),
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
