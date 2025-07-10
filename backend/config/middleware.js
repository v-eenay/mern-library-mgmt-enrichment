/**
 * Middleware Configuration
 * Centralized middleware setup for the Express application
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const securityMiddleware = require('../middleware/securityMiddleware');
const { RATE_LIMITS, DEFAULTS } = require('../utils/constants');

/**
 * Configure CORS options
 */
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : [DEFAULTS.CORS_ORIGIN];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
    'X-Requested-With'
  ],
  exposedHeaders: [
    'X-Token-Refresh-Suggested',
    'X-Token-Expires-In',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ]
};

/**
 * Configure Helmet security headers
 */
const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      connectSrc: ["'self'"],
      workerSrc: ["'self'"],
      manifestSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
};

/**
 * Configure rate limiting
 */
const generalRateLimit = rateLimit({
  windowMs: RATE_LIMITS.GENERAL.WINDOW_MS,
  max: RATE_LIMITS.GENERAL.MAX_REQUESTS,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(RATE_LIMITS.GENERAL.WINDOW_MS / 1000 / 60) + ' minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(RATE_LIMITS.GENERAL.WINDOW_MS / 1000 / 60) + ' minutes'
    });
  }
});

/**
 * Configure Morgan logging
 */
const morganFormat = process.env.NODE_ENV === 'production' 
  ? 'combined' 
  : 'dev';

const morganOptions = {
  skip: (req, res) => {
    // Skip logging for health checks and static files in production
    if (process.env.NODE_ENV === 'production') {
      return req.url === '/health' || req.url.startsWith('/uploads/');
    }
    return false;
  }
};

/**
 * Apply all middleware to Express app
 * @param {Object} app - Express application instance
 */
const applyMiddleware = (app) => {
  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet(helmetOptions));
  
  // CORS middleware
  app.use(cors(corsOptions));
  
  // Rate limiting
  app.use(generalRateLimit);
  
  // Logging middleware
  app.use(morgan(morganFormat, morganOptions));
  
  // Body parsing middleware
  app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));
  
  // Cookie parsing middleware
  app.use(cookieParser());
  
  // Custom security middleware (only use methods that exist)
  app.use(securityMiddleware.securityHeaders());
  app.use(securityMiddleware.suspiciousIPBlocking());
  app.use(securityMiddleware.parameterPollutionProtection());
  app.use(securityMiddleware.requestSizeLimit('10mb'));
  app.use(securityMiddleware.xssProtection());
  app.use(securityMiddleware.suspiciousPatternDetection());

  // Static file serving
  app.use('/uploads', express.static('uploads', {
    maxAge: '1d',
    etag: true,
    lastModified: true
  }));
};

/**
 * Apply error handling middleware
 * @param {Object} app - Express application instance
 */
const applyErrorHandling = (app) => {
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      status: 'error',
      message: `Route ${req.originalUrl} not found`,
      code: 'ROUTE_NOT_FOUND'
    });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Error:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors
      });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({
        status: 'error',
        message: `${field} already exists`,
        code: 'DUPLICATE_ENTRY'
      });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    // CORS error
    if (err.message && err.message.includes('CORS')) {
      return res.status(403).json({
        status: 'error',
        message: 'CORS policy violation',
        code: 'CORS_ERROR'
      });
    }

    // Default error
    const statusCode = err.statusCode || err.status || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message;

    res.status(statusCode).json({
      status: 'error',
      message,
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  });
};

module.exports = {
  applyMiddleware,
  applyErrorHandling,
  corsOptions,
  helmetOptions,
  generalRateLimit
};
