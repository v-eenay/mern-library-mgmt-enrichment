const jwt = require('jsonwebtoken');
const jwtService = require('../services/jwtService');

// Generate JWT token (legacy function for backward compatibility)
const generateToken = (userId) => {
  return jwtService.generateAccessToken(userId);
};

// Pagination helper
const getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const offset = page ? page * limit : 0;

  return { limit, offset };
};

// Response helper for consistent API responses
const sendResponse = (res, statusCode, status, message, data = null) => {
  const response = {
    status,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

// Success response helper
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return sendResponse(res, statusCode, 'success', message, data);
};

// Error response helper
const sendError = (res, message, statusCode = 400) => {
  return sendResponse(res, statusCode, 'error', message);
};

// Async handler wrapper to catch errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validate ObjectId
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Calculate days between two dates
const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1 - date2) / oneDay));
};

// Format date to readable string
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Sanitize user input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

// Build search query for MongoDB text search
const buildTextSearchQuery = (searchTerm) => {
  if (!searchTerm) return null;

  // Escape special regex characters and prepare for text search
  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    $text: { $search: escapedTerm }
  };
};

// Build regex query for partial matching
const buildRegexQuery = (field, value) => {
  if (!value) return null;

  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    [field]: new RegExp(escapedValue, 'i')
  };
};

// Parse and validate date range
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
  generateToken,
  getPagination,
  sendResponse,
  sendSuccess,
  sendError,
  asyncHandler,
  isValidObjectId,
  daysBetween,
  formatDate,
  sanitizeInput,
  buildTextSearchQuery,
  buildRegexQuery,
  parseDateRange,
  parseQuantityRange,
  buildSortObject,
  calculateSearchMetrics
};
