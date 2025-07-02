/**
 * Main Routes Index
 * 
 * This module serves as the central hub for all API routes.
 * It registers and organizes all route modules under their
 * respective base paths.
 * 
 * @author HRMS Development Team
 * @version 1.0.0
 */

import express from "express";
import employeeRoutes from './employeeRoutes.js';

const router = express.Router();

/**
 * API Route Registration
 * 
 * All routes are prefixed with /api in the main app.js file
 * Routes registered here will be available at:
 * - /api/employees/* - Employee management endpoints
 */

// Employee routes - handles all employee CRUD operations
router.use('/employees', employeeRoutes);

/**
 * API Health Check Endpoint
 * Simple endpoint to verify API is running
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HRMS API is running successfully',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * API Info Endpoint
 * Provides information about available endpoints
 */
router.get('/info', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HRMS API Information',
    data: {
      version: '1.0.0',
      endpoints: {
        employees: {
          base: '/api/employees',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          features: [
            'CRUD operations',
            'Search and filtering',
            'Pagination',
            'Statistics',
            'Bulk import/export'
          ]
        },
        health: '/api/health',
        info: '/api/info'
      }
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Default route handler for undefined endpoints
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: '/api/info',
    timestamp: new Date().toISOString()
  });
});

export default router;