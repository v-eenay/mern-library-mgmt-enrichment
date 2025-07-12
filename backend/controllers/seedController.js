const SeedService = require('../services/seedService');
const { sendSuccess, sendError, asyncHandler } = require('../utils/helpers');
const consoleUtils = require('../utils/consoleUtils');

/**
 * Seed Controller
 * Handles database seeding operations for development
 */

// @desc    Seed admin user
// @route   POST /api/seed/admin
// @access  Development only
const seedAdmin = asyncHandler(async (req, res) => {
  try {
    // Validate environment
    SeedService.validateSeedingEnvironment();

    // Perform seeding
    const result = await SeedService.seedAdminUser();

    if (result.success) {
      consoleUtils.logSuccess('Admin user seeded successfully');
      sendSuccess(res, result.message, result.data, 201);
    } else {
      consoleUtils.logWarning('Admin user already exists');
      sendSuccess(res, result.message, result.data, 200);
    }

  } catch (error) {
    consoleUtils.logError('Failed to seed admin user:', error);
    sendError(res, error.message, 400);
  }
});

// @desc    Seed librarian user
// @route   POST /api/seed/librarian
// @access  Development only
const seedLibrarian = asyncHandler(async (req, res) => {
  try {
    // Validate environment
    SeedService.validateSeedingEnvironment();

    // Perform seeding
    const result = await SeedService.seedLibrarianUser();

    if (result.success) {
      consoleUtils.logSuccess('Librarian user seeded successfully');
      sendSuccess(res, result.message, result.data, 201);
    } else {
      consoleUtils.logWarning('Librarian user already exists');
      sendSuccess(res, result.message, result.data, 200);
    }

  } catch (error) {
    consoleUtils.logError('Failed to seed librarian user:', error);
    sendError(res, error.message, 400);
  }
});

// @desc    Seed categories
// @route   POST /api/seed/categories
// @access  Development only
const seedCategories = asyncHandler(async (req, res) => {
  try {
    // Validate environment
    SeedService.validateSeedingEnvironment();

    // Perform seeding
    const result = await SeedService.seedCategories();

    if (result.success) {
      consoleUtils.logSuccess('Categories seeded successfully');
      sendSuccess(res, result.message, result.data, 201);
    } else {
      consoleUtils.logWarning('Categories already exist');
      sendSuccess(res, result.message, result.data, 200);
    }

  } catch (error) {
    consoleUtils.logError('Failed to seed categories:', error);
    sendError(res, error.message, 400);
  }
});

// @desc    Seed all initial data
// @route   POST /api/seed/all
// @access  Development only
const seedAll = asyncHandler(async (req, res) => {
  try {
    // Validate environment
    SeedService.validateSeedingEnvironment();

    consoleUtils.logInfo('🌱 Starting complete database seeding...');

    // Perform complete seeding
    const result = await SeedService.seedAll();

    if (result.success) {
      consoleUtils.logSuccess('Complete database seeding successful');
      sendSuccess(res, result.message, result.data, 201);
    } else {
      consoleUtils.logWarning('Database seeding completed with some warnings');
      sendSuccess(res, result.message, result.data, 200);
    }

  } catch (error) {
    consoleUtils.logError('Failed to seed database:', error);
    sendError(res, error.message, 400);
  }
});

// @desc    Check seeding status
// @route   GET /api/seed/status
// @access  Development only
const getSeedingStatus = asyncHandler(async (req, res) => {
  try {
    // Validate environment
    SeedService.validateSeedingEnvironment();

    const { User, Category } = require('../models');

    // Check existing data
    const [adminCount, librarianCount, categoryCount, totalUsers] = await Promise.all([
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'librarian' }),
      Category.countDocuments({}),
      User.countDocuments({})
    ]);

    const status = {
      environment: process.env.NODE_ENV || 'development',
      seedingAllowed: SeedService.isSeeddingAllowed(),
      database: {
        users: {
          total: totalUsers,
          admins: adminCount,
          librarians: librarianCount,
          borrowers: totalUsers - adminCount - librarianCount
        },
        categories: categoryCount
      },
      recommendations: []
    };

    // Add recommendations
    if (adminCount === 0) {
      status.recommendations.push('No admin users found. Consider seeding admin user.');
    }
    if (librarianCount === 0) {
      status.recommendations.push('No librarian users found. Consider seeding librarian user.');
    }
    if (categoryCount === 0) {
      status.recommendations.push('No categories found. Consider seeding default categories.');
    }

    sendSuccess(res, 'Seeding status retrieved successfully', status);

  } catch (error) {
    consoleUtils.logError('Failed to get seeding status:', error);
    sendError(res, error.message, 400);
  }
});

// @desc    Reset database (DANGER - Development only)
// @route   DELETE /api/seed/reset
// @access  Development only
const resetDatabase = asyncHandler(async (req, res) => {
  try {
    // Extra validation for reset operation
    SeedService.validateSeedingEnvironment();
    
    const confirmationToken = req.body.confirmationToken;
    const expectedToken = 'RESET_DATABASE_CONFIRM';
    
    if (confirmationToken !== expectedToken) {
      return sendError(res, 'Invalid confirmation token. This operation requires explicit confirmation.', 400);
    }

    const { User, Category, Book, Borrow, Review, ContactMessage } = require('../models');

    // Count documents before deletion
    const counts = {
      users: await User.countDocuments({}),
      categories: await Category.countDocuments({}),
      books: await Book.countDocuments({}),
      borrows: await Borrow.countDocuments({}),
      reviews: await Review.countDocuments({}),
      contacts: await ContactMessage.countDocuments({})
    };

    // Delete all data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Book.deleteMany({}),
      Borrow.deleteMany({}),
      Review.deleteMany({}),
      ContactMessage.deleteMany({})
    ]);

    consoleUtils.logWarning('⚠️ Database reset completed - All data deleted');

    sendSuccess(res, 'Database reset completed successfully', {
      deletedCounts: counts,
      warning: 'All data has been permanently deleted'
    });

  } catch (error) {
    consoleUtils.logError('Failed to reset database:', error);
    sendError(res, error.message, 500);
  }
});

module.exports = {
  seedAdmin,
  seedLibrarian,
  seedCategories,
  seedAll,
  getSeedingStatus,
  resetDatabase
};
