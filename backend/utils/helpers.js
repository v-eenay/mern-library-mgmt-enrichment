const {
  HTTP_STATUS,
  RESPONSE_STATUS,
  PAGINATION,
  VALIDATION_PATTERNS,
  VALIDATION_LENGTHS
} = require('./constants');

/**
 * Generate JWT token (legacy function for backward compatibility)
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  // Lazy load JWT service to avoid circular dependency issues
  const jwtService = require('../services/jwtService');
  return jwtService.generateAccessToken(userId);
};

/**
 * Enhanced pagination helper with validation
 * @param {number} page - Page number
 * @param {number} size - Page size
 * @returns {Object} Pagination object
 */
const getPagination = (page = PAGINATION.DEFAULT_PAGE, size = PAGINATION.DEFAULT_LIMIT) => {
  const limit = Math.min(Math.max(parseInt(size) || PAGINATION.DEFAULT_LIMIT, 1), PAGINATION.MAX_LIMIT);
  const offset = Math.max((parseInt(page) || PAGINATION.DEFAULT_PAGE) - 1, 0) * limit;

  return { limit, offset, page: Math.floor(offset / limit) + 1 };
};

/**
 * Enhanced response helper for consistent API responses
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} status - Response status
 * @param {string} message - Response message
 * @param {*} data - Response data
 * @param {Object} additional - Additional response fields
 * @returns {Object} Express response
 */
const sendResponse = (res, statusCode, status, message, data = null, additional = {}) => {
  const response = {
    status,
    message,
    ...additional
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Success response helper
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {*} data - Response data
 * @param {number} statusCode - HTTP status code
 * @param {Object} additional - Additional response fields
 * @returns {Object} Express response
 */
const sendSuccess = (res, message, data = null, statusCode = HTTP_STATUS.OK, additional = {}) => {
  return sendResponse(res, statusCode, RESPONSE_STATUS.SUCCESS, message, data, additional);
};

/**
 * Error response helper
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Error code
 * @param {Object} additional - Additional error fields
 * @returns {Object} Express response
 */
const sendError = (res, message, statusCode = HTTP_STATUS.BAD_REQUEST, code = null, additional = {}) => {
  const errorData = code ? { code, ...additional } : additional;
  return sendResponse(res, statusCode, RESPONSE_STATUS.ERROR, message, null, errorData);
};

/**
 * Async handler wrapper to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid ObjectId
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate multiple ObjectIds
 * @param {Array} ids - Array of IDs to validate
 * @returns {boolean} True if all IDs are valid
 */
const areValidObjectIds = (ids) => {
  return Array.isArray(ids) && ids.every(isValidObjectId);
};

/**
 * Calculate days between two dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Number of days between dates
 */
const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1 - date2) / oneDay));
};

/**
 * Format date to readable string
 * @param {Date} date - Date to format
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted date string
 */
