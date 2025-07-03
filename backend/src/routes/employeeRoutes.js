/**
 * Employee Management Routes
 * Handles employee CRUD operations, search, and statistics
 */

import express from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  searchEmployees
} from '../controllers/employeeController.js';

const router = express.Router();

// Employee listing and search
router.get('/', getAllEmployees);                    // Get all employees with pagination/filtering
router.get('/stats', getEmployeeStats);              // Get employee statistics
router.get('/search', searchEmployees);              // Advanced employee search
router.get('/:id', getEmployeeById);                 // Get specific employee by ID

// Employee CRUD operations
router.post('/', createEmployee);                    // Create new employee
router.put('/:id', updateEmployee);                  // Update existing employee
router.delete('/:id', deleteEmployee);               // Delete employee (soft delete)

export default router;