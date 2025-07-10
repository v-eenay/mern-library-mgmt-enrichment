const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');

// Load environment variables (suppress promotional messages)
const originalConsoleLog = console.log;
console.log = (...args) => {
  const message = args.join(' ');
  if (!message.includes('dotenv') && !message.includes('dotenvx')) {
    originalConsoleLog(...args);
  }
};
dotenv.config();
console.log = originalConsoleLog;

// Import configuration modules
const connectDB = require('./config/database');
const { applyMiddleware, applyErrorHandling } = require('./config/middleware');
const { swaggerSpec, swaggerUi, swaggerUiOptions } = require('./config/swagger');
const { DEFAULTS } = require('./utils/constants');

// Import models to ensure they are registered
require('./models');

const app = express();

// Connect to database
connectDB();

// Apply basic middleware (custom middleware has path-to-regexp issues)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));




// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Library Management System Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    documentation: {
      swagger: '/api-docs',
      openapi: '/api-docs.json'
    }
  });
});

// Security monitoring endpoint (basic implementation)
app.get('/security/stats', (req, res) => {
  // Simple authentication check (in production, use proper auth)
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.SECURITY_MONITOR_TOKEN || 'dev-token'}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Basic security stats (since getSecurityStats method may not exist)
  const stats = {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };

  res.json({
    status: 'success',
    data: stats,
    timestamp: new Date().toISOString()
  });
});

// Import all routes from centralized index
const {
  authRoutes,
  usersRoutes,
  booksRoutes,
  borrowsRoutes,
  categoriesRoutes,
  contactRoutes,
  reviewsRoutes,
  rbacRoutes
} = require('./routes');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/borrows', borrowsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/rbac', rbacRoutes);

// Simple error handling (fixed version)
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

const PORT = process.env.PORT || DEFAULTS.PORT;

// Enhanced startup display function
const displayStartupInfo = () => {
  const env = process.env.NODE_ENV || 'development';
  const serverUrl = `http://localhost:${PORT}`;

  console.log('\n' + '═'.repeat(80).cyan);
  console.log('║'.cyan + '                    📚 LIBRARY MANAGEMENT SYSTEM                    '.bold.white + '║'.cyan);
  console.log('║'.cyan + '                          Backend API Server                          '.white + '║'.cyan);
  console.log('═'.repeat(80).cyan);
  console.log('');

  // Server Status
  console.log('✓'.green, 'Server Status:'.bold, 'Running'.green);
  console.log('✓'.green, 'Environment:'.bold, env.toUpperCase().yellow);
  console.log('✓'.green, 'Port:'.bold, PORT.toString().cyan);
  console.log('✓'.green, 'URL:'.bold, serverUrl.blue.underline);
  console.log('');

  // API Endpoints Summary
  console.log('📋 Available API Endpoints:'.magenta);
  console.log('   ├─'.gray, 'GET  /health'.cyan, '- Server health check'.gray);
  console.log('   ├─'.gray, 'POST /api/auth/*'.cyan, '- Authentication routes'.gray);
  console.log('   ├─'.gray, 'GET  /api/books/*'.cyan, '- Book management'.gray);
  console.log('   ├─'.gray, 'POST /api/borrows/*'.cyan, '- Borrowing system'.gray);
  console.log('   ├─'.gray, 'GET  /api/categories/*'.cyan, '- Category management'.gray);
  console.log('   ├─'.gray, 'POST /api/contact'.cyan, '- Contact messages'.gray);
  console.log('   ├─'.gray, 'GET  /api/reviews/*'.cyan, '- Review system'.gray);
  console.log('   └─'.gray, 'GET  /api/users/*'.cyan, '- User management (Librarian)'.gray);
  console.log('');

  // Development Info
  if (env === 'development') {
    console.log('🔧 Development Mode:'.yellow);
    console.log('   ├─'.gray, 'Hot reload enabled'.yellow);
    console.log('   ├─'.gray, 'Detailed logging active'.yellow);
    console.log('   └─'.gray, 'CORS enabled for'.yellow, (process.env.CLIENT_URL || 'http://localhost:3000').cyan);
    console.log('');
  }

  console.log('🚀 Ready to accept connections!'.green);
  console.log('═'.repeat(80).cyan + '\n');
};

app.listen(PORT, () => {
  displayStartupInfo();
});
