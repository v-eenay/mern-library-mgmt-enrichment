/**
 * Authentication Routes
 * Handles user authentication, registration, and profile management
 */

import express from 'express';
import {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
  logout
} from '../controllers/authController.js';
import { authenticateToken, refreshToken } from '../middlewares/auth.js';

const router = express.Router();

// Public routes (no authentication required)

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return JWT token
 * @access Public
 */
router.post('/login', login);

/**
 * @route POST /api/auth/register
 * @desc Register new employee account
 * @access Public (should be restricted to HR/Admin in production)
 */
router.post('/register', register);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh JWT access token
 * @access Public
 */
router.post('/refresh', refreshToken);

// Protected routes (require authentication)

/**
 * @route GET /api/auth/profile
 * @desc Get current user's profile
 * @access Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile (non-sensitive fields only)
 * @access Private
 */
router.put('/profile', authenticateToken, updateProfile);

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password', authenticateToken, changePassword);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authenticateToken, logout);

export default router;
