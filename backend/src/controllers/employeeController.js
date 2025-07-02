/**
 * Employee Controller
 * 
 * This module handles HTTP requests for employee operations and coordinates
 * between the Express routes and the employee service layer.
 * 
 * All controller functions follow a consistent pattern:
 * 1. Extract and validate request parameters
 * 2. Call appropriate service functions
 * 3. Handle errors gracefully
 * 4. Return standardized responses
 * 
 * @author HRMS Development Team
 * @version 1.0.0
 */

import * as employeeService from '../services/employeeService.js';

/**
 * Get all employees with optional filtering, searching, and pagination
 * 
 * Supports query parameters:
 * - department: Filter by department
 * - status: Filter by status (active/inactive)
 * - search: Search in name, email, position
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - sortBy: Field to sort by (default: 'name')
 * - sortOrder: Sort direction (asc/desc, default: 'asc')
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllEmployees = async (req, res) => {
  try {
    console.log('Controller: getAllEmployees called with query:', req.query);

    // Extract query parameters with defaults
    const options = {
      department: req.query.department,
      status: req.query.status,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy || 'name',
      sortOrder: req.query.sortOrder || 'asc'
    };

    // Call service layer
    const result = await employeeService.getAllEmployees(options);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Employees retrieved successfully',
      data: result.employees,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in getAllEmployees controller:', error.message);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve employees',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get a single employee by ID
 * 
 * @param {Object} req - Express request object (expects req.employeeId from middleware)
 * @param {Object} res - Express response object
 */
export const getEmployeeById = async (req, res) => {
  try {
    console.log('Controller: getEmployeeById called with ID:', req.employeeId);

    // Call service layer
    const employee = await employeeService.getEmployeeById(req.employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        code: 'EMPLOYEE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Employee retrieved successfully',
      data: employee,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in getEmployeeById controller:', error.message);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve employee',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Create a new employee
 * 
 * @param {Object} req - Express request object (expects validated body from middleware)
 * @param {Object} res - Express response object
 */
export const createEmployee = async (req, res) => {
  try {
    console.log('Controller: createEmployee called with data:', req.body);

    // Call service layer
    const newEmployee = await employeeService.createEmployee(req.body);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: newEmployee,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in createEmployee controller:', error.message);
    
    // Handle validation errors specifically
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      return res.status(409).json({
        success: false,
        error: 'Employee with this email already exists',
        code: 'DUPLICATE_EMAIL',
        timestamp: new Date().toISOString()
      });
    }

    // Return general error response
    res.status(500).json({
      success: false,
      error: 'Failed to create employee',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update an existing employee
 * 
 * @param {Object} req - Express request object (expects req.employeeId and validated body)
 * @param {Object} res - Express response object
 */
export const updateEmployee = async (req, res) => {
  try {
    console.log('Controller: updateEmployee called with ID:', req.employeeId, 'and data:', req.body);

    // Call service layer
    const updatedEmployee = await employeeService.updateEmployee(req.employeeId, req.body);

    if (!updatedEmployee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        code: 'EMPLOYEE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in updateEmployee controller:', error.message);
    
    // Handle validation errors specifically
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      return res.status(409).json({
        success: false,
        error: 'Employee with this email already exists',
        code: 'DUPLICATE_EMAIL',
        timestamp: new Date().toISOString()
      });
    }

    // Return general error response
    res.status(500).json({
      success: false,
      error: 'Failed to update employee',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete an employee
 * 
 * @param {Object} req - Express request object (expects req.employeeId from middleware)
 * @param {Object} res - Express response object
 */
export const deleteEmployee = async (req, res) => {
  try {
    console.log('Controller: deleteEmployee called with ID:', req.employeeId);

    // Call service layer
    const success = await employeeService.deleteEmployee(req.employeeId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        code: 'EMPLOYEE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in deleteEmployee controller:', error.message);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: 'Failed to delete employee',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get employee statistics and dashboard data
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getEmployeeStats = async (req, res) => {
  try {
    console.log('Controller: getEmployeeStats called');

    // Call service layer
    const stats = await employeeService.getEmployeeStatistics();

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Employee statistics retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in getEmployeeStats controller:', error.message);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve employee statistics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Search employees with advanced filters
 * 
 * @param {Object} req - Express request object (expects validated query params)
 * @param {Object} res - Express response object
 */
export const searchEmployees = async (req, res) => {
  try {
    console.log('Controller: searchEmployees called with filters:', req.query);

    // Extract search filters
    const filters = {
      query: req.query.q || req.query.query,
      department: req.query.department,
      position: req.query.position,
      status: req.query.status,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      salaryMin: req.query.salaryMin ? parseFloat(req.query.salaryMin) : undefined,
      salaryMax: req.query.salaryMax ? parseFloat(req.query.salaryMax) : undefined
    };

    // Call service layer
    const results = await employeeService.searchEmployees(filters);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Employee search completed successfully',
      data: results,
      searchFilters: filters,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in searchEmployees controller:', error.message);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: 'Failed to search employees',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Bulk import employees from CSV/JSON data
 * 
 * @param {Object} req - Express request object (expects validated employees array)
 * @param {Object} res - Express response object
 */
export const bulkImportEmployees = async (req, res) => {
  try {
    console.log('Controller: bulkImportEmployees called with', req.body.employees?.length || 0, 'employees');

    // Call service layer
    const result = await employeeService.bulkImportEmployees(req.body.employees);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Bulk import completed successfully',
      data: {
        imported: result.successful,
        failed: result.failed,
        total: result.total,
        errors: result.errors
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in bulkImportEmployees controller:', error.message);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: 'Failed to import employees',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Export employees data in various formats
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const exportEmployees = async (req, res) => {
  try {
    console.log('Controller: exportEmployees called with format:', req.query.format);

    const format = req.query.format || 'json';
    const filters = {
      department: req.query.department,
      status: req.query.status,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    // Call service layer
    const exportData = await employeeService.exportEmployees(format, filters);

    // Set appropriate headers based on format
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=employees.json');
    }

    // Return export data
    res.status(200).send(exportData);

  } catch (error) {
    console.error('Error in exportEmployees controller:', error.message);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: 'Failed to export employees',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};