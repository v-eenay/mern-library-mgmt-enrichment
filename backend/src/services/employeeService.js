/**
 * Employee Service Layer
 * 
 * This module contains all business logic for employee operations:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Data validation and processing
 * - Search and filtering functionality
 * - Statistics and reporting
 * 
 * @author HRMS Development Team
 * @version 1.0.0
 */

import {
  employees,
  saveEmployees,
  validateEmployeeData,
  createEmployeeObject,
  generateEmployeeId
} from '../models/Employee.js';

/**
 * Get all employees with optional filtering and pagination
 * @param {Object} options - Query options
 * @param {string} options.department - Filter by department
 * @param {string} options.status - Filter by status (active/inactive)
 * @param {string} options.search - Search in name, email, or position
 * @param {number} options.page - Page number for pagination
 * @param {number} options.limit - Items per page
 * @param {string} options.sortBy - Field to sort by
 * @param {string} options.sortOrder - Sort order (asc/desc)
 * @returns {Object} Paginated employee data with metadata
 */
const getEmployees = (options = {}) => {
  try {
    const {
      department,
      status,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // Start with all employees
    let filteredEmployees = [...employees];

    // Apply department filter
    if (department && department.trim() !== '') {
      filteredEmployees = filteredEmployees.filter(emp =>
        emp.department.toLowerCase().includes(department.toLowerCase())
      );
    }

    // Apply status filter
    if (status && status.trim() !== '') {
      filteredEmployees = filteredEmployees.filter(emp =>
        emp.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Apply search filter (searches in firstName, lastName, email, position)
    if (search && search.trim() !== '') {
      const searchTerm = search.toLowerCase().trim();
      filteredEmployees = filteredEmployees.filter(emp =>
        emp.firstName.toLowerCase().includes(searchTerm) ||
        emp.lastName.toLowerCase().includes(searchTerm) ||
        emp.email.toLowerCase().includes(searchTerm) ||
        emp.position.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    filteredEmployees.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle different data types
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    // Calculate pagination
    const totalEmployees = filteredEmployees.length;
    const totalPages = Math.ceil(totalEmployees / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + Number(limit);

    // Get paginated results
    const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

    console.log(`Retrieved ${paginatedEmployees.length} employees (page ${page} of ${totalPages})`);

    return {
      success: true,
      data: paginatedEmployees,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalEmployees,
        limit: Number(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        department,
        status,
        search,
        sortBy,
        sortOrder
      }
    };
  } catch (error) {
    console.error('Error in getEmployees service:', error.message);
    return {
      success: false,
      error: 'Failed to retrieve employees',
      data: [],
      pagination: null
    };
  }
};

/**
 * Get a single employee by ID
 * @param {string} employeeId - Employee ID to search for
 * @returns {Object} Employee data or error message
 */
const getEmployee = (employeeId) => {
  try {
    // Validate input
    if (!employeeId || employeeId.trim() === '') {
      return {
        success: false,
        error: 'Employee ID is required'
      };
    }

    // Find employee by ID
    const employee = employees.find(emp => emp.id === employeeId.trim());

    if (!employee) {
      console.log(`Employee not found with ID: ${employeeId}`);
      return {
        success: false,
        error: 'Employee not found'
      };
    }

    console.log(`Retrieved employee: ${employee.firstName} ${employee.lastName}`);
    return {
      success: true,
      data: employee
    };
  } catch (error) {
    console.error('Error in getEmployee service:', error.message);
    return {
      success: false,
      error: 'Failed to retrieve employee'
    };
  }
};

/**
 * Create a new employee
 * @param {Object} employeeData - New employee data
 * @returns {Object} Created employee data or error message
 */
const createEmployee = (employeeData) => {
  try {
    // Validate employee data
    const validation = validateEmployeeData(employeeData);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        details: validation.errors
      };
    }

    // Check if email already exists
    const existingEmployee = employees.find(emp =>
      emp.email.toLowerCase() === employeeData.email.toLowerCase().trim()
    );

    if (existingEmployee) {
      return {
        success: false,
        error: 'Employee with this email already exists'
      };
    }

    // Create new employee object
    const newEmployee = createEmployeeObject({
      ...employeeData,
      id: generateEmployeeId()
    });

    // Add to employees array
    employees.push(newEmployee);

    // Save to file
    const saveResult = saveEmployees(employees);
    if (!saveResult) {
      // Remove from array if save failed
      employees.pop();
      return {
        success: false,
        error: 'Failed to save employee data'
      };
    }

    console.log(`Created new employee: ${newEmployee.firstName} ${newEmployee.lastName}`);
    return {
      success: true,
      data: newEmployee,
      message: 'Employee created successfully'
    };
  } catch (error) {
    console.error('Error in createEmployee service:', error.message);
    return {
      success: false,
      error: 'Failed to create employee'
    };
  }
};

/**
 * Update an existing employee
 * @param {string} employeeId - Employee ID to update
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated employee data or error message
 */
const updateEmployee = (employeeId, updateData) => {
  try {
    // Validate input
    if (!employeeId || employeeId.trim() === '') {
      return {
        success: false,
        error: 'Employee ID is required'
      };
    }

    // Find employee index
    const employeeIndex = employees.findIndex(emp => emp.id === employeeId.trim());

    if (employeeIndex === -1) {
      return {
        success: false,
        error: 'Employee not found'
      };
    }

    // Get current employee data
    const currentEmployee = employees[employeeIndex];

    // Merge update data with current data
    const mergedData = {
      ...currentEmployee,
      ...updateData,
      id: currentEmployee.id, // Prevent ID changes
      createdAt: currentEmployee.createdAt // Prevent createdAt changes
    };

    // Validate merged data
    const validation = validateEmployeeData(mergedData);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        details: validation.errors
      };
    }

    // Check for email conflicts (excluding current employee)
    if (updateData.email) {
      const emailConflict = employees.find(emp =>
        emp.id !== employeeId &&
        emp.email.toLowerCase() === updateData.email.toLowerCase().trim()
      );

      if (emailConflict) {
        return {
          success: false,
          error: 'Employee with this email already exists'
        };
      }
    }

    // Create updated employee object
    const updatedEmployee = createEmployeeObject(mergedData);

    // Update in array
    employees[employeeIndex] = updatedEmployee;

    // Save to file
    const saveResult = saveEmployees(employees);
    if (!saveResult) {
      // Revert changes if save failed
      employees[employeeIndex] = currentEmployee;
      return {
        success: false,
        error: 'Failed to save employee data'
      };
    }

    console.log(`Updated employee: ${updatedEmployee.firstName} ${updatedEmployee.lastName}`);
    return {
      success: true,
      data: updatedEmployee,
      message: 'Employee updated successfully'
    };
  } catch (error) {
    console.error('Error in updateEmployee service:', error.message);
    return {
      success: false,
      error: 'Failed to update employee'
    };
  }
};

/**
 * Delete an employee (soft delete by changing status to inactive)
 * @param {string} employeeId - Employee ID to delete
 * @param {boolean} hardDelete - Whether to permanently delete (default: false)
 * @returns {Object} Success message or error
 */
const deleteEmployee = (employeeId, hardDelete = false) => {
  try {
    // Validate input
    if (!employeeId || employeeId.trim() === '') {
      return {
        success: false,
        error: 'Employee ID is required'
      };
    }

    // Find employee index
    const employeeIndex = employees.findIndex(emp => emp.id === employeeId.trim());

    if (employeeIndex === -1) {
      return {
        success: false,
        error: 'Employee not found'
      };
    }

    const employee = employees[employeeIndex];
    let deletedEmployee;

    if (hardDelete) {
      // Permanently remove from array
      deletedEmployee = employees.splice(employeeIndex, 1)[0];
      console.log(`Permanently deleted employee: ${employee.firstName} ${employee.lastName}`);
    } else {
      // Soft delete - change status to inactive
      employees[employeeIndex] = {
        ...employee,
        status: 'inactive',
        updatedAt: new Date().toISOString()
      };
      deletedEmployee = employees[employeeIndex];
      console.log(`Soft deleted employee: ${employee.firstName} ${employee.lastName}`);
    }

    // Save to file
    const saveResult = saveEmployees(employees);
    if (!saveResult) {
      if (hardDelete) {
        // Restore if save failed
        employees.splice(employeeIndex, 0, employee);
      } else {
        // Revert status change if save failed
        employees[employeeIndex] = employee;
      }
      return {
        success: false,
        error: 'Failed to save employee data'
      };
    }

    return {
      success: true,
      data: deletedEmployee,
      message: hardDelete ? 'Employee permanently deleted' : 'Employee deactivated successfully'
    };
  } catch (error) {
    console.error('Error in deleteEmployee service:', error.message);
    return {
      success: false,
      error: 'Failed to delete employee'
    };
  }
};

/**
 * Get employee statistics and summary data
 * @returns {Object} Employee statistics
 */
const getEmployeeStats = () => {
  try {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.status === 'active').length;
    const inactiveEmployees = employees.filter(emp => emp.status === 'inactive').length;

    // Department distribution
    const departmentStats = employees.reduce((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {});

    // Salary statistics
    const salaries = employees.map(emp => emp.salary).filter(salary => salary > 0);
    const avgSalary = salaries.length > 0 ? salaries.reduce((a, b) => a + b, 0) / salaries.length : 0;
    const minSalary = salaries.length > 0 ? Math.min(...salaries) : 0;
    const maxSalary = salaries.length > 0 ? Math.max(...salaries) : 0;

    // Recent hires (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentHires = employees.filter(emp => 
      new Date(emp.createdAt) >= thirtyDaysAgo
    ).length;

    console.log('Generated employee statistics');
    return {
      success: true,
      data: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: inactiveEmployees,
        recentHires,
        departments: departmentStats,
        salary: {
          average: Math.round(avgSalary),
          minimum: minSalary,
          maximum: maxSalary
        }
      }
    };
  } catch (error) {
    console.error('Error in getEmployeeStats service:', error.message);
    return {
      success: false,
      error: 'Failed to generate employee statistics'
    };
  }
};

/**
 * Bulk import employees from array
 * @param {Array} employeeList - Array of employee data objects
 * @returns {Object} Import results with success/failure counts
 */
const bulkImportEmployees = (employeeList) => {
  try {
    if (!Array.isArray(employeeList) || employeeList.length === 0) {
      return {
        success: false,
        error: 'Invalid employee list provided'
      };
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    employeeList.forEach((employeeData, index) => {
      const result = createEmployee(employeeData);
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        results.errors.push({
          index,
          data: employeeData,
          error: result.error,
          details: result.details
        });
      }
    });

    console.log(`Bulk import completed: ${results.successful} successful, ${results.failed} failed`);
    return {
      success: true,
      data: results,
      message: `Imported ${results.successful} employees successfully`
    };
  } catch (error) {
    console.error('Error in bulkImportEmployees service:', error.message);
    return {
      success: false,
      error: 'Failed to import employees'
    };
  }
};

// Export all service functions
export {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  bulkImportEmployees
};
