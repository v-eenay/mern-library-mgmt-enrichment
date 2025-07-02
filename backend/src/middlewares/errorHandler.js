/**
 * Error Handling Middleware
 * 
 * This module provides centralized error handling for the application.
 * It catches and processes different types of errors and returns
 * standardized error responses.
 * 
 * @author HRMS Development Team
 * @version 2.0.0
 */

/**
 * Global Error Handler Middleware
 * Catches all errors and returns standardized error responses
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error caught by global handler:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let error = {
    success: false,
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  };

  let statusCode = 500;

  // MongoDB Validation Error
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map(val => val.message);
    error = {
      success: false,
      error: 'Validation failed',
      details: validationErrors,
      timestamp: new Date().toISOString()
    };
    statusCode = 400;
  }

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const value = err.keyValue[field];
    error = {
      success: false,
      error: `Duplicate value for ${field}`,
      message: `${field} '${value}' already exists`,
      code: 'DUPLICATE_FIELD',
      timestamp: new Date().toISOString()
    };
    statusCode = 409;
  }

  // MongoDB Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    error = {
      success: false,
      error: 'Invalid ID format',
      message: `Invalid ${err.path}: ${err.value}`,
      code: 'INVALID_ID',
      timestamp: new Date().toISOString()
    };
    statusCode = 400;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      error: 'Invalid token',
      message: 'Please provide a valid authentication token',
      code: 'INVALID_TOKEN',
      timestamp: new Date().toISOString()
    };
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      error: 'Token expired',
      message: 'Authentication token has expired',
      code: 'TOKEN_EXPIRED',
      timestamp: new Date().toISOString()
    };
    statusCode = 401;
  }

  // Custom Application Errors
  if (err.statusCode) {
    statusCode = err.statusCode;
    error.error = err.message;
    if (err.code) error.code = err.code;
  }

  // Don't expose error details in production
  if (process.env.NODE_ENV === 'production') {
    delete error.message;
    if (statusCode === 500) {
      error.error = 'Something went wrong';
    }
  }

  res.status(statusCode).json(error);
};

/**
 * 404 Not Found Handler
 * Handles requests to non-existent routes
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const notFoundHandler = (req, res, next) => {
  const error = {
    success: false,
    error: 'Route not found',
    message: `The route ${req.method} ${req.originalUrl} does not exist`,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString()
  };

  res.status(404).json(error);
};

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors automatically
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom Error Class
 * Creates custom application errors with status codes
 */
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error Helper
 * Creates validation error with details
 * 
 * @param {string} message - Error message
 * @param {Array} details - Validation error details
 * @returns {AppError} Custom error instance
 */
const createValidationError = (message, details = []) => {
  const error = new AppError(message, 400, 'VALIDATION_ERROR');
  error.details = details;
  return error;
};

/**
 * Not Found Error Helper
 * Creates not found error
 * 
 * @param {string} resource - Resource name
 * @param {string} id - Resource ID
 * @returns {AppError} Custom error instance
 */
const createNotFoundError = (resource, id = null) => {
  const message = id ? 
    `${resource} with ID ${id} not found` : 
    `${resource} not found`;
  return new AppError(message, 404, 'NOT_FOUND');
};

/**
 * Unauthorized Error Helper
 * Creates unauthorized error
 * 
 * @param {string} message - Error message
 * @returns {AppError} Custom error instance
 */
const createUnauthorizedError = (message = 'Unauthorized access') => {
  return new AppError(message, 401, 'UNAUTHORIZED');
};

/**
 * Forbidden Error Helper
 * Creates forbidden error
 * 
 * @param {string} message - Error message
 * @returns {AppError} Custom error instance
 */
const createForbiddenError = (message = 'Access forbidden') => {
  return new AppError(message, 403, 'FORBIDDEN');
};

/**
 * Conflict Error Helper
 * Creates conflict error
 * 
 * @param {string} message - Error message
 * @returns {AppError} Custom error instance
 */
const createConflictError = (message) => {
  return new AppError(message, 409, 'CONFLICT');
};

export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  createValidationError,
  createNotFoundError,
  createUnauthorizedError,
  createForbiddenError,
  createConflictError
};

export default errorHandler;
