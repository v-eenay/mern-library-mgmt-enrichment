const { User } = require('../models');
const { generateToken, sendSuccess, sendError, asyncHandler } = require('../utils/helpers');
const { getFileUrl } = require('../middleware/upload');
const jwtService = require('../services/jwtService');

// Enhanced helper function to set authentication cookies
const setAuthCookies = (res, accessToken, refreshToken) => {
  // Set access token cookie
  res.cookie('authToken', accessToken, jwtService.getCookieOptions('access'));

  // Set refresh token cookie
  res.cookie('refreshToken', refreshToken, jwtService.getCookieOptions('refresh'));
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'borrower' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, 'User already exists with this email', 400);
  }

  // Create new user
  const user = new User({
    name,
    email,
    password,
    role
  });

  await user.save();

  // Generate token
  const token = generateToken(user._id);

  // Set HTTP-only cookie
  setAuthCookie(res, token);

  sendSuccess(res, 'User registered successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token // Still include token in response for backward compatibility
  }, 201);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password
  const user = await User.findByEmailWithPassword(email);
  if (!user) {
    return sendError(res, 'Invalid credentials', 401);
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return sendError(res, 'Invalid credentials', 401);
  }

  // Generate token pair using enhanced JWT service
  const { accessToken, refreshToken } = jwtService.generateTokenPair(user._id, {
    role: user.role,
    email: user.email
  });

  // Set HTTP-only cookies for both tokens
  setAuthCookies(res, accessToken, refreshToken);

  sendSuccess(res, 'Login successful', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture ? getFileUrl(req, user.profilePicture) : null
    },
    accessToken, // Still include token in response for backward compatibility
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const profilePictureUrl = req.user.profilePicture ? getFileUrl(req, req.user.profilePicture) : null;

  sendSuccess(res, 'Profile retrieved successfully', {
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      profilePicture: profilePictureUrl,
      createdAt: req.user.createdAt
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = req.user;

  // Check if email is being changed and if it already exists
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'Email already exists', 400);
    }
    user.email = email;
  }

  if (name) user.name = name;

  await user.save();

  const profilePictureUrl = user.profilePicture ? getFileUrl(req, user.profilePicture) : null;

  sendSuccess(res, 'Profile updated successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: profilePictureUrl
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  // Additional validation to ensure passwords match (backup to validation middleware)
  if (newPassword !== confirmNewPassword) {
    return sendError(res, 'New password and confirmation password do not match', 400);
  }

  // Ensure new password is different from current password
  if (currentPassword === newPassword) {
    return sendError(res, 'New password must be different from current password', 400);
  }

  // Get user with password
  const user = await User.findByEmailWithPassword(req.user.email);
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return sendError(res, 'Current password is incorrect', 401);
  }

  // Update password (will be automatically hashed by pre-save middleware)
  user.password = newPassword;
  await user.save();

  // Clear authentication cookies to force re-login for security
  jwtService.clearAuthCookies(res);

  sendSuccess(res, 'Password changed successfully. Please log in again with your new password.', {
    message: 'For security reasons, you have been logged out. Please log in again with your new password.'
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // Blacklist current tokens
  const accessToken = jwtService.extractToken(req);
  const refreshToken = jwtService.extractRefreshToken(req);

  if (accessToken) {
    jwtService.blacklistToken(accessToken);
  }

  if (refreshToken) {
    jwtService.blacklistToken(refreshToken);
  }

  // Clear authentication cookies
  jwtService.clearAuthCookies(res);

  sendSuccess(res, 'Logout successful');
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (requires refresh token)
const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = jwtService.extractRefreshToken(req);

  if (!refreshToken) {
    return sendError(res, 'Refresh token not provided', 401);
  }

  try {
    // Generate new token pair
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = jwtService.refreshTokens(refreshToken);

    // Get user info for response
    const decoded = jwtService.verifyAccessToken(newAccessToken);
    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Set new cookies
    setAuthCookies(res, newAccessToken, newRefreshToken);

    sendSuccess(res, 'Token refreshed successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture ? getFileUrl(req, user.profilePicture) : null
      },
      accessToken: newAccessToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    });
  } catch (error) {
    return sendError(res, 'Invalid refresh token', 401);
  }
});

// @desc    Verify token validity
// @route   GET /api/auth/verify
// @access  Private
const verifyToken = asyncHandler(async (req, res) => {
  // If we reach here, the token is valid (middleware already verified it)
  sendSuccess(res, 'Token is valid', {
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      profilePicture: req.user.profilePicture ? getFileUrl(req, req.user.profilePicture) : null
    },
    tokenInfo: req.tokenInfo
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  refreshToken,
  verifyToken
};
