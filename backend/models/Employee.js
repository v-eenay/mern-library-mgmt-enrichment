const fs = require('fs');
const path = require('path');

// Load employees data from JSON file
const loadEmployees = () => {
  try {
    const dataPath = path.join(__dirname, '../data/employees.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading employees data:', error);
    return [];
  }
};

// Save employees data to JSON file
const saveEmployees = (employees) => {
  try {
    const dataPath = path.join(__dirname, '../data/employees.json');
    fs.writeFileSync(dataPath, JSON.stringify(employees, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving employees data:', error);
    return false;
  }
};

let employees = loadEmployees();

module.exports = { employees, saveEmployees };
