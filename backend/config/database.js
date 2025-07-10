const mongoose = require('mongoose');
const colors = require('colors');
const consoleUtils = require('../utils/consoleUtils');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    // Success message will be handled by the startup display
    return conn;
  } catch (error) {
    consoleUtils.logError('Database connection failed', error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  // Connection success is handled by startup display
});

mongoose.connection.on('error', (err) => {
  consoleUtils.logError('Database connection error', err);
});

mongoose.connection.on('disconnected', () => {
  consoleUtils.logWarning('Database disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  consoleUtils.logInfo('Database connection closed');
  process.exit(0);
});

module.exports = connectDB;
