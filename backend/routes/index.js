/**
 * Routes Index File
 * 
 * This file serves as a centralized entry point for all API routes.
 * It imports and exports all route modules to simplify route management
 * and provide a single import location for the main server file.
 */

const authRoutes = require('./auth');
const booksRoutes = require('./books');
const borrowsRoutes = require('./borrows');
const categoriesRoutes = require('./categories');
const contactRoutes = require('./contact');
const reviewsRoutes = require('./reviews');
const usersRoutes = require('./users');
const rbacRoutes = require('./rbac');

/**
 * Export all route modules
 * This allows the server.js file to import all routes from a single location
 */
module.exports = {
  authRoutes,
  booksRoutes,
  borrowsRoutes,
  categoriesRoutes,
  contactRoutes,
  reviewsRoutes,
  usersRoutes,
  rbacRoutes
};
