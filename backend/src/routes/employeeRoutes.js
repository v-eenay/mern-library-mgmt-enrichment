/**
 * Employee Routes
 * 
 * This module defines all HTTP routes for employee operations:
 * - CRUD operations with proper validation
 * - Search and filtering endpoints
 * - Statistics and reporting endpoints
 * - Bulk operations (import/export)
 * 
 * Each route is protected by appropriate validation middleware
 * and connected to controller functions.
 * 
 * @author HRMS Development Team
 * @version 1.0.0
 */

import express from 'express';

// Import controller functions
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  searchEmployees,
  bulkImportEmployees,
  exportEmployees
} from '../controllers/employeeController.js';

// Import validation middleware
import {
  validateEmployeeId,
  validateEmployeeCreation,
  validateEmployeeUpdate,
  validateEmployeeQuery,
  validateBulkImport
} from '../validations/employeeValidation.js';

const router = express.Router();

/**
 * Employee CRUD Routes
 */

// GET /api/employees - Get all employees with optional filtering and pagination
// Query params: department, status, search, page, limit, sortBy, sortOrder
router.get('/', validateEmployeeQuery, getAllEmployees);

// GET /api/employees/stats - Get employee statistics and dashboard data
// Note: This must come before /:id route to avoid conflicts
router.get('/stats', getEmployeeStats);

// GET /api/employees/search - Advanced employee search
// Query params: q, department, position, status, dateFrom, dateTo, salaryMin, salaryMax
router.get('/search', validateEmployeeQuery, searchEmployees);

// GET /api/employees/export - Export employees data
// Query params: format (json/csv), department, status, dateFrom, dateTo
router.get('/export', validateEmployeeQuery, exportEmployees);

// GET /api/employees/:id - Get a specific employee by ID
router.get('/:id', validateEmployeeId, getEmployeeById);

// POST /api/employees - Create a new employee
router.post('/', validateEmployeeCreation, createEmployee);

// POST /api/employees/bulk-import - Bulk import employees
router.post('/bulk-import', validateBulkImport, bulkImportEmployees);

// PUT /api/employees/:id - Update an existing employee
router.put('/:id', validateEmployeeId, validateEmployeeUpdate, updateEmployee);

// DELETE /api/employees/:id - Delete an employee
router.delete('/:id', validateEmployeeId, deleteEmployee);

/**
 * Route Documentation
 * 
 * GET    /api/employees           - List all employees (with filters/pagination)
 * GET    /api/employees/stats     - Get employee statistics
 * GET    /api/employees/search    - Advanced search employees
 * GET    /api/employees/export    - Export employees data
 * GET    /api/employees/:id       - Get employee by ID
 * POST   /api/employees           - Create new employee
 * POST   /api/employees/bulk-import - Bulk import employees
 * PUT    /api/employees/:id       - Update employee
 * DELETE /api/employees/:id       - Delete employee
 * 
 * All routes return standardized JSON responses:
 * {
 *   success: boolean,
 *   message: string,
 *   data?: any,
 *   error?: string,
 *   timestamp: string
 * }
 */

export default router;