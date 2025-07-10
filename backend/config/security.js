/**
 * Security Configuration
 * Centralized security settings for the application
 */

const securityConfig = {
  // JWT Configuration
  jwt: {
    // Validate JWT secrets on startup
    validateSecrets: () => {
      const requiredSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
      const missingSecrets = [];

      requiredSecrets.forEach(secret => {
        if (!process.env[secret]) {
          missingSecrets.push(secret);
        }
      });

      if (missingSecrets.length > 0) {
        throw new Error(`Missing required JWT secrets: ${missingSecrets.join(', ')}`);
      }

      // Validate secret strength
      const jwtSecret = process.env.JWT_SECRET;
      const refreshSecret = process.env.JWT_REFRESH_SECRET;

      if (jwtSecret.length < 32) {
        console.warn('⚠️  JWT_SECRET should be at least 32 characters long');
      }

      if (refreshSecret.length < 32) {
        console.warn('⚠️  JWT_REFRESH_SECRET should be at least 32 characters long');
      }

      if (jwtSecret === refreshSecret) {
        throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
      }

      console.log('✅ JWT secrets validated successfully');
    },

    // Default token expiration times
    defaults: {
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
      cookieExpiry: 7 // days
    }
  },

  // Cookie Security Settings
  cookies: {
    getSecureOptions: (type = 'access') => {
      const isProduction = process.env.NODE_ENV === 'production';
      
      const baseOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        path: '/'
      };

      if (type === 'refresh') {
        return {
          ...baseOptions,
          maxAge: parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '7') * 24 * 60 * 60 * 1000
        };
      }

      return {
        ...baseOptions,
        maxAge: 15 * 60 * 1000 // 15 minutes
      };
    }
  },

  // Content Security Policy
  csp: {
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
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    },
    reportOnly: process.env.NODE_ENV === 'development'
  },

  // CORS Configuration
  cors: {
    getAllowedOrigins: () => {
      const defaultOrigins = [
        process.env.CLIENT_URL || 'http://localhost:3000',
        'http://localhost:3000',
        'http://localhost:3001'
      ];

      if (process.env.NODE_ENV === 'production') {
        // In production, only allow specific origins
        return [process.env.CLIENT_URL].filter(Boolean);
      }

      return defaultOrigins;
    },

    options: {
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-CSRF-Token',
        'X-XSRF-Token'
      ],
      exposedHeaders: [
        'X-Token-Refresh-Suggested',
        'X-Token-Expires-In'
      ]
    }
  },

  // Rate Limiting Configuration
  rateLimit: {
    // General API rate limiting
    general: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      message: {
        error: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false
    },

    // Authentication specific rate limiting
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 login attempts per window
      message: {
        error: 'Too many login attempts, please try again later.'
      },
      skipSuccessfulRequests: true
    }
  },

  // Security Headers Configuration
  headers: {
    helmet: {
      contentSecurityPolicy: {
        directives: securityConfig?.csp?.directives || {},
        reportOnly: securityConfig?.csp?.reportOnly || false
      },
      crossOriginEmbedderPolicy: false, // Disable for file uploads
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      frameguard: { action: 'deny' },
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    }
  },

  // Environment Validation
  validateEnvironment: () => {
    const requiredEnvVars = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'MONGODB_URI'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Validate JWT secrets
    securityConfig.jwt.validateSecrets();

    console.log('✅ Environment variables validated successfully');
  },

  // Security Middleware Factory
  createSecurityMiddleware: () => {
    return {
      // CSRF Protection
      csrfProtection: (req, res, next) => {
        // Skip CSRF protection for GET, HEAD, OPTIONS requests
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
          return next();
        }

        // Skip CSRF protection for API requests with valid JWT tokens
        if (req.user && req.tokenInfo) {
          return next();
        }

        // For now, rely on SameSite cookies for CSRF protection
        // In a full implementation, you would validate CSRF tokens here
        next();
      },

      // Security Headers
      securityHeaders: (req, res, next) => {
        // Add custom security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        if (process.env.NODE_ENV === 'production') {
          res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        next();
      }
    };
  }
};

// Fix circular reference issue
securityConfig.headers.helmet.contentSecurityPolicy.directives = securityConfig.csp.directives;
securityConfig.headers.helmet.contentSecurityPolicy.reportOnly = securityConfig.csp.reportOnly;

module.exports = securityConfig;
