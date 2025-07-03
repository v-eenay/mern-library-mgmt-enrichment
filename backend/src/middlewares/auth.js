/**
 * Authentication Middleware
 * 
 * This module provides JWT-based authentication middleware for protecting
 * API routes and managing user sessions.
 * 
 * @author HRMS Development Team
 * @version 2.0.0
 */

import jwt from 'jsonwebtoken';
import Employee from '../models/Employee.js';

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user info to request object
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'NO_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await Employee.findById(decoded.id)
      .populate('department', 'name code')
      .select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token - user not found',
        code: 'INVALID_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Account is not active',
        code: 'INACTIVE_ACCOUNT',
        timestamp: new Date().toISOString()
      });
    }

    // Attach user to request object
    req.user = user;
    next();

  } catch (error) {
    console.error('Authentication error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Role-based Authorization Middleware
 * Checks if user has required role(s) to access resource
 * 
 * @param {string|Array} roles - Required role(s)
 * @returns {Function} Express middleware function
 */
export const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NO_AUTH',
          timestamp: new Date().toISOString()
        });
      }

      const userRole = req.user.role;
      const requiredRoles = Array.isArray(roles) ? roles : [roles];

      if (!requiredRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: requiredRoles,
          current: userRole,
          timestamp: new Date().toISOString()
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Authorization failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Optional Authentication Middleware
 * Attaches user info if token is provided, but doesn't require it
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await Employee.findById(decoded.id)
          .populate('department', 'name code')
          .select('-password');

        if (user && user.status === 'active') {
          req.user = user;
        }
      } catch (error) {
        // Token is invalid, but we continue without user
        console.log('Optional auth failed:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error.message);
    next(); // Continue without authentication
  }
};

/**
 * Generate JWT Token
 * Creates a new JWT token for user authentication
 * 
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
export const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'hrms-api',
    audience: 'hrms-client'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Refresh Token Middleware
 * Validates refresh token and generates new access token
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await Employee.findById(decoded.id).select('-password');

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    // Generate new access token
    const newToken = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Token refresh error:', error.message);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
