const rateLimit = require('express-rate-limit');

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

module.exports = {
  uploadRateLimit,
  profileUploadRateLimit,
  bookCoverUploadRateLimit
};
