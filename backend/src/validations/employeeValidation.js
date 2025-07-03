/**
 * Employee Validation Middleware
 * 
 * This module provides validation middleware for employee-related API endpoints:
 * - Request parameter validation
 * - Request body validation
 * - Query parameter validation
 * - Custom validation rules
 * 
 * @author HRMS Development Team
 * @version 1.0.0
 */

/**
 * Validate employee ID parameter
 * Middleware to validate that the employee ID is provided and has valid format
 */
const validateEmployeeId = (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if ID is provided
    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Employee ID is required',
        code: 'MISSING_EMPLOYEE_ID'
      });
    }

    // Check ID format (should start with 'emp-' for our system)
    const idPattern = /^emp-/;
    if (!idPattern.test(id.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID format',
        code: 'INVALID_EMPLOYEE_ID_FORMAT'
      });
    }

    // Attach sanitized ID to request
    req.employeeId = id.trim();
    next();
  } catch (error) {
    console.error('Error in validateEmployeeId middleware:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during ID validation'
    });
  }
};

/**
 * Validate employee creation data
 * Middleware to validate required fields for creating a new employee
 */
const validateEmployeeCreation = (req, res, next) => {
  try {
    const { firstName, lastName, email, position, department } = req.body;
    const errors = [];

    // Required field validation
    if (!firstName || firstName.trim() === '') {
      errors.push('First name is required');
    }

    if (!lastName || lastName.trim() === '') {
      errors.push('Last name is required');
    }

    if (!email || email.trim() === '') {
      errors.push('Email is required');
    } else {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push('Invalid email format');
      }
    }

    if (!position || position.trim() === '') {
      errors.push('Position is required');
    }

    if (!department || department.trim() === '') {
      errors.push('Department is required');
    }

    // Optional field validation
    if (req.body.phone && req.body.phone.trim() !== '') {
      const phoneRegex = /^[\+]?[1-9]?[\d\s\-\(\)]{7,15}$/;
      if (!phoneRegex.test(req.body.phone.trim())) {
        errors.push('Invalid phone number format');
      }
    }

    if (req.body.salary !== undefined) {
      const salary = Number(req.body.salary);
      if (isNaN(salary) || salary < 0) {
        errors.push('Salary must be a positive number');
      }
    }

    if (req.body.hireDate) {
      const hireDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!hireDateRegex.test(req.body.hireDate)) {
        errors.push('Hire date must be in YYYY-MM-DD format');
      }
    }

    if (req.body.status && !['active', 'inactive'].includes(req.body.status)) {
      errors.push('Status must be either "active" or "inactive"');
    }

    // If validation errors exist, return error response
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
        code: 'VALIDATION_ERROR'
      });
    }

    // Sanitize and attach validated data to request
    req.validatedEmployeeData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      position: position.trim(),
      department: department.trim(),
      phone: req.body.phone ? req.body.phone.trim() : '',
      salary: req.body.salary ? Number(req.body.salary) : 0,
      hireDate: req.body.hireDate || new Date().toISOString().split('T')[0],
      status: req.body.status || 'active'
    };

    next();
  } catch (error) {
    console.error('Error in validateEmployeeCreation middleware:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during validation'
    });
  }
};

/**
 * Validate employee update data
 * Middleware to validate fields for updating an existing employee
 */
const validateEmployeeUpdate = (req, res, next) => {
  try {
    const errors = [];
    const updateData = {};

    // Validate only provided fields
    if (req.body.firstName !== undefined) {
      if (req.body.firstName.trim() === '') {
        errors.push('First name cannot be empty');
      } else {
        updateData.firstName = req.body.firstName.trim();
      }
    }

    if (req.body.lastName !== undefined) {
      if (req.body.lastName.trim() === '') {
        errors.push('Last name cannot be empty');
      } else {
        updateData.lastName = req.body.lastName.trim();
      }
    }

    if (req.body.email !== undefined) {
      if (req.body.email.trim() === '') {
        errors.push('Email cannot be empty');
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.email.trim())) {
          errors.push('Invalid email format');
        } else {
          updateData.email = req.body.email.toLowerCase().trim();
        }
      }
    }

    if (req.body.position !== undefined) {
      if (req.body.position.trim() === '') {
        errors.push('Position cannot be empty');
      } else {
        updateData.position = req.body.position.trim();
      }
    }

    if (req.body.department !== undefined) {
      if (req.body.department.trim() === '') {
        errors.push('Department cannot be empty');
      } else {
        updateData.department = req.body.department.trim();
      }
    }

    if (req.body.phone !== undefined) {
      if (req.body.phone.trim() !== '') {
        const phoneRegex = /^[\+]?[1-9]?[\d\s\-\(\)]{7,15}$/;
        if (!phoneRegex.test(req.body.phone.trim())) {
          errors.push('Invalid phone number format');
        } else {
          updateData.phone = req.body.phone.trim();
        }
      } else {
        updateData.phone = '';
      }
    }

    if (req.body.salary !== undefined) {
      const salary = Number(req.body.salary);
      if (isNaN(salary) || salary < 0) {
        errors.push('Salary must be a positive number');
      } else {
        updateData.salary = salary;
      }
    }

    if (req.body.hireDate !== undefined) {
      const hireDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!hireDateRegex.test(req.body.hireDate)) {
        errors.push('Hire date must be in YYYY-MM-DD format');
      } else {
        updateData.hireDate = req.body.hireDate;
      }
    }

    if (req.body.status !== undefined) {
      if (!['active', 'inactive'].includes(req.body.status)) {
        errors.push('Status must be either "active" or "inactive"');
      } else {
        updateData.status = req.body.status;
      }
    }

    // Check if at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one field must be provided for update',
        code: 'NO_UPDATE_DATA'
      });
    }

    // If validation errors exist, return error response
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
        code: 'VALIDATION_ERROR'
      });
    }

    // Attach validated update data to request
    req.validatedUpdateData = updateData;
    next();
  } catch (error) {
    console.error('Error in validateEmployeeUpdate middleware:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during validation'
    });
  }
};

