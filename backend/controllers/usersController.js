const { User, Borrow } = require('../models');
const { sendSuccess, sendError, asyncHandler, isValidObjectId, getPagination } = require('../utils/helpers');
const {
  deleteFile,
  getFileUrl,
  validateImageDimensions,
  optimizeImage,
  scanImageContent,
  saveProcessedImage
} = require('../middleware/upload');
const { rbacService, PERMISSIONS } = require('../services/rbacService');
const auditService = require('../services/auditService');

// @desc    Get all users with pagination and filtering
// @route   GET /api/users
// @access  Private (Librarian only)
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 0, limit = 10, role, search } = req.query;
  const { limit: pageLimit, offset } = getPagination(page, limit);

  // Build query
  let query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(pageLimit)
    .skip(offset);

  const total = await User.countDocuments(query);

  sendSuccess(res, 'Users retrieved successfully', {
    users,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Librarian only)
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid user ID', 400);
  }

  const user = await User.findById(id).select('-password');
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  sendSuccess(res, 'User retrieved successfully', { user });
});

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Librarian only)
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

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

  sendSuccess(res, 'User created successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }
  }, 201);
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Librarian only)
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid user ID', 400);
  }

  const user = await User.findById(id);
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // Store original values for audit logging
  const originalValues = {
    name: user.name,
    email: user.email,
    role: user.role
  };

  // Check role change permissions
  if (role && role !== user.role) {
    if (!rbacService.hasPermission(req.user, PERMISSIONS.USER_UPDATE_ROLE)) {
      return sendError(res, 'Insufficient permissions to change user role', 403);
    }

    // Prevent role escalation beyond current user's level
    if (!rbacService.hasHigherOrEqualRole(req.user, { role })) {
      return sendError(res, 'Cannot assign role higher than your own', 403);
    }
  }

  // Check if email is being changed and if it already exists
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'Email already exists', 400);
    }
    user.email = email;
  }

  if (name) user.name = name;
  if (role) user.role = role;

  await user.save();

  // Log audit event for role changes
  if (role && role !== originalValues.role) {
    await auditService.logEvent({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'USER_ROLE_CHANGE',
      resourceType: 'User',
      resourceId: user._id,
      targetUserId: user._id,
      details: {
        oldRole: originalValues.role,
        newRole: role,
        changedBy: req.user.email
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'HIGH'
    });
  }

  sendSuccess(res, 'User updated successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Librarian only)
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid user ID', 400);
  }

  // Prevent deletion of own account
  if (id === req.user._id.toString()) {
    return sendError(res, 'Cannot delete your own account', 400);
  }

  const user = await User.findById(id);
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // Check if user has active borrows
  const activeBorrows = await Borrow.findActiveByUser(id);
  if (activeBorrows.length > 0) {
    return sendError(res, 'Cannot delete user with active borrows', 400);
  }

  await User.findByIdAndDelete(id);

  sendSuccess(res, 'User deleted successfully');
});

// @desc    Get user statistics
// @route   GET /api/users/stats/overview
// @access  Private (Librarian only)
const getUserStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalBorrowers = await User.countDocuments({ role: 'borrower' });
  const totalLibrarians = await User.countDocuments({ role: 'librarian' });

  // Users registered in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentUsers = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });

  sendSuccess(res, 'User statistics retrieved successfully', {
    stats: {
      totalUsers,
      totalBorrowers,
      totalLibrarians,
      recentUsers
    }
  });
});

// @desc    Upload profile picture
// @route   POST /api/users/upload-profile-picture
// @access  Private
const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, 'No file uploaded', 400);
  }

  const userId = req.user._id;
  const user = await User.findById(userId);

  if (!user) {
    // Clean up uploaded file if user not found
    await deleteFile(req.file.path);
    return sendError(res, 'User not found', 404);
  }

  // Delete old profile picture if it exists
  if (user.profilePicture) {
    await deleteFile(user.profilePicture).catch(err => {
      console.error('Error deleting old profile picture:', err);
    });
  }

  // Update user with new profile picture path
  const profilePicturePath = `uploads/profiles/${req.file.filename}`;
  user.profilePicture = profilePicturePath;
  await user.save();

  // Generate full URL for response
  const profilePictureUrl = getFileUrl(req, profilePicturePath);

  sendSuccess(res, 'Profile picture uploaded successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: profilePictureUrl
    }
  });
});

// @desc    Update profile picture
// @route   PUT /api/users/update-profile-picture
// @access  Private
const updateProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, 'No file uploaded', 400);
  }

  const userId = req.user._id;
  const user = await User.findById(userId);

  if (!user) {
    // Clean up uploaded file if user not found
    await deleteFile(req.file.path);
    return sendError(res, 'User not found', 404);
  }

  // Delete old profile picture if it exists
  if (user.profilePicture) {
    await deleteFile(user.profilePicture).catch(err => {
      console.error('Error deleting old profile picture:', err);
    });
  }

  // Update user with new profile picture path
  const profilePicturePath = `uploads/profiles/${req.file.filename}`;
  user.profilePicture = profilePicturePath;
  await user.save();

  // Generate full URL for response
  const profilePictureUrl = getFileUrl(req, profilePicturePath);

  sendSuccess(res, 'Profile picture updated successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: profilePictureUrl
    }
  });
});

// @desc    Delete profile picture
// @route   DELETE /api/users/profile/image
// @access  Private
const deleteProfilePicture = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  if (!user.profilePicture) {
    return sendError(res, 'No profile picture to delete', 400);
  }

  // Delete the file from disk
  try {
    await deleteFile(user.profilePicture);
  } catch (error) {
    console.error('Error deleting profile picture file:', error);
    // Continue with database update even if file deletion fails
  }

  // Remove profile picture from user record
  user.profilePicture = null;
  await user.save();

  sendSuccess(res, 'Profile picture deleted successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: null
    }
  });
});

// @desc    Upload profile picture with enhanced processing
// @route   POST /api/users/profile/upload-enhanced
// @access  Private
const uploadProfilePictureEnhanced = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, 'No file uploaded', 400);
  }

  const userId = req.user._id;
  const user = await User.findById(userId);

  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  try {
    // Validate image dimensions
    await validateImageDimensions(req.file.buffer, 'profile');

    // Scan for malicious content
    await scanImageContent(req.file.buffer);

    // Optimize image
    const optimizedBuffer = await optimizeImage(req.file.buffer, 'profile');

    // Save processed image
    const imagePath = await saveProcessedImage(optimizedBuffer, 'profile', req.file.originalname);

    // Delete old profile picture if it exists
    if (user.profilePicture) {
      await deleteFile(user.profilePicture).catch(err => {
        console.error('Error deleting old profile picture:', err);
      });
    }

    // Update user with new profile picture path
    user.profilePicture = imagePath;
    await user.save();

    // Generate full URL for response
    const profilePictureUrl = getFileUrl(req, imagePath);

    sendSuccess(res, 'Profile picture uploaded and processed successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: profilePictureUrl
      },
      processing: {
        optimized: true,
        scanned: true,
        validated: true
      }
    });
  } catch (error) {
    return sendError(res, `Image processing failed: ${error.message}`, 400);
  }
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  uploadProfilePicture,
  updateProfilePicture,
  deleteProfilePicture,
  uploadProfilePictureEnhanced
};
