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

import Employee from '../models/Employee.js';
import Department from '../models/Department.js';

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query object
    const query = {};

    if (req.query.department) {
      query.department = req.query.department;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex },
        { position: searchRegex }
      ];
    }

    // Build sort object
    const sortBy = req.query.sortBy || 'firstName';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    const sort = { [sortBy]: sortOrder };

    // Execute query with pagination
    const [employees, totalCount] = await Promise.all([
      Employee.find(query)
        .populate('department', 'name code')
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Employee.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const pagination = {
      currentPage: page,
      totalPages,
      totalItems: totalCount,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Employees retrieved successfully',
      data: employees,
      pagination,
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
    const employeeId = req.params.id;
    console.log('Controller: getEmployeeById called with ID:', employeeId);

    // Find employee by ID
    const employee = await Employee.findById(employeeId)
      .populate('department', 'name code description')
      .select('-password');

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

    // Create new employee
    const newEmployee = new Employee(req.body);
    await newEmployee.save();

    // Populate department info and remove password
    const populatedEmployee = await Employee.findById(newEmployee._id)
      .populate('department', 'name code description')
      .select('-password');

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: populatedEmployee,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in createEmployee controller:', error.message);

    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
        timestamp: new Date().toISOString()
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `Employee with this ${field} already exists`,
        code: 'DUPLICATE_FIELD',
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
    const employeeId = req.params.id;
    console.log('Controller: updateEmployee called with ID:', employeeId, 'and data:', req.body);

    // Update employee
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
    .populate('department', 'name code description')
    .select('-password');

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

    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
        timestamp: new Date().toISOString()
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `Employee with this ${field} already exists`,
        code: 'DUPLICATE_FIELD',
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
    const employeeId = req.params.id;
    console.log('Controller: deleteEmployee called with ID:', employeeId);

    // Soft delete by updating status to 'terminated'
    const deletedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { status: 'terminated' },
      { new: true }
    );

    if (!deletedEmployee) {
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

    // Get employee statistics using aggregation
    const [
      totalEmployees,
      activeEmployees,
      departmentStats,
      statusStats,
      salaryStats
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'active' }),
      Employee.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
        { $unwind: '$dept' },
        { $project: { departmentName: '$dept.name', count: 1 } }
      ]),
      Employee.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Employee.aggregate([
        {
          $group: {
            _id: null,
            averageSalary: { $avg: '$salary' },
            minSalary: { $min: '$salary' },
            maxSalary: { $max: '$salary' },
            totalSalaryBudget: { $sum: '$salary' }
          }
        }
      ])
    ]);

    const stats = {
      totalEmployees,
      activeEmployees,
      inactiveEmployees: totalEmployees - activeEmployees,
      departmentBreakdown: departmentStats,
      statusBreakdown: statusStats,
      salaryStatistics: salaryStats[0] || {
        averageSalary: 0,
        minSalary: 0,
        maxSalary: 0,
        totalSalaryBudget: 0
      }
    };

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

    // Build search query
    const query = {};

    // Text search
    if (req.query.q || req.query.query) {
      const searchTerm = req.query.q || req.query.query;
      const searchRegex = new RegExp(searchTerm, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex },
        { position: searchRegex }
      ];
    }

    // Department filter
    if (req.query.department) {
      query.department = req.query.department;
    }

    // Position filter
    if (req.query.position) {
      query.position = new RegExp(req.query.position, 'i');
    }

    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Date range filter (hire date)
    if (req.query.dateFrom || req.query.dateTo) {
      query.hireDate = {};
      if (req.query.dateFrom) {
        query.hireDate.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        query.hireDate.$lte = new Date(req.query.dateTo);
      }
    }

    // Salary range filter
    if (req.query.salaryMin || req.query.salaryMax) {
      query.salary = {};
      if (req.query.salaryMin) {
        query.salary.$gte = parseFloat(req.query.salaryMin);
      }
      if (req.query.salaryMax) {
        query.salary.$lte = parseFloat(req.query.salaryMax);
      }
    }

    // Execute search
    const results = await Employee.find(query)
      .populate('department', 'name code')
      .select('-password')
      .sort({ firstName: 1 });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Employee search completed successfully',
      data: results,
      count: results.length,
      searchFilters: req.query,
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

// Additional functions like bulk import and export can be added later