const mongoose = require('mongoose');
const colors = require('colors');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log('✓'.green, 'MongoDB Connected:'.cyan, conn.connection.host.yellow);
  } catch (error) {
    console.log('✗'.red, 'Database connection error:'.red, error.message);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✓'.green, 'Mongoose connected to MongoDB'.cyan);
});

mongoose.connection.on('error', (err) => {
  console.log('✗'.red, 'Mongoose connection error:'.red, err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠'.yellow, 'Mongoose disconnected'.yellow);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('⚠'.yellow, 'MongoDB connection closed through app termination'.yellow);
  process.exit(0);
});

module.exports = connectDB;
