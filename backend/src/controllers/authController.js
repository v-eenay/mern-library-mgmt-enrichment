/**
 * Authentication Controller
 * 
 * This module handles authentication-related HTTP requests including
 * login, logout, registration, and password management.
 * 
 * @author HRMS Development Team
 * @version 2.0.0
 */

import Employee from '../models/Employee.js';
import { generateToken } from '../middlewares/auth.js';

/**
 * User Login
 * Authenticates user credentials and returns JWT token
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
    }

    // Find user by email (include password for comparison)
    const user = await Employee.findOne({ email: email.toLowerCase() })
      .populate('department', 'name code')
      .select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Account is not active',
        code: 'INACTIVE_ACCOUNT',
        timestamp: new Date().toISOString()
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userResponse
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Login error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * User Registration
 * Creates a new employee account
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const register = async (req, res) => {
  try {
    console.log('Registration attempt for:', req.body.email);

    // Create new employee
    const newEmployee = new Employee(req.body);
    await newEmployee.save();

    // Generate JWT token
    const token = generateToken(newEmployee);

    // Get populated employee data without password
    const populatedEmployee = await Employee.findById(newEmployee._id)
      .populate('department', 'name code description')
      .select('-password');

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: populatedEmployee
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Registration error:', error.message);
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
        timestamp: new Date().toISOString()
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `Employee with this ${field} already exists`,
        code: 'DUPLICATE_FIELD',
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get Current User Profile
 * Returns the authenticated user's profile information
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getProfile = async (req, res) => {
  try {
    // User is already attached to req by auth middleware
    const user = await Employee.findById(req.user._id)
      .populate('department', 'name code description')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get profile error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update User Profile
 * Updates the authenticated user's profile information
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateProfile = async (req, res) => {
  try {
    // Remove sensitive fields that shouldn't be updated via this endpoint
    const { password, role, status, employeeId, ...updateData } = req.body;

    const updatedUser = await Employee.findByIdAndUpdate(
      req.user._id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    )
    .populate('department', 'name code description')
    .select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update profile error:', error.message);
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Change Password
 * Updates the authenticated user's password
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
        code: 'MISSING_PASSWORDS',
        timestamp: new Date().toISOString()
      });
    }

    // Get user with password
    const user = await Employee.findById(req.user._id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD',
        timestamp: new Date().toISOString()
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Change password error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Logout
 * Invalidates the user's session (client-side token removal)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // Here we could add token to a blacklist if needed
    
    res.status(200).json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Logout error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
