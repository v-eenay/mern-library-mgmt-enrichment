const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const validator = require('validator');
const securityValidation = require('../services/securityValidationService');
const { sendError } = require('../utils/helpers');

/**
 * Comprehensive Security Middleware Collection
 * Provides various security protections for the application
 */
class SecurityMiddleware {
  constructor() {
    this.securityEvents = new Map(); // In-memory store for security events
    this.suspiciousIPs = new Set(); // Track suspicious IP addresses
  }

  /**
   * MongoDB injection protection middleware
   */
  mongoSanitization() {
    return mongoSanitize({
      replaceWith: '_',
      onSanitize: ({ req, key }) => {
        console.warn(`MongoDB injection attempt detected from ${req.ip} in field: ${key}`);
        this.logSecurityEvent(req.ip, 'mongodb_injection_attempt', { field: key });
      },
      // Only sanitize body and params, not query to avoid readonly issues
      checkBody: true,
      checkQuery: false,
      checkParams: true
    });
  }

  /**
   * HTTP Parameter Pollution protection
   */
  parameterPollutionProtection() {
    return hpp({
      whitelist: ['tags', 'categories', 'authors'], // Allow arrays for these parameters
      checkBody: true,
      checkQuery: true
    });
  }

  /**
   * Enhanced XSS protection middleware
   */
  xssProtection() {
    return securityValidation.createSanitizationMiddleware();
  }

  /**
   * Suspicious pattern detection middleware
   */
  suspiciousPatternDetection() {
    return securityValidation.createSuspiciousPatternMiddleware();
  }

  /**
   * Advanced rate limiting with tiered protection
   */
  createAdvancedRateLimit(options = {}) {
    const defaults = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: { error: 'Too many requests from this IP, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    };

    const config = { ...defaults, ...options };

    return rateLimit({
      ...config,
      keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP
        return req.user ? `user_${req.user._id}` : req.ip;
      },
      handler: (req, res) => {
        this.logSecurityEvent(req.ip, 'rate_limit_exceeded', {
          endpoint: req.path,
          method: req.method,
          userAgent: req.get('User-Agent')
        });
        
        // Add to suspicious IPs after multiple violations
        const violations = this.getSecurityEventCount(req.ip, 'rate_limit_exceeded');
        if (violations >= 5) {
          this.suspiciousIPs.add(req.ip);
          console.warn(`IP ${req.ip} marked as suspicious due to repeated rate limit violations`);
        }

        res.status(429).json(config.message);
      }
    });
  }

  /**
   * Progressive delay for suspicious behavior
   */
  createProgressiveDelay(options = {}) {
    const defaults = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 10, // Allow 10 requests per windowMs without delay
      delayMs: () => 1000, // Fixed delay function for new version
      maxDelayMs: 20000, // Maximum delay of 20 seconds
      skipSuccessfulRequests: false,
      validate: { delayMs: false } // Disable warning
    };

    const config = { ...defaults, ...options };

