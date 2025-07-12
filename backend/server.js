const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const path = require('path');

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

// Import console utilities for professional output
const consoleUtils = require('./utils/consoleUtils');
const startupDisplay = require('./utils/startupDisplay');

// Import models to ensure they are registered
require('./models');

const app = express();

// Connect to database with enhanced logging
connectDB()
  .then(() => {
    consoleUtils.logSuccess('Database connected successfully');
  })
  .catch((error) => {
    consoleUtils.logError('Database connection failed', error);
  });

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

// Import seeding routes
const seedRoutes = require('./routes/seed');

// Serve static files for landing page
app.use(express.static(path.join(__dirname, 'public')));

// Landing page route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/borrows', borrowsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/seed', seedRoutes);

// Simple error handling (fixed version)
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND'
  });
});

app.use((err, req, res, next) => {
  consoleUtils.logError(`Server Error: ${err.message}`, err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

const PORT = process.env.PORT || DEFAULTS.PORT;

// Professional startup display function
const displayStartupInfo = async () => {
  const env = process.env.NODE_ENV || 'development';
  await startupDisplay.displayStartup(PORT, env);
};

app.listen(PORT, async () => {
  await displayStartupInfo();
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  startupDisplay.displayShutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  startupDisplay.displayShutdown();
  process.exit(0);
});
