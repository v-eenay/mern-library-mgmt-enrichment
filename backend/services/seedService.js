const { User } = require('../models');
const { sendSuccess, sendError, asyncHandler } = require('../utils/helpers');
const consoleUtils = require('../utils/consoleUtils');

/**
 * Database Seeding Service
 * Provides functionality to seed the database with initial data
 */
class SeedService {
  /**
   * Seed admin user
   * Creates a default admin user for development purposes
   */
  static async seedAdminUser() {
    try {
      // Check if admin already exists
      const existingAdmin = await User.findOne({ role: 'admin' });
      
      if (existingAdmin) {
        return {
          success: false,
          message: 'Admin user already exists',
          data: {
            email: existingAdmin.email,
            existing: true
          }
        };
      }

      // Get admin credentials from environment or use defaults
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@library.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';
      const adminName = process.env.ADMIN_NAME || 'System Administrator';

      // Validate password strength
      if (adminPassword.length < 8) {
        throw new Error('Admin password must be at least 8 characters long');
      }

      // Create admin user (password will be automatically hashed by User model pre-save middleware)
      const adminUser = new User({
        name: adminName,
        email: adminEmail,
        password: adminPassword, // Store plain password - will be hashed by pre-save middleware
        role: 'admin',
        isEmailVerified: true, // Admin is pre-verified
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await adminUser.save();

      consoleUtils.logSuccess(`✅ Admin user created successfully: ${adminEmail}`);

      return {
        success: true,
        message: 'Admin user created successfully',
        data: {
          email: adminEmail,
          name: adminName,
          role: 'admin',
          id: adminUser._id,
          created: true
        }
      };

    } catch (error) {
      consoleUtils.logError('❌ Failed to seed admin user:', error);
      throw error;
    }
  }

  /**
   * Seed sample categories
   * Creates default book categories
   */
  static async seedCategories() {
    try {
      const { Category } = require('../models');
      
      const defaultCategories = [
        {
          name: 'Fiction',
          description: 'Fictional literature including novels, short stories, and novellas'
        },
        {
          name: 'Non-Fiction',
          description: 'Factual books including biographies, history, and educational content'
        },
        {
          name: 'Science Fiction',
          description: 'Books featuring futuristic concepts, technology, and space exploration'
        },
        {
          name: 'Mystery',
          description: 'Detective stories, crime novels, and suspenseful narratives'
        },
        {
          name: 'Romance',
          description: 'Love stories and romantic literature'
        },
        {
          name: 'Biography',
          description: 'Life stories of notable individuals'
        },
        {
          name: 'History',
          description: 'Historical accounts and documentation'
        },
        {
          name: 'Technology',
          description: 'Books about technology, programming, and digital innovation'
        }
      ];

      const existingCategories = await Category.find({});
      
      if (existingCategories.length > 0) {
        return {
          success: false,
          message: 'Categories already exist',
          data: {
            count: existingCategories.length,
            existing: true
          }
        };
      }

      const createdCategories = await Category.insertMany(defaultCategories);

      consoleUtils.logSuccess(`✅ Created ${createdCategories.length} default categories`);

      return {
        success: true,
        message: 'Default categories created successfully',
        data: {
          count: createdCategories.length,
          categories: createdCategories.map(cat => ({ name: cat.name, id: cat._id }))
        }
      };

    } catch (error) {
      consoleUtils.logError('❌ Failed to seed categories:', error);
      throw error;
    }
  }

  /**
   * Seed sample librarian user
   * Creates a default librarian user for testing
   */
  static async seedLibrarianUser() {
    try {
      // Check if librarian already exists
      const existingLibrarian = await User.findOne({ 
        role: 'librarian',
        email: process.env.LIBRARIAN_EMAIL || 'librarian@library.com'
      });
      
      if (existingLibrarian) {
        return {
          success: false,
          message: 'Librarian user already exists',
          data: {
            email: existingLibrarian.email,
            existing: true
          }
        };
      }

      // Get librarian credentials from environment or use defaults
      const librarianEmail = process.env.LIBRARIAN_EMAIL || 'librarian@library.com';
      const librarianPassword = process.env.LIBRARIAN_PASSWORD || 'Librarian123!';
      const librarianName = process.env.LIBRARIAN_NAME || 'Head Librarian';

      // Create librarian user (password will be automatically hashed by User model pre-save middleware)
      const librarianUser = new User({
        name: librarianName,
        email: librarianEmail,
        password: librarianPassword, // Store plain password - will be hashed by pre-save middleware
        role: 'librarian',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await librarianUser.save();

      consoleUtils.logSuccess(`✅ Librarian user created successfully: ${librarianEmail}`);

      return {
        success: true,
        message: 'Librarian user created successfully',
        data: {
          email: librarianEmail,
          name: librarianName,
          role: 'librarian',
          id: librarianUser._id,
          created: true
        }
      };

    } catch (error) {
      consoleUtils.logError('❌ Failed to seed librarian user:', error);
      throw error;
    }
  }

  /**
   * Seed all initial data
   * Runs all seeding operations
   */
  static async seedAll() {
    try {
      consoleUtils.logInfo('🌱 Starting database seeding...');

      const results = {
        admin: null,
        librarian: null,
        categories: null,
        errors: []
      };

      // Seed admin user
      try {
        results.admin = await this.seedAdminUser();
      } catch (error) {
        results.errors.push({ type: 'admin', error: error.message });
      }

      // Seed librarian user
      try {
        results.librarian = await this.seedLibrarianUser();
      } catch (error) {
        results.errors.push({ type: 'librarian', error: error.message });
      }

      // Seed categories
      try {
        results.categories = await this.seedCategories();
      } catch (error) {
        results.errors.push({ type: 'categories', error: error.message });
      }

      const successCount = [results.admin, results.librarian, results.categories]
        .filter(result => result && result.success).length;

      consoleUtils.logSuccess(`✅ Database seeding completed. ${successCount}/3 operations successful.`);

      return {
        success: results.errors.length === 0,
        message: `Database seeding completed. ${successCount}/3 operations successful.`,
        data: results
      };

    } catch (error) {
      consoleUtils.logError('❌ Database seeding failed:', error);
      throw error;
    }
  }

  /**
   * Check if seeding is allowed
   * Only allow seeding in development environment
   */
  static isSeeddingAllowed() {
    const environment = process.env.NODE_ENV || 'development';
    const allowSeeding = process.env.ALLOW_SEEDING === 'true';
    
    return environment === 'development' || allowSeeding;
  }

  /**
   * Validate seeding environment
   * Ensures seeding is safe to perform
   */
  static validateSeedingEnvironment() {
    if (!this.isSeeddingAllowed()) {
      throw new Error('Database seeding is only allowed in development environment');
    }

    // Additional safety checks
    const dbUrl = process.env.MONGODB_URI || '';
    if (dbUrl.includes('production') || dbUrl.includes('prod')) {
      throw new Error('Cannot seed database: Production database detected');
    }
  }
}

module.exports = SeedService;