/**
 * Validate query parameters for employee listing
 * Middleware to validate and sanitize query parameters for filtering and pagination
 */
const validateEmployeeQuery = (req, res, next) => {
  try {
    const validatedQuery = {};

    // Pagination validation
    if (req.query.page) {
      const page = Number(req.query.page);
      if (isNaN(page) || page < 1) {
        return res.status(400).json({
          success: false,
          error: 'Page must be a positive number',
          code: 'INVALID_PAGE'
        });
      }
      validatedQuery.page = page;
    }

    if (req.query.limit) {
      const limit = Number(req.query.limit);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 100',
          code: 'INVALID_LIMIT'
        });
      }
      validatedQuery.limit = limit;
    }

    // Filter validation
    if (req.query.department) {
      validatedQuery.department = req.query.department.trim();
    }

    if (req.query.status) {
      if (!['active', 'inactive'].includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          error: 'Status must be either "active" or "inactive"',
          code: 'INVALID_STATUS'
        });
      }
      validatedQuery.status = req.query.status;
    }

    if (req.query.search) {
      validatedQuery.search = req.query.search.trim();
    }

    // Sorting validation
    if (req.query.sortBy) {
      const allowedSortFields = [
        'firstName', 'lastName', 'email', 'position', 
        'department', 'salary', 'hireDate', 'createdAt', 'updatedAt'
      ];
      if (!allowedSortFields.includes(req.query.sortBy)) {
        return res.status(400).json({
          success: false,
          error: `Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`,
          code: 'INVALID_SORT_FIELD'
        });
      }
      validatedQuery.sortBy = req.query.sortBy;
    }

    if (req.query.sortOrder) {
      if (!['asc', 'desc'].includes(req.query.sortOrder.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: 'Sort order must be either "asc" or "desc"',
          code: 'INVALID_SORT_ORDER'
        });
      }
      validatedQuery.sortOrder = req.query.sortOrder.toLowerCase();
    }

    // Attach validated query to request
    req.validatedQuery = validatedQuery;
    next();
  } catch (error) {
    console.error('Error in validateEmployeeQuery middleware:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during query validation'
    });
  }
};

/**
 * Validate bulk import data
 * Middleware to validate array of employee data for bulk import
 */
const validateBulkImport = (req, res, next) => {
  try {
    const { employees } = req.body;

    // Check if employees array is provided
    if (!employees || !Array.isArray(employees)) {
      return res.status(400).json({
        success: false,
        error: 'Employees array is required',
        code: 'MISSING_EMPLOYEES_ARRAY'
      });
    }

    // Check array length
    if (employees.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Employees array cannot be empty',
        code: 'EMPTY_EMPLOYEES_ARRAY'
      });
    }

    if (employees.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Cannot import more than 100 employees at once',
        code: 'TOO_MANY_EMPLOYEES'
      });
    }

    // Validate each employee object has minimum required fields
    const invalidEmployees = [];
    employees.forEach((employee, index) => {
      if (!employee.firstName || !employee.lastName || !employee.email) {
        invalidEmployees.push({
          index,
          error: 'Missing required fields: firstName, lastName, email'
        });
      }
    });

    if (invalidEmployees.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Some employees have missing required fields',
        details: invalidEmployees,
        code: 'INVALID_EMPLOYEE_DATA'
      });
    }

    req.validatedEmployees = employees;
    next();
  } catch (error) {
    console.error('Error in validateBulkImport middleware:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during bulk import validation'
    });
  }
};

// Export all validation middleware
export {
  validateEmployeeId,
  validateEmployeeCreation,
  validateEmployeeUpdate,
  validateEmployeeQuery,
  validateBulkImport
};
