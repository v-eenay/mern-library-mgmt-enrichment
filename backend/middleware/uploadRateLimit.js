const rateLimit = require('express-rate-limit');
const securityMiddleware = require('./securityMiddleware');

// Rate limiting for file uploads
const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 upload requests per windowMs
  message: {
    status: 'error',
    message: 'Too many upload requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: true,
  // Custom key generator (optional - uses IP by default)
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise fall back to IP
    return req.user ? `user_${req.user._id}` : req.ip;
  },
  // Custom handler for when limit is exceeded
  handler: (req, res) => {
    // Clean up any uploaded file if rate limit is exceeded
    if (req.file) {
      const fs = require('fs');
      const path = require('path');
      
      try {
        const filePath = path.isAbsolute(req.file.path) 
          ? req.file.path 
          : path.join(__dirname, '../', req.file.path);
        
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error('Error cleaning up file after rate limit:', error);
      }
    }
    
    res.status(429).json({
      status: 'error',
      message: 'Too many upload requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// More restrictive rate limiting for profile picture uploads
const profileUploadRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each user to 5 profile picture uploads per windowMs
  message: {
    status: 'error',
    message: 'Too many profile picture upload requests, please try again later.',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
  keyGenerator: (req) => {
    return req.user ? `profile_${req.user._id}` : req.ip;
  },
  handler: (req, res) => {
    // Clean up any uploaded file if rate limit is exceeded
    if (req.file) {
      const fs = require('fs');
      const path = require('path');
      
      try {
        const filePath = path.isAbsolute(req.file.path) 
          ? req.file.path 
          : path.join(__dirname, '../', req.file.path);
        
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error('Error cleaning up file after rate limit:', error);
      }
    }
    
    res.status(429).json({
      status: 'error',
      message: 'Too many profile picture upload requests, please try again later.',
      retryAfter: '10 minutes'
    });
  }
});

// Enhanced abuse protection for profile uploads
const profileUploadAbuseProtection = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Maximum 10 uploads per hour
  message: {
    status: 'error',
    message: 'Hourly upload limit exceeded. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `profile_abuse_${req.user._id}` : `profile_abuse_${req.ip}`;
  },
  handler: (req, res) => {
    // Log potential abuse
    console.warn(`Profile upload abuse protection triggered for ${req.user ? `user ${req.user._id}` : `IP ${req.ip}`}`);

    res.status(429).json({
      status: 'error',
      message: 'Hourly upload limit exceeded. This activity has been logged.',
      retryAfter: '1 hour'
    });
  }
});

// Rate limiting for book cover uploads (librarian only, so can be more lenient)
const bookCoverUploadRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each librarian to 20 book cover uploads per windowMs
  message: {
    status: 'error',
    message: 'Too many book cover upload requests, please try again later.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
  keyGenerator: (req) => {
    return req.user ? `book_cover_${req.user._id}` : req.ip;
  },
  handler: (req, res) => {
    // Clean up any uploaded file if rate limit is exceeded
    if (req.file) {
      const fs = require('fs');
      const path = require('path');
      
      try {
        const filePath = path.isAbsolute(req.file.path) 
          ? req.file.path 
          : path.join(__dirname, '../', req.file.path);
        
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error('Error cleaning up file after rate limit:', error);
      }
    }
    
    res.status(429).json({
      status: 'error',
      message: 'Too many book cover upload requests, please try again later.',
      retryAfter: '5 minutes'
    });
  }
});

// Rate limiting for password changes (security-critical operation)
const passwordChangeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each user to 3 password change attempts per windowMs
  message: {
    status: 'error',
    message: 'Too many password change attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
  keyGenerator: (req) => {
    // Use user ID for authenticated requests, IP as fallback
    return req.user ? `password_change_${req.user._id}` : `password_change_ip_${req.ip}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many password change attempts from this account, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Rate limiting for contact form submissions (anti-spam)
const contactFormRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 contact form submissions per windowMs
  message: {
    status: 'error',
    message: 'Too many contact form submissions, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
  keyGenerator: (req) => {
    // Use IP address for rate limiting
    return `contact_form_${req.ip}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many contact form submissions from this IP address, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Stricter rate limiting for potential spam patterns
const contactSpamProtection = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 submissions per hour
  message: {
    status: 'error',
    message: 'Hourly contact form limit exceeded. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `contact_spam_${req.ip}`;
  }
});

// Enhanced abuse protection for book cover uploads
const bookCoverUploadAbuseProtection = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Maximum 50 book cover uploads per hour (higher for librarians)
  message: {
    status: 'error',
    message: 'Hourly book cover upload limit exceeded. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `book_abuse_${req.user._id}` : `book_abuse_${req.ip}`;
  },
  handler: (req, res) => {
    // Log potential abuse
    console.warn(`Book cover upload abuse protection triggered for ${req.user ? `user ${req.user._id}` : `IP ${req.ip}`}`);

    res.status(429).json({
      status: 'error',
      message: 'Hourly book cover upload limit exceeded. This activity has been logged.',
      retryAfter: '1 hour'
    });
  }
});

// Enhanced API endpoint rate limiting
const apiEndpointRateLimit = securityMiddleware.createAdvancedRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: {
    status: 'error',
    message: 'Too many API requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});

// Search endpoint rate limiting (more permissive)
const searchRateLimit = securityMiddleware.createAdvancedRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    status: 'error',
    message: 'Too many search requests, please slow down.',
    retryAfter: '1 minute'
  }
});

// Authentication rate limiting (strict)
const authRateLimit = securityMiddleware.authRateLimit();

// Progressive delay for suspicious behavior
const progressiveDelay = securityMiddleware.createProgressiveDelay({
  windowMs: 15 * 60 * 1000,
  delayAfter: 20,
  delayMs: 1000,
  maxDelayMs: 30000
});

module.exports = {
  uploadRateLimit,
  profileUploadRateLimit,
  profileUploadAbuseProtection,
  bookCoverUploadRateLimit,
  bookCoverUploadAbuseProtection,
  passwordChangeRateLimit,
  contactFormRateLimit,
  contactSpamProtection,
  apiEndpointRateLimit,
  searchRateLimit,
  authRateLimit,
  progressiveDelay
};
