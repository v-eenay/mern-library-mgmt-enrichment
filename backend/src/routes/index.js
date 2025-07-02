/**
 * HRMS API Routes Configuration
 * Central hub for all API routes in the HRMS system
 */

import express from "express";
import authRoutes from './authRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import departmentRoutes from './departmentRoutes.js';
// import attendanceRoutes from './attendanceRoutes.js';

const router = express.Router();

// Route Registration
router.use('/auth', authRoutes);           // Authentication & profile management
router.use('/employees', employeeRoutes);  // Employee CRUD & search
router.use('/departments', departmentRoutes); // Department management
// router.use('/attendance', attendanceRoutes);  // Time tracking & reports (temporarily disabled)

// Health check endpoint
router.get('/health', (_, res) => {
  res.status(200).json({
    success: true,
    message: 'HRMS API is running successfully',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint
router.get('/info', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HRMS API Documentation',
    data: {
      api: {
        name: 'Human Resource Management System API',
        version: '2.0.0',
        description: 'Comprehensive HRMS API for employee, department, and attendance management',
        baseUrl: `${req.protocol}://${req.get('host')}/api`,
        documentation: 'https://docs.hrms.com/api',
        support: 'support@hrms.com'
      },
      authentication: {
        type: 'JWT Bearer Token',
        header: 'Authorization: Bearer <token>',
        endpoints: {
          login: 'POST /api/auth/login',
          register: 'POST /api/auth/register',
          refresh: 'POST /api/auth/refresh'
        }
      },
      responseFormat: {
        success: {
          success: true,
          message: 'string',
          data: 'object|array',
          timestamp: 'ISO 8601 string'
        },
        error: {
          success: false,
          error: 'string',
          message: 'string',
          code: 'string (optional)',
          timestamp: 'ISO 8601 string'
        }
      },
      modules: {
        authentication: {
          base: '/api/auth',
          description: 'User authentication and profile management',
          endpoints: {
            'POST /login': 'Authenticate user and return JWT token',
            'POST /register': 'Register new user account',
            'GET /profile': 'Get current user profile (requires auth)',
            'PUT /profile': 'Update user profile (requires auth)',
            'POST /change-password': 'Change user password (requires auth)',
            'POST /logout': 'Logout user (requires auth)',
            'POST /refresh': 'Refresh JWT token'
          },
          authentication: 'Required for all except login, register, refresh'
        },
        employees: {
          base: '/api/employees',
          description: 'Employee management and operations',
          endpoints: {
            'GET /': 'List employees with pagination and filtering',
            'GET /stats': 'Get employee statistics and analytics',
            'GET /search': 'Advanced employee search with filters',
            'GET /:id': 'Get specific employee by ID',
            'POST /': 'Create new employee',
            'PUT /:id': 'Update existing employee',
            'DELETE /:id': 'Delete employee (soft delete)'
          },
          queryParameters: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)',
            search: 'Search term for name, email, or employee ID',
            department: 'Filter by department ID',
            status: 'Filter by status (active, inactive, terminated)',
            sortBy: 'Sort field (name, email, createdAt, etc.)',
            sortOrder: 'Sort direction (asc, desc)'
          },
          authentication: 'Required for all operations'
        },
        departments: {
          base: '/api/departments',
          description: 'Department management and organizational structure',
          endpoints: {
            'GET /': 'List departments with hierarchy information',
            'GET /stats': 'Get department statistics and metrics',
            'GET /:id': 'Get specific department by ID',
            'POST /': 'Create new department',
            'PUT /:id': 'Update existing department',
            'DELETE /:id': 'Delete department (if no active employees)'
          },
          features: [
            'Hierarchical department structure',
            'Employee count tracking',
            'Budget management',
            'Manager assignment'
          ],
          authentication: 'Required for all operations'
        },
        attendance: {
          base: '/api/attendance',
          description: 'Time tracking and attendance management',
          endpoints: {
            'GET /': 'List attendance records with filtering',
            'GET /stats': 'Get attendance statistics and analytics',
            'GET /monthly/:employeeId/:year/:month': 'Get monthly attendance summary',
            'GET /:id': 'Get specific attendance record',
            'POST /': 'Clock in or create attendance record',
            'PUT /:id': 'Clock out or update attendance record',
            'DELETE /:id': 'Delete attendance record'
          },
          features: [
            'Clock in/out functionality',
            'Break time tracking',
            'Overtime calculation',
            'Monthly and yearly reports',
            'Attendance statistics'
          ],
          authentication: 'Required for all operations'
        }
      },
      utilities: {
        'GET /api/health': 'API health check and status',
        'GET /api/info': 'This comprehensive API documentation'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    documentation: '/api/info',
    timestamp: new Date().toISOString()
  });
});

export default router;