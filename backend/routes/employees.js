const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { employees, saveEmployees } = require('../models/Employee');

// GET /api/employees - Get all employees
router.get('/', (req, res) => {
  try {
    const { department, status, page = 1, limit = 10 } = req.query;
    
    let filteredEmployees = [...employees];
    
    // Filter by department
    if (department) {
      filteredEmployees = filteredEmployees.filter(emp => 
        emp.department.toLowerCase().includes(department.toLowerCase())
      );
    }
    
    // Filter by status
    if (status) {
      filteredEmployees = filteredEmployees.filter(emp => emp.status === status);
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedEmployees,
      pagination: {
        total: filteredEmployees.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(filteredEmployees.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/employees/:id - Get employee by ID
router.get('/:id', (req, res) => {
  try {
    const employee = employees.find(emp => emp.id === req.params.id);
    
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/employees - Create new employee
router.post('/', (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      salary,
      hireDate
    } = req.body;
    
    // Basic validation
    if (!firstName || !lastName || !email || !position || !department) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: firstName, lastName, email, position, department'
      });
    }
    
    // Check if email already exists
    const existingEmployee = employees.find(emp => emp.email === email);
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        error: 'Employee with this email already exists'
      });
    }
    
    const newEmployee = {
      id: uuidv4(),
      firstName,
      lastName,
      email,
      phone: phone || '',
      position,
      department,
      salary: salary || 0,
      hireDate: hireDate || new Date().toISOString().split('T')[0],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
      employees.push(newEmployee);
    saveEmployees(employees);
    
    res.status(201).json({ success: true, data: newEmployee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', (req, res) => {
  try {
    const employeeIndex = employees.findIndex(emp => emp.id === req.params.id);
    
    if (employeeIndex === -1) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    
    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      salary,
      status
    } = req.body;
    
    // Check if email already exists (excluding current employee)
    if (email && email !== employees[employeeIndex].email) {
      const existingEmployee = employees.find(emp => emp.email === email && emp.id !== req.params.id);
      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          error: 'Employee with this email already exists'
        });
      }
    }
      // Update employee
    employees[employeeIndex] = {
      ...employees[employeeIndex],
      firstName: firstName || employees[employeeIndex].firstName,
      lastName: lastName || employees[employeeIndex].lastName,
      email: email || employees[employeeIndex].email,
      phone: phone || employees[employeeIndex].phone,
      position: position || employees[employeeIndex].position,
      department: department || employees[employeeIndex].department,
      salary: salary || employees[employeeIndex].salary,
      status: status || employees[employeeIndex].status,
      updatedAt: new Date()
    };

    saveEmployees(employees);
    
    res.json({ success: true, data: employees[employeeIndex] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/employees/:id - Delete employee
router.delete('/:id', (req, res) => {
  try {
    const employeeIndex = employees.findIndex(emp => emp.id === req.params.id);
    
    if (employeeIndex === -1) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
      const deletedEmployee = employees.splice(employeeIndex, 1)[0];
    saveEmployees(employees);
    
    res.json({ success: true, data: deletedEmployee, message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/employees/stats/summary - Get employee statistics
router.get('/stats/summary', (req, res) => {
  try {
    const stats = {
      total: employees.length,
      active: employees.filter(emp => emp.status === 'active').length,
      inactive: employees.filter(emp => emp.status === 'inactive').length,
      departments: [...new Set(employees.map(emp => emp.department))].length,
      averageSalary: employees.reduce((sum, emp) => sum + emp.salary, 0) / employees.length
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
