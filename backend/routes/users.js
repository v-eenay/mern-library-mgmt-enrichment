const express = require('express');
const { authenticate, requireLibrarian } = require('../middleware/auth');
const { validationMiddleware } = require('../services/validationService');
const { uploadProfile, uploadProfileMemory, handleMulterError } = require('../middleware/upload');
const { profileUploadRateLimit, profileUploadAbuseProtection, authRateLimit } = require('../middleware/uploadRateLimit');
const securityMiddleware = require('../middleware/securityMiddleware');
const usersController = require('../controllers/usersController');

const router = express.Router();

// Profile picture routes (accessible to all authenticated users)
router.use(authenticate);

// @desc    Upload profile picture
// @route   POST /api/users/upload-profile-picture
// @access  Private
router.post('/upload-profile-picture',
  profileUploadRateLimit,
  securityMiddleware.fileUploadSecurity(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'], 5 * 1024 * 1024),
  uploadProfile.single('profilePicture'),
  handleMulterError,
  usersController.uploadProfilePicture
);

// @desc    Update profile picture
// @route   PUT /api/users/update-profile-picture
// @access  Private
router.put('/update-profile-picture',
  profileUploadRateLimit,
  uploadProfile.single('profilePicture'),
  handleMulterError,
  usersController.updateProfilePicture
);

// @desc    Upload profile picture with enhanced processing
// @route   POST /api/users/profile/upload
// @access  Private
router.post('/profile/upload',
  profileUploadRateLimit,
  profileUploadAbuseProtection,
  uploadProfileMemory.single('profilePicture'),
  handleMulterError,
  usersController.uploadProfilePictureEnhanced
);

// @desc    Delete profile picture
// @route   DELETE /api/users/profile/image
// @access  Private
router.delete('/profile/image', usersController.deleteProfilePicture);

// All remaining routes require librarian role
router.use(requireLibrarian);

// @desc    Get all users with pagination and filtering
// @route   GET /api/users
// @access  Private (Librarian only)
router.get('/', validationMiddleware.pagination, usersController.getAllUsers);

// @desc    Get user statistics
// @route   GET /api/users/stats/overview
// @access  Private (Librarian only)
router.get('/stats/overview', usersController.getUserStats);

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Librarian only)
router.get('/:id', usersController.getUserById);

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Librarian only)
router.post('/', validationMiddleware.register, usersController.createUser);

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Librarian only)
router.put('/:id', validationMiddleware.updateProfile, usersController.updateUser);

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Librarian only)
router.delete('/:id', usersController.deleteUser);

module.exports = router;
