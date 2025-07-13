#!/usr/bin/env node

/**
 * Database Seeding Script
 * Command line tool for seeding the database with initial data
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SeedService = require('../services/seedService');
const consoleUtils = require('../utils/consoleUtils');

// Command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Available commands
const COMMANDS = {
  admin: 'Seed admin user',
  librarian: 'Seed librarian user',
  categories: 'Seed default categories',
  all: 'Seed all initial data',
  status: 'Check seeding status',
  help: 'Show this help message'
};

/**
 * Display help message
 */
function showHelp() {
  console.log('\n📚 Library Management System - Database Seeding Tool\n');
  console.log('Usage: npm run seed <command>\n');
  console.log('Available commands:');
  
  Object.entries(COMMANDS).forEach(([cmd, description]) => {
    console.log(`  ${cmd.padEnd(12)} - ${description}`);
  });
  
  console.log('\nExamples:');
  console.log('  npm run seed admin      # Seed admin user');
  console.log('  npm run seed all        # Seed all initial data');
  console.log('  npm run seed status     # Check current status');
  console.log('\nEnvironment Variables:');
  console.log('  ADMIN_EMAIL             # Admin email (default: admin@library.com)');
  console.log('  ADMIN_PASSWORD          # Admin password (REQUIRED - set in .env file)');
  console.log('  ADMIN_NAME              # Admin name (default: System Administrator)');
  console.log('  LIBRARIAN_EMAIL         # Librarian email (default: librarian@library.com)');
  console.log('  LIBRARIAN_PASSWORD      # Librarian password (REQUIRED - set in .env file)');
  console.log('  LIBRARIAN_NAME          # Librarian name (default: Head Librarian)');
  console.log('');
}

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
 * Check seeding status
 */
async function checkStatus() {
  try {
    const { User, Category } = require('../models');

    const [adminCount, librarianCount, categoryCount, totalUsers] = await Promise.all([
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'librarian' }),
      Category.countDocuments({}),
      User.countDocuments({})
    ]);

    console.log('\n📊 Database Seeding Status\n');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Seeding Allowed:', SeedService.isSeeddingAllowed());
    console.log('');
    console.log('Database Contents:');
    console.log(`  Total Users: ${totalUsers}`);
    console.log(`  Admin Users: ${adminCount}`);
    console.log(`  Librarian Users: ${librarianCount}`);
    console.log(`  Borrower Users: ${totalUsers - adminCount - librarianCount}`);
    console.log(`  Categories: ${categoryCount}`);
    console.log('');

    // Recommendations
    const recommendations = [];
    if (adminCount === 0) recommendations.push('No admin users found. Run: npm run seed admin');
    if (librarianCount === 0) recommendations.push('No librarian users found. Run: npm run seed librarian');
    if (categoryCount === 0) recommendations.push('No categories found. Run: npm run seed categories');

    if (recommendations.length > 0) {
      console.log('💡 Recommendations:');
      recommendations.forEach(rec => console.log(`  • ${rec}`));
    } else {
      console.log('✅ All essential data is present');
    }
    console.log('');

  } catch (error) {
    consoleUtils.logError('❌ Failed to check status:', error);
    throw error;
  }
}

/**
 * Execute seeding command
 */
async function executeCommand(command) {
  try {
    // Validate environment
    SeedService.validateSeedingEnvironment();

    let result;

    switch (command) {
      case 'admin':
        consoleUtils.logInfo('🌱 Seeding admin user...');
        result = await SeedService.seedAdminUser();
        break;

      case 'librarian':
        consoleUtils.logInfo('🌱 Seeding librarian user...');
        result = await SeedService.seedLibrarianUser();
        break;

      case 'categories':
        consoleUtils.logInfo('🌱 Seeding categories...');
        result = await SeedService.seedCategories();
        break;

      case 'all':
        consoleUtils.logInfo('🌱 Seeding all initial data...');
        result = await SeedService.seedAll();
        break;

      case 'status':
        await checkStatus();
        return;

      case 'help':
      case undefined:
        showHelp();
        return;

      default:
        consoleUtils.logError(`❌ Unknown command: ${command}`);
        console.log('Run "npm run seed help" for available commands.');
        process.exit(1);
    }

    // Display result
    if (result) {
      if (result.success) {
        consoleUtils.logSuccess(`✅ ${result.message}`);
        if (result.data) {
          console.log('Details:', JSON.stringify(result.data, null, 2));
        }
      } else {
        consoleUtils.logWarning(`⚠️ ${result.message}`);
        if (result.data) {
          console.log('Details:', JSON.stringify(result.data, null, 2));
        }
      }
    }

  } catch (error) {
    consoleUtils.logError('❌ Seeding failed:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Show banner
    console.log('\n🌱 Database Seeding Tool\n');

    // Connect to database
    await connectDatabase();

    // Execute command
    await executeCommand(command);

    // Disconnect and exit
    await disconnectDatabase();
    process.exit(0);

  } catch (error) {
    consoleUtils.logError('❌ Script failed:', error);
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
