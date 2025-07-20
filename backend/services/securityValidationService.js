const validator = require('validator');
const { body, query, param, validationResult } = require('express-validator');
const { sendError } = require('../utils/helpers');

/**
 * Enhanced Security Validation Service
 * Provides comprehensive input validation, sanitization, and security checks
 */
class SecurityValidationService {
  constructor() {
    this.suspiciousPatterns = [
      // SQL Injection patterns
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /((\%27)|(\')|((\%3D)|(=))[^\n]*((\%27)|(\')|((\%3D)|(=))))/i,
      /((\%27)|(\'))union/i,
      
      // XSS patterns
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]+src[^>]*=.*?>/gi,
      
      // NoSQL Injection patterns
      /\$where/gi,
      /\$ne/gi,
      /\$gt/gi,
      /\$lt/gi,
      /\$regex/gi,
      
      // Path traversal patterns
      /\.\.\//gi,
      /\.\.\\/gi,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi,
      
      // Command injection patterns
      /[;&|`]/gi,
      /\$\(/gi,
      /`.*`/gi
    ];
  }

  /**
   * Sanitize input to prevent XSS attacks
   * @param {string} input - Input string to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove HTML tags
    let sanitized = validator.stripLow(input);
    sanitized = validator.escape(sanitized);
    
    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/[<>\"']/g, '');
    
    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    return sanitized;
  }

  /**
   * Deep sanitize object recursively
   * @param {Object} obj - Object to sanitize
   * @returns {Object} Sanitized object
   */
  deepSanitize(obj) {
    if (typeof obj === 'string') {
      return this.sanitizeInput(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitize(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize key names too
        const sanitizedKey = this.sanitizeInput(key);
        sanitized[sanitizedKey] = this.deepSanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Check for suspicious patterns in input
   * @param {string} input - Input to check
   * @returns {boolean} True if suspicious patterns found
   */
  containsSuspiciousPatterns(input) {
    if (typeof input !== 'string') return false;
    
    return this.suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Validate ISBN format
   * @param {string} isbn - ISBN to validate
   * @returns {boolean} True if valid ISBN
   */
  isValidISBN(isbn) {
    if (!isbn) return false;
    return validator.isISBN(isbn.replace(/[-\s]/g, ''));
  }

  /**
   * Validate email with enhanced security checks
   * @param {string} email - Email to validate
   * @returns {Object} Validation result
   */
  validateEmail(email) {
    const result = {
      isValid: false,
      errors: []
    };

    if (!email) {
      result.errors.push('Email is required');
      return result;
    }

    // Basic email validation
    if (!validator.isEmail(email)) {
      result.errors.push('Invalid email format');
      return result;
    }

    // Check for suspicious patterns
    if (this.containsSuspiciousPatterns(email)) {
      result.errors.push('Email contains suspicious content');
      return result;
    }

    // Check for disposable email domains
    const disposableDomains = [
      '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
      'mailinator.com', 'throwaway.email', 'temp-mail.org',
      'yopmail.com', 'maildrop.cc', 'sharklasers.com'
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    if (disposableDomains.includes(domain)) {
      result.errors.push('Disposable email addresses are not allowed');
      return result;
    }

    result.isValid = true;
    return result;
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  validatePassword(password) {
    const result = {
      isValid: false,
      strength: 'weak',
      errors: []
    };

    if (!password) {
      result.errors.push('Password is required');
      return result;
    }

    if (password.length < 8) {
      result.errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
      result.errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      result.errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      result.errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.errors.push('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', 'pass123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      result.errors.push('Password is too common');
    }

    // Check for suspicious patterns
    if (this.containsSuspiciousPatterns(password)) {
      result.errors.push('Password contains invalid characters');
    }

    if (result.errors.length === 0) {
      result.isValid = true;
      
      // Determine password strength
      let score = 0;
      if (password.length >= 12) score++;
      if (/[a-z]/.test(password)) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/\d/.test(password)) score++;
      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
      if (password.length >= 16) score++;

      if (score >= 5) result.strength = 'strong';
      else if (score >= 3) result.strength = 'medium';
    }

    return result;
  }

  /**
   * Validate file upload security
   * @param {Object} file - Multer file object
   * @param {Array} allowedTypes - Allowed MIME types
   * @param {number} maxSize - Maximum file size in bytes
   * @returns {Object} Validation result
   */
  validateFileUpload(file, allowedTypes = [], maxSize = 5 * 1024 * 1024) {
    const result = {
      isValid: false,
      errors: []
    };

    if (!file) {
      result.errors.push('No file provided');
      return result;
    }

    // Check file size
    if (file.size > maxSize) {
      result.errors.push(`File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`);
    }

    // Check MIME type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      result.errors.push(`File type ${file.mimetype} is not allowed`);
    }

    // Check filename for suspicious patterns
    if (this.containsSuspiciousPatterns(file.originalname)) {
      result.errors.push('Filename contains suspicious content');
    }

    // Check for double extensions
    const extensionCount = (file.originalname.match(/\./g) || []).length;
    if (extensionCount > 1) {
      result.errors.push('Multiple file extensions are not allowed');
    }

    // Check for executable file extensions
    const dangerousExtensions = [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
      '.jar', '.php', '.asp', '.aspx', '.jsp', '.sh', '.py', '.rb'
    ];

    const fileExtension = file.originalname.toLowerCase().split('.').pop();
    if (dangerousExtensions.includes(`.${fileExtension}`)) {
      result.errors.push('Executable file types are not allowed');
    }

    if (result.errors.length === 0) {
      result.isValid = true;
    }

    return result;
  }

  /**
   * Create validation middleware for request sanitization
   * @returns {Function} Express middleware
   */
  createSanitizationMiddleware() {
    return (req, res, next) => {
      try {
        // Sanitize request body (create new object to avoid readonly issues)
        if (req.body && typeof req.body === 'object') {
          const sanitizedBody = this.deepSanitize(req.body);
          // Only replace if different
          if (JSON.stringify(sanitizedBody) !== JSON.stringify(req.body)) {
            req.body = sanitizedBody;
          }
        }

        // Skip query and params sanitization to avoid readonly property issues
        // These will be handled by express-validator in the validation rules

        next();
      } catch (error) {
        console.error('Sanitization error:', error);
        return sendError(res, 'Request processing failed', 400);
      }
    };
  }

  /**
   * Create validation middleware for suspicious pattern detection
   * @returns {Function} Express middleware
   */
  createSuspiciousPatternMiddleware() {
    return (req, res, next) => {
      try {
        const checkObject = (obj, path = '') => {
          for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            if (typeof value === 'string' && this.containsSuspiciousPatterns(value)) {
              console.warn(`Suspicious pattern detected in ${currentPath}:`, value);
              return sendError(res, 'Request contains suspicious content', 400);
            }
            
            if (typeof value === 'object' && value !== null) {
              const result = checkObject(value, currentPath);
              if (result) return result;
            }
          }
          return null;
        };

        // Check body, query, and params
        if (req.body && typeof req.body === 'object') {
          const result = checkObject(req.body, 'body');
          if (result) return result;
        }

        if (req.query && typeof req.query === 'object') {
          const result = checkObject(req.query, 'query');
          if (result) return result;
        }

        if (req.params && typeof req.params === 'object') {
          const result = checkObject(req.params, 'params');
          if (result) return result;
        }

        next();
      } catch (error) {
        console.error('Suspicious pattern check error:', error);
        return sendError(res, 'Request validation failed', 400);
      }
    };
  }
}

// Export singleton instance
module.exports = new SecurityValidationService();
