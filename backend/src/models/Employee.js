/**
 * Employee Model
 * 
 * This module handles all employee data operations including:
 * - Loading employee data from JSON file
 * - Saving employee data to JSON file
 * - Providing employee data structure and validation
 * 
 * @author HRMS Development Team
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Employee data structure interface
 * @typedef {Object} Employee
 * @property {string} id - Unique employee identifier
 * @property {string} firstName - Employee's first name
 * @property {string} lastName - Employee's last name
 * @property {string} email - Employee's email address (unique)
 * @property {string} phone - Employee's phone number
 * @property {string} position - Employee's job position
 * @property {string} department - Employee's department
 * @property {number} salary - Employee's salary
 * @property {string} hireDate - Employee's hire date (YYYY-MM-DD)
 * @property {string} status - Employee's status (active/inactive)
 * @property {Date} createdAt - Record creation timestamp
 * @property {Date} updatedAt - Record last update timestamp
 */

/**
 * Load employees data from JSON file
 * @returns {Employee[]} Array of employee objects
 */
const loadEmployees = () => {
  try {
    // Construct path to employees.json file
    const dataPath = path.join(__dirname, '../../data/employees.json');
    
    // Check if file exists
    if (!fs.existsSync(dataPath)) {
      console.warn('Employee data file not found, returning empty array');
      return [];
    }
    
    // Read and parse JSON data
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const employees = JSON.parse(rawData);
    
    console.log(`Successfully loaded ${employees.length} employees from database`);
    return employees;
  } catch (error) {
    console.error('Error loading employees data:', error.message);
    return [];
  }
};

/**
 * Save employees data to JSON file
 * @param {Employee[]} employees - Array of employee objects to save
 * @returns {boolean} Success status of save operation
 */
const saveEmployees = (employees) => {
  try {
    // Construct path to employees.json file
    const dataPath = path.join(__dirname, '../../data/employees.json');
    
    // Ensure data directory exists
    const dataDir = path.dirname(dataPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Write formatted JSON data to file
    fs.writeFileSync(dataPath, JSON.stringify(employees, null, 2), 'utf8');
    
    console.log(`Successfully saved ${employees.length} employees to database`);
    return true;
  } catch (error) {
    console.error('Error saving employees data:', error.message);
    return false;
  }
};

/**
 * Validate employee data structure
 * @param {Object} employeeData - Employee data to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
const validateEmployeeData = (employeeData) => {
  const errors = [];
  
  // Required fields validation
  const requiredFields = ['firstName', 'lastName', 'email', 'position', 'department'];
  requiredFields.forEach(field => {
    if (!employeeData[field] || employeeData[field].trim() === '') {
      errors.push(`${field} is required`);
    }
  });
  
  // Email format validation
  if (employeeData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(employeeData.email)) {
      errors.push('Invalid email format');
    }
  }
  
  // Salary validation
  if (employeeData.salary !== undefined) {
    const salary = Number(employeeData.salary);
    if (isNaN(salary) || salary < 0) {
      errors.push('Salary must be a positive number');
    }
  }
  
  // Phone validation (optional but must be valid if provided)
  if (employeeData.phone && employeeData.phone.trim() !== '') {
    const phoneRegex = /^[\+]?[1-9]?[\d\s\-\(\)]{7,15}$/;
    if (!phoneRegex.test(employeeData.phone)) {
      errors.push('Invalid phone number format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Create a new employee object with default values
 * @param {Object} employeeData - Basic employee data
 * @returns {Employee} Complete employee object with timestamps
 */
const createEmployeeObject = (employeeData) => {
  const now = new Date();
  
  return {
    id: employeeData.id || generateEmployeeId(),
    firstName: employeeData.firstName?.trim() || '',
    lastName: employeeData.lastName?.trim() || '',
    email: employeeData.email?.toLowerCase().trim() || '',
    phone: employeeData.phone?.trim() || '',
    position: employeeData.position?.trim() || '',
    department: employeeData.department?.trim() || '',
    salary: Number(employeeData.salary) || 0,
    hireDate: employeeData.hireDate || now.toISOString().split('T')[0],
    status: employeeData.status || 'active',
    createdAt: employeeData.createdAt || now.toISOString(),
    updatedAt: now.toISOString()
  };
};

/**
 * Generate a unique employee ID
 * @returns {string} Unique employee identifier
 */
const generateEmployeeId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `emp-${timestamp}-${random}`;
};

// Load initial employee data
let employees = loadEmployees();

// Export all functions and data
export {
  employees,
  loadEmployees,
  saveEmployees,
  validateEmployeeData,
  createEmployeeObject,
  generateEmployeeId
};
