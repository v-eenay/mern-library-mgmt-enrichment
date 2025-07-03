/**
 * Department Controller
 * 
 * This module handles HTTP requests for department operations and coordinates
 * between the Express routes and the department data layer.
 * 
 * @author HRMS Development Team
 * @version 2.0.0
 */

import Department from '../models/Department.js';
import Employee from '../models/Employee.js';

/**
 * Get all departments with optional filtering and pagination
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllDepartments = async (req, res) => {
  try {
    console.log('Controller: getAllDepartments called with query:', req.query);

    // Extract query parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build query object
    const query = {};
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { description: searchRegex }
      ];
    }

    // Build sort object
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    const sort = { [sortBy]: sortOrder };

    // Execute query with pagination
    const [departments, totalCount] = await Promise.all([
      Department.find(query)
        .populate('manager', 'firstName lastName email position')
        .populate('parentDepartment', 'name code')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Department.countDocuments(query)
    ]);

    // Get employee count for each department
    const departmentsWithEmployeeCount = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await Employee.countDocuments({ 
          department: dept._id, 
          status: 'active' 
        });
        return {
          ...dept.toObject(),
          employeeCount
        };
      })
    );

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
      message: 'Departments retrieved successfully',
      data: departmentsWithEmployeeCount,
      pagination,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in getAllDepartments controller:', error.message);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve departments',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get a single department by ID
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDepartmentById = async (req, res) => {
  try {
    const departmentId = req.params.id;
    console.log('Controller: getDepartmentById called with ID:', departmentId);

    // Find department by ID
    const department = await Department.findById(departmentId)
      .populate('manager', 'firstName lastName email position')
      .populate('parentDepartment', 'name code description');

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
        code: 'DEPARTMENT_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Get employees in this department
    const employees = await Employee.find({ 
      department: departmentId, 
      status: 'active' 
    }).select('firstName lastName email position');

    // Get child departments
    const childDepartments = await Department.find({ 
      parentDepartment: departmentId 
    }).select('name code description');

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Department retrieved successfully',
      data: {
        ...department.toObject(),
        employees,
        childDepartments,
        employeeCount: employees.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in getDepartmentById controller:', error.message);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve department',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Create a new department
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createDepartment = async (req, res) => {
  try {
    console.log('Controller: createDepartment called with data:', req.body);

    // Create new department
    const newDepartment = new Department(req.body);
    await newDepartment.save();

    // Populate manager and parent department info
    const populatedDepartment = await Department.findById(newDepartment._id)
      .populate('manager', 'firstName lastName email position')
      .populate('parentDepartment', 'name code description');

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: populatedDepartment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in createDepartment controller:', error.message);
    
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
        error: `Department with this ${field} already exists`,
        code: 'DUPLICATE_FIELD',
        timestamp: new Date().toISOString()
      });
    }

    // Return general error response
    res.status(500).json({
      success: false,
      error: 'Failed to create department',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update an existing department
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;
    console.log('Controller: updateDepartment called with ID:', departmentId, 'and data:', req.body);

    // Update department
    const updatedDepartment = await Department.findByIdAndUpdate(
      departmentId,
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
    )
    .populate('manager', 'firstName lastName email position')
    .populate('parentDepartment', 'name code description');

    if (!updatedDepartment) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
        code: 'DEPARTMENT_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: updatedDepartment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in updateDepartment controller:', error.message);
    
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
        error: `Department with this ${field} already exists`,
        code: 'DUPLICATE_FIELD',
        timestamp: new Date().toISOString()
      });
    }

    // Return general error response
    res.status(500).json({
      success: false,
      error: 'Failed to update department',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete a department
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;
    console.log('Controller: deleteDepartment called with ID:', departmentId);

    // Check if department has employees
    const employeeCount = await Employee.countDocuments({
      department: departmentId,
      status: 'active'
    });

    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete department with active employees',
        code: 'DEPARTMENT_HAS_EMPLOYEES',
        employeeCount,
        timestamp: new Date().toISOString()
      });
    }

    // Soft delete by updating status to 'inactive'
    const deletedDepartment = await Department.findByIdAndUpdate(
      departmentId,
      { status: 'inactive' },
      { new: true }
    );

    if (!deletedDepartment) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
        code: 'DEPARTMENT_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in deleteDepartment controller:', error.message);

    // Return error response
    res.status(500).json({
      success: false,
      error: 'Failed to delete department',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get department statistics
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDepartmentStats = async (req, res) => {
  try {
    console.log('Controller: getDepartmentStats called');

    // Get department statistics
    const [
      totalDepartments,
      activeDepartments,
      departmentEmployeeCounts,
      departmentSalaryStats
    ] = await Promise.all([
      Department.countDocuments(),
      Department.countDocuments({ status: 'active' }),
      Department.aggregate([
        { $match: { status: 'active' } },
        {
          $lookup: {
            from: 'employees',
            localField: '_id',
            foreignField: 'department',
            as: 'employees'
          }
        },
        {
          $project: {
            name: 1,
            code: 1,
            employeeCount: { $size: '$employees' }
          }
        },
        { $sort: { employeeCount: -1 } }
      ]),
      Employee.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$department',
            averageSalary: { $avg: '$salary' },
            totalSalary: { $sum: '$salary' },
            employeeCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'departments',
            localField: '_id',
            foreignField: '_id',
            as: 'department'
          }
        },
        { $unwind: '$department' },
        {
          $project: {
            departmentName: '$department.name',
            departmentCode: '$department.code',
            averageSalary: { $round: ['$averageSalary', 2] },
            totalSalary: '$totalSalary',
            employeeCount: '$employeeCount'
          }
        }
      ])
    ]);

    const stats = {
      totalDepartments,
      activeDepartments,
      inactiveDepartments: totalDepartments - activeDepartments,
      departmentEmployeeCounts,
      departmentSalaryStats
    };

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Department statistics retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in getDepartmentStats controller:', error.message);

    // Return error response
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve department statistics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
