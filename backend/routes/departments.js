const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { departments } = require('../models/Department');

// GET /api/departments - Get all departments
router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedDepartments = departments.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedDepartments,
      pagination: {
        total: departments.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(departments.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/departments/:id - Get department by ID
router.get('/:id', (req, res) => {
  try {
    const department = departments.find(dept => dept.id === req.params.id);
    
    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    
    res.json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/departments - Create new department
router.post('/', (req, res) => {
  try {
    const {
      name,
      description,
      manager,
      budget
    } = req.body;
    
    // Basic validation
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, description'
      });
    }
    
    // Check if department with same name already exists
    const existingDepartment = departments.find(dept => 
      dept.name.toLowerCase() === name.toLowerCase()
    );
    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        error: 'Department with this name already exists'
      });
    }
    
    const newDepartment = {
      id: uuidv4(),
      name,
      description,
      manager: manager || '',
      employeeCount: 0,
      budget: budget || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    departments.push(newDepartment);
    
    res.status(201).json({ success: true, data: newDepartment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/departments/:id - Update department
router.put('/:id', (req, res) => {
  try {
    const departmentIndex = departments.findIndex(dept => dept.id === req.params.id);
    
    if (departmentIndex === -1) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    
    const {
      name,
      description,
      manager,
      employeeCount,
      budget
    } = req.body;
    
    // Check if department name already exists (excluding current department)
    if (name && name !== departments[departmentIndex].name) {
      const existingDepartment = departments.find(dept => 
        dept.name.toLowerCase() === name.toLowerCase() && dept.id !== req.params.id
      );
      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          error: 'Department with this name already exists'
        });
      }
    }
    
    // Update department
    departments[departmentIndex] = {
      ...departments[departmentIndex],
      name: name || departments[departmentIndex].name,
      description: description || departments[departmentIndex].description,
      manager: manager || departments[departmentIndex].manager,
      employeeCount: employeeCount !== undefined ? employeeCount : departments[departmentIndex].employeeCount,
      budget: budget !== undefined ? budget : departments[departmentIndex].budget,
      updatedAt: new Date()
    };
    
    res.json({ success: true, data: departments[departmentIndex] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/departments/:id - Delete department
router.delete('/:id', (req, res) => {
  try {
    const departmentIndex = departments.findIndex(dept => dept.id === req.params.id);
    
    if (departmentIndex === -1) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    
    const deletedDepartment = departments.splice(departmentIndex, 1)[0];
    
    res.json({ 
      success: true, 
      data: deletedDepartment, 
      message: 'Department deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/departments/stats/budget - Get department budget statistics
router.get('/stats/budget', (req, res) => {
  try {
    const stats = {
      totalBudget: departments.reduce((sum, dept) => sum + dept.budget, 0),
      averageBudget: departments.reduce((sum, dept) => sum + dept.budget, 0) / departments.length,
      totalEmployees: departments.reduce((sum, dept) => sum + dept.employeeCount, 0),
      departmentCount: departments.length,
      budgetByDepartment: departments.map(dept => ({
        name: dept.name,
        budget: dept.budget,
        employeeCount: dept.employeeCount
      }))
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
