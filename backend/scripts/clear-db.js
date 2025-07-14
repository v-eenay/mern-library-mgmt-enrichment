#!/usr/bin/env node

/**
 * Clear Database Script
 * Clears all data from the database for fresh seeding
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

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
 * Clear all collections
 */
async function clearDatabase() {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      await mongoose.connection.db.collection(collection.name).deleteMany({});
      consoleUtils.logInfo(`🗑️ Cleared collection: ${collection.name}`);
    }
    
    consoleUtils.logSuccess(`✅ Cleared ${collections.length} collections`);
    
  } catch (error) {
    consoleUtils.logError('❌ Failed to clear database:', error);
    throw error;
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
 * Main function
 */
async function main() {
  try {
    console.log('\n🗑️ Database Clearing Tool\n');

    // Connect to database
    await connectDatabase();

    // Clear database
    await clearDatabase();

    // Disconnect and exit
    await disconnectDatabase();
    console.log('\n✅ Database cleared successfully!');
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
