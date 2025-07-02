/**
 * HRMS Backend Server Entry Point
 * 
 * This is the main entry point for the HRMS backend server.
 * It sets up the Express application with our modular API structure.
 * 
 * @author HRMS Development Team
 * @version 1.0.0
 */

import dotenv from 'dotenv';
import app from './src/app.js';

// Load environment variables
dotenv.config();

// Get port from environment or use default
const PORT = process.env.PORT || 5001;

/**
 * Start the server
 */
const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 HRMS Backend Server is running on port ${PORT}`);
      console.log(`📍 Server URL: http://localhost:${PORT}`);
      console.log(`📖 API Documentation: http://localhost:${PORT}/api/info`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`👥 Employee API: http://localhost:${PORT}/api/employees`);
      console.log('');
      console.log('📁 Project Structure:');
      console.log('  ├── controllers/ - HTTP request handlers');
      console.log('  ├── services/    - Business logic layer');
      console.log('  ├── models/      - Data models');
      console.log('  ├── validations/ - Request validation');
      console.log('  └── routes/      - API route definitions');
      console.log('');
      console.log('✅ Server started successfully!');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

/**
 * Graceful shutdown handling
 */
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
