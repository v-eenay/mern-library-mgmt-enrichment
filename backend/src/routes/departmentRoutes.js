/**
 * Department Management Routes
 * Handles department CRUD operations and organizational hierarchy
 */

import express from 'express';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentStats
} from '../controllers/departmentController.js';

const router = express.Router();

// Department listing and analytics
router.get('/', getAllDepartments);                  // Get all departments with hierarchy
router.get('/stats', getDepartmentStats);            // Get department statistics
router.get('/:id', getDepartmentById);               // Get specific department by ID

// Department CRUD operations
router.post('/', createDepartment);                  // Create new department
router.put('/:id', updateDepartment);                // Update existing department
router.delete('/:id', deleteDepartment);             // Delete department (soft delete)

export default router;
