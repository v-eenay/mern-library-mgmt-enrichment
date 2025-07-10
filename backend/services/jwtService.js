const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTService {
  constructor() {
    this.validateSecrets();
    this.blacklistedTokens = new Set(); // In production, use Redis or database
  }

  /**
   * Validate JWT secrets on startup
   */
  validateSecrets() {
    const jwtSecret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is required');
    }

    if (jwtSecret.length < 32) {
      console.warn('⚠️  JWT_SECRET should be at least 32 characters long for security');
    }

    if (refreshSecret.length < 32) {
      console.warn('⚠️  JWT_REFRESH_SECRET should be at least 32 characters long for security');
    }

    if (jwtSecret === refreshSecret) {
      throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
    }

    // Check for default/weak secrets
    const weakSecrets = [
      'your_super_secret_jwt_key_here',
      'secret',
      'jwt_secret',
      'change_me',
      'default'
    ];

    if (weakSecrets.some(weak => jwtSecret.toLowerCase().includes(weak))) {
      console.warn('⚠️  JWT_SECRET appears to be a default/weak secret. Please change it in production!');
    }

    if (weakSecrets.some(weak => refreshSecret.toLowerCase().includes(weak))) {
      console.warn('⚠️  JWT_REFRESH_SECRET appears to be a default/weak secret. Please change it in production!');
    }
  }

  /**
   * Generate access token
   * @param {string} userId - User ID
   * @param {Object} payload - Additional payload data
   * @returns {string} JWT token
   */
  generateAccessToken(userId, payload = {}) {
    const tokenPayload = {
      id: userId,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID(), // Unique token ID for blacklisting
      ...payload
    };

    return jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        issuer: 'library-management-system',
        audience: 'library-users'
      }
    );
  }

  /**
   * Generate refresh token
   * @param {string} userId - User ID
   * @param {Object} payload - Additional payload data
   * @returns {string} JWT refresh token
   */
  generateRefreshToken(userId, payload = {}) {
    const tokenPayload = {
      id: userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID(),
      ...payload
    };

    return jwt.sign(
      tokenPayload,
      process.env.JWT_REFRESH_SECRET,
      { 
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: 'library-management-system',
        audience: 'library-users'
      }
    );
  }

  /**
   * Generate both access and refresh tokens
   * @param {string} userId - User ID
   * @param {Object} payload - Additional payload data
   * @returns {Object} Object containing both tokens
   */
  generateTokenPair(userId, payload = {}) {
    return {
      accessToken: this.generateAccessToken(userId, payload),
      refreshToken: this.generateRefreshToken(userId, payload)
    };
  }

  /**
   * Verify access token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  verifyAccessToken(token) {
    try {
      if (this.isTokenBlacklisted(token)) {
        throw new Error('Token has been revoked');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'library-management-system',
        audience: 'library-users'
      });

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Verify refresh token
   * @param {string} token - JWT refresh token
   * @returns {Object} Decoded token payload
   */
  verifyRefreshToken(token) {
    try {
      if (this.isTokenBlacklisted(token)) {
        throw new Error('Refresh token has been revoked');
      }

      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
        issuer: 'library-management-system',
        audience: 'library-users'
      });

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      throw new Error(`Refresh token verification failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Valid refresh token
   * @returns {Object} New token pair
   */
  refreshTokens(refreshToken) {
    const decoded = this.verifyRefreshToken(refreshToken);
    
    // Blacklist the old refresh token
    this.blacklistToken(refreshToken);
    
    // Generate new token pair
    return this.generateTokenPair(decoded.id, {
      role: decoded.role,
      email: decoded.email
    });
  }

  /**
   * Blacklist a token
   * @param {string} token - Token to blacklist
   */
  blacklistToken(token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.jti) {
        this.blacklistedTokens.add(decoded.jti);
        
        // In production, store in Redis with TTL equal to token expiration
        // redis.setex(`blacklist:${decoded.jti}`, decoded.exp - Math.floor(Date.now() / 1000), 'true');
      }
    } catch (error) {
      console.error('Error blacklisting token:', error);
    }
  }

  /**
   * Check if token is blacklisted
   * @param {string} token - Token to check
   * @returns {boolean} True if blacklisted
   */
  isTokenBlacklisted(token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.jti) {
        return this.blacklistedTokens.has(decoded.jti);
        
        // In production, check Redis
        // return await redis.exists(`blacklist:${decoded.jti}`);
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract token from request (cookie or header)
   * @param {Object} req - Express request object
   * @returns {string|null} Token or null
   */
  extractToken(req) {
    // First, try to get token from HTTP-only cookie
    if (req.cookies && req.cookies.authToken) {
      return req.cookies.authToken;
    }
    
    // Fallback to Authorization header
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.replace('Bearer ', '');
    }
    
    return null;
  }

  /**
   * Extract refresh token from request
   * @param {Object} req - Express request object
   * @returns {string|null} Refresh token or null
   */
  extractRefreshToken(req) {
    // Try to get refresh token from HTTP-only cookie
    if (req.cookies && req.cookies.refreshToken) {
      return req.cookies.refreshToken;
    }
    
    // Fallback to request body
    if (req.body && req.body.refreshToken) {
      return req.body.refreshToken;
    }
    
    return null;
  }

  /**
   * Get cookie options for tokens
   * @param {string} type - 'access' or 'refresh'
   * @returns {Object} Cookie options
   */
  getCookieOptions(type = 'access') {
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
        maxAge: parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '7') * 24 * 60 * 60 * 1000 // 7 days
      };
    }

    return {
      ...baseOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes for access token
    };
  }

  /**
   * Clear authentication cookies
   * @param {Object} res - Express response object
   */
  clearAuthCookies(res) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/'
    };

    res.clearCookie('authToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
  }
}

// Export singleton instance
module.exports = new JWTService();