    return slowDown({
      ...config,
      keyGenerator: (req) => {
        return req.user ? `user_${req.user._id}` : req.ip;
      }
    });
  }

  /**
   * Authentication-specific rate limiting
   */
  authRateLimit() {
    return this.createAdvancedRateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: { 
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
      },
      skipSuccessfulRequests: true,
      handler: (req, res) => {
        this.logSecurityEvent(req.ip, 'auth_rate_limit_exceeded', {
          email: req.body?.email,
          userAgent: req.get('User-Agent')
        });
        
        res.status(429).json({
          error: 'Too many authentication attempts, please try again later.',
          retryAfter: '15 minutes'
        });
      }
    });
  }

  /**
   * File upload security middleware
   */
  fileUploadSecurity(allowedTypes = [], maxSize = 5 * 1024 * 1024) {
    return (req, res, next) => {
      if (!req.file && !req.files) {
        return next();
      }

      const files = req.files || [req.file];
      
      for (const file of files) {
        if (!file) continue;

        const validation = securityValidation.validateFileUpload(file, allowedTypes, maxSize);
        
        if (!validation.isValid) {
          this.logSecurityEvent(req.ip, 'malicious_file_upload_attempt', {
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            errors: validation.errors
          });
          
          return sendError(res, validation.errors.join(', '), 400);
        }
      }

      next();
    };
  }

  /**
   * Suspicious IP blocking middleware
   */
  suspiciousIPBlocking() {
    return (req, res, next) => {
      if (this.suspiciousIPs.has(req.ip)) {
        this.logSecurityEvent(req.ip, 'suspicious_ip_blocked', {
          endpoint: req.path,
          method: req.method,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(403).json({
          error: 'Access denied. Your IP has been flagged for suspicious activity.',
          code: 'SUSPICIOUS_IP_BLOCKED'
        });
      }
      
      next();
    };
  }

  /**
   * Request size limiting middleware
   */
  requestSizeLimit(maxSize = '10mb') {
    return (req, res, next) => {
      const contentLength = parseInt(req.get('Content-Length') || '0');
      const maxBytes = this.parseSize(maxSize);
      
      if (contentLength > maxBytes) {
        this.logSecurityEvent(req.ip, 'oversized_request_blocked', {
          contentLength,
          maxAllowed: maxBytes,
          endpoint: req.path
        });
        
        return sendError(res, 'Request entity too large', 413);
      }
      
      next();
    };
  }

  /**
   * Security headers middleware
   */
  securityHeaders() {
    return (req, res, next) => {
      // Prevent MIME type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');
      
      // XSS protection
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Referrer policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Prevent caching of sensitive data
      if (req.path.includes('/api/auth/') || req.path.includes('/api/users/')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      
      // HSTS in production
      if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      }
      
      next();
    };
  }

  /**
   * Log security events
   */
  logSecurityEvent(ip, eventType, details = {}) {
    const event = {
      timestamp: new Date().toISOString(),
      ip,
      eventType,
      details
    };

    // Store in memory (in production, use a proper logging service)
    const ipEvents = this.securityEvents.get(ip) || [];
    ipEvents.push(event);
    this.securityEvents.set(ip, ipEvents);

    // Log to console
    console.warn(`Security Event [${eventType}] from ${ip}:`, details);

    // Clean up old events (keep last 100 per IP)
    if (ipEvents.length > 100) {
      ipEvents.splice(0, ipEvents.length - 100);
    }
  }

  /**
   * Get security event count for an IP
   */
  getSecurityEventCount(ip, eventType = null) {
    const events = this.securityEvents.get(ip) || [];
    
    if (!eventType) {
      return events.length;
    }
    
    return events.filter(event => event.eventType === eventType).length;
  }

  /**
   * Parse size string to bytes
   */
  parseSize(size) {
    if (typeof size === 'number') return size;
    
    const units = {
      'b': 1,
      'kb': 1024,
      'mb': 1024 * 1024,
      'gb': 1024 * 1024 * 1024
    };
    
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';
    
    return Math.floor(value * units[unit]);
  }

  /**
   * Get security statistics
   */
  getSecurityStats() {
    const stats = {
      totalEvents: 0,
      suspiciousIPs: this.suspiciousIPs.size,
      eventsByType: {},
      recentEvents: []
    };

    for (const [ip, events] of this.securityEvents.entries()) {
      stats.totalEvents += events.length;
      
      events.forEach(event => {
        stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;
        
        // Add recent events (last 24 hours)
        const eventTime = new Date(event.timestamp);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        if (eventTime > dayAgo) {
          stats.recentEvents.push({ ...event, ip });
        }
      });
    }

    // Sort recent events by timestamp
    stats.recentEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    stats.recentEvents = stats.recentEvents.slice(0, 50); // Keep last 50

    return stats;
  }
}

// Export singleton instance
module.exports = new SecurityMiddleware();
