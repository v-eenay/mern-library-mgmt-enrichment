#!/usr/bin/env node

/**
 * Fix Seeded Users Script
 * Removes existing seeded users with double-hashed passwords and re-creates them with correct hashing
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { User } = require('../models');
const SeedService = require('../services/seedService');
const consoleUtils = require('../utils/consoleUtils');

/**
 * Connect to database
 */
async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/library-management';
    await mongoose.connect(mongoUri);
    consoleUtils.logSuccess('✅ Connected to database');
  } catch (error) {
    consoleUtils.logError('❌ Failed to connect to database:', error);
    process.exit(1);
  }
}

/**
 * Disconnect from database
 */
async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    consoleUtils.logInfo('📤 Disconnected from database');
  } catch (error) {
    consoleUtils.logError('❌ Error disconnecting from database:', error);
  }
}

/**
 * Remove existing seeded users
 */
async function removeSeededUsers() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@library.com';
    const librarianEmail = process.env.LIBRARIAN_EMAIL || 'librarian@library.com';

    // Remove existing admin and librarian users
    const deleteResult = await User.deleteMany({
      email: { $in: [adminEmail, librarianEmail] }
    });

    consoleUtils.logSuccess(`✅ Removed ${deleteResult.deletedCount} existing seeded users`);
    return deleteResult.deletedCount;

  } catch (error) {
    consoleUtils.logError('❌ Failed to remove seeded users:', error);
    throw error;
  }
}

/**
 * Re-seed users with correct password hashing
 */
async function reseedUsers() {
  try {
    consoleUtils.logInfo('🌱 Re-seeding users with correct password hashing...');

    // Seed admin user
    const adminResult = await SeedService.seedAdminUser();
    if (adminResult.success) {
      consoleUtils.logSuccess(`✅ Admin user re-seeded: ${adminResult.data.email}`);
    } else {
      consoleUtils.logWarning(`⚠️ Admin user: ${adminResult.message}`);
    }

    // Seed librarian user
    const librarianResult = await SeedService.seedLibrarianUser();
    if (librarianResult.success) {
      consoleUtils.logSuccess(`✅ Librarian user re-seeded: ${librarianResult.data.email}`);
    } else {
      consoleUtils.logWarning(`⚠️ Librarian user: ${librarianResult.message}`);
    }

    return {
      admin: adminResult,
      librarian: librarianResult
    };

  } catch (error) {
    consoleUtils.logError('❌ Failed to re-seed users:', error);
    throw error;
  }
}

/**
 * Test login with seeded credentials
 */
async function testLogin() {
  try {
    consoleUtils.logInfo('🔍 Testing login with seeded credentials...');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@library.com';
    const adminPassword = process.env.ADMIN_PASSWORD;
    const librarianEmail = process.env.LIBRARIAN_EMAIL || 'librarian@library.com';
    const librarianPassword = process.env.LIBRARIAN_PASSWORD;

    if (!adminPassword || !librarianPassword) {
      consoleUtils.logWarning('⚠️ Admin or Librarian passwords not set in environment variables. Skipping login tests.');
      return;
    }

    // Test admin login
    const adminUser = await User.findByEmailWithPassword(adminEmail);
    if (adminUser) {
      const adminPasswordValid = await adminUser.comparePassword(adminPassword);
      if (adminPasswordValid) {
        consoleUtils.logSuccess(`✅ Admin login test: PASSED`);
      } else {
        consoleUtils.logError(`❌ Admin login test: FAILED - Password comparison failed`);
      }
    } else {
      consoleUtils.logError(`❌ Admin login test: FAILED - User not found`);
    }

    // Test librarian login
    const librarianUser = await User.findByEmailWithPassword(librarianEmail);
    if (librarianUser) {
      const librarianPasswordValid = await librarianUser.comparePassword(librarianPassword);
      if (librarianPasswordValid) {
        consoleUtils.logSuccess(`✅ Librarian login test: PASSED`);
      } else {
        consoleUtils.logError(`❌ Librarian login test: FAILED - Password comparison failed`);
      }
    } else {
      consoleUtils.logError(`❌ Librarian login test: FAILED - User not found`);
    }

  } catch (error) {
    consoleUtils.logError('❌ Failed to test login:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('\n🔧 Fixing Seeded Users with Double-Hashed Passwords\n');

    // Validate environment
    SeedService.validateSeedingEnvironment();

    // Connect to database
    await connectDatabase();

    // Remove existing seeded users
    const removedCount = await removeSeededUsers();
    
    if (removedCount > 0) {
      consoleUtils.logInfo(`Removed ${removedCount} users with double-hashed passwords`);
    }

    // Re-seed users with correct hashing
    const seedResults = await reseedUsers();

    // Test login functionality
    await testLogin();

    console.log('\n✅ Fix completed successfully!');

    if (process.env.ADMIN_PASSWORD && process.env.LIBRARIAN_PASSWORD) {
      console.log('\nYou can now login with:');
      console.log(`Admin: ${process.env.ADMIN_EMAIL || 'admin@library.com'} / [password from environment]`);
      console.log(`Librarian: ${process.env.LIBRARIAN_EMAIL || 'librarian@library.com'} / [password from environment]`);
    } else {
      console.log('\n⚠️ Please set ADMIN_PASSWORD and LIBRARIAN_PASSWORD in your .env file to use the seeded accounts.');
    }

    // Disconnect and exit
    await disconnectDatabase();
    process.exit(0);

  } catch (error) {
    consoleUtils.logError('❌ Fix failed:', error);
    await disconnectDatabase();
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️ Process interrupted');
  await disconnectDatabase();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️ Process terminated');
  await disconnectDatabase();
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}
