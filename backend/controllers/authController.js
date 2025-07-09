const { User } = require('../models');
const { generateToken, sendSuccess, sendError, asyncHandler } = require('../utils/helpers');

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

  sendSuccess(res, 'User registered successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
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

  // Generate token
  const token = generateToken(user._id);

  sendSuccess(res, 'Login successful', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, 'Profile retrieved successfully', {
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
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

  sendSuccess(res, 'Profile updated successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findByEmailWithPassword(req.user.email);

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return sendError(res, 'Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  sendSuccess(res, 'Password changed successfully');
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};