const formatDate = (date, locale = 'en-US') => {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Enhanced input sanitization
 * @param {string} input - Input to sanitize
 * @param {number} maxLength - Maximum length
 * @returns {string} Sanitized input
 */
const sanitizeInput = (input, maxLength = 1000) => {
  if (typeof input !== 'string') return input;

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .substring(0, maxLength);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
  return VALIDATION_PATTERNS.EMAIL.test(email) &&
         email.length <= VALIDATION_LENGTHS.EMAIL.MAX;
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and errors
 */
const validatePassword = (password) => {
  const errors = [];

  if (!password || password.length < VALIDATION_LENGTHS.PASSWORD.MIN) {
    errors.push(`Password must be at least ${VALIDATION_LENGTHS.PASSWORD.MIN} characters long`);
  }

  if (password && password.length > VALIDATION_LENGTHS.PASSWORD.MAX) {
    errors.push(`Password must not exceed ${VALIDATION_LENGTHS.PASSWORD.MAX} characters`);
  }

  if (!VALIDATION_PATTERNS.PASSWORD.test(password)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Build search query for MongoDB text search
 * @param {string} searchTerm - Search term
 * @returns {Object|null} MongoDB text search query
 */
const buildTextSearchQuery = (searchTerm) => {
  if (!searchTerm || typeof searchTerm !== 'string') return null;

  const sanitizedTerm = sanitizeInput(searchTerm.trim(), 100);
  if (!sanitizedTerm) return null;

  // Escape special regex characters and prepare for text search
  const escapedTerm = sanitizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    $text: { $search: escapedTerm }
  };
};

/**
 * Build regex query for partial matching
 * @param {string} field - Field name
 * @param {string} value - Search value
 * @returns {Object|null} MongoDB regex query
 */
const buildRegexQuery = (field, value) => {
  if (!value || typeof value !== 'string' || !field) return null;

  const sanitizedValue = sanitizeInput(value.trim(), 100);
  if (!sanitizedValue) return null;

  const escapedValue = sanitizedValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    [field]: new RegExp(escapedValue, 'i')
  };
};

/**
 * Build multiple field search query
 * @param {Array} fields - Array of field names
 * @param {string} value - Search value
 * @returns {Object|null} MongoDB $or query
 */
const buildMultiFieldQuery = (fields, value) => {
  if (!Array.isArray(fields) || !value) return null;

  const queries = fields
    .map(field => buildRegexQuery(field, value))
    .filter(query => query !== null);

  return queries.length > 0 ? { $or: queries } : null;
};

/**
 * Parse and validate date range
 * @param {string} dateFrom - Start date
 * @param {string} dateTo - End date
 * @returns {Object|null} MongoDB date range query
 */
const parseDateRange = (dateFrom, dateTo) => {
  const range = {};

  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    if (isNaN(fromDate.getTime())) {
      throw new Error('Invalid date from format');
    }
    range.$gte = fromDate;
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    if (isNaN(toDate.getTime())) {
      throw new Error('Invalid date to format');
    }
    // Set to end of day
    toDate.setHours(23, 59, 59, 999);
    range.$lte = toDate;
  }

  return Object.keys(range).length > 0 ? range : null;
};

// Parse and validate quantity range
const parseQuantityRange = (minQuantity, maxQuantity) => {
  const range = {};

  if (minQuantity !== undefined) {
    const min = parseInt(minQuantity);
    if (isNaN(min) || min < 0) {
      throw new Error('Invalid minimum quantity');
    }
    range.$gte = min;
  }

  if (maxQuantity !== undefined) {
    const max = parseInt(maxQuantity);
    if (isNaN(max) || max < 0) {
      throw new Error('Invalid maximum quantity');
    }
    range.$lte = max;
  }

  return Object.keys(range).length > 0 ? range : null;
};

// Build sort object for MongoDB
const buildSortObject = (sortBy = 'createdAt', sortOrder = 'desc', hasTextSearch = false) => {
  const sort = {};

  // If text search is used, prioritize text score
  if (hasTextSearch) {
    sort.score = { $meta: 'textScore' };
  }

  // Add the specified sort field
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  return sort;
};

// Calculate search performance metrics
const calculateSearchMetrics = (startTime, totalResults, returnedResults) => {
  const endTime = Date.now();
  const searchTime = endTime - startTime;

  return {
    searchTime: `${searchTime}ms`,
    totalResults,
    returnedResults,
    efficiency: totalResults > 0 ? (returnedResults / totalResults * 100).toFixed(2) + '%' : '0%'
  };
};

module.exports = {
  // Legacy functions
  generateToken,

  // Response helpers
  sendResponse,
  sendSuccess,
  sendError,

  // Utility functions
  asyncHandler,
  getPagination,

  // Validation functions
  isValidObjectId,
  areValidObjectIds,
  isValidEmail,
  validatePassword,

  // Date functions
  daysBetween,
  formatDate,
  parseDateRange,

  // String functions
  sanitizeInput,

  // Query building functions
  buildTextSearchQuery,
  buildRegexQuery,
  buildMultiFieldQuery,
  parseQuantityRange,
  buildSortObject,

  // Performance functions
  calculateSearchMetrics
};
