const fs = require('fs');
const path = require('path');

// Load departments data from JSON file
const loadDepartments = () => {
  try {
    const dataPath = path.join(__dirname, '../data/departments.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading departments data:', error);
    return [];
  }
};

// Save departments data to JSON file
const saveDepartments = (departments) => {
  try {
    const dataPath = path.join(__dirname, '../data/departments.json');
    fs.writeFileSync(dataPath, JSON.stringify(departments, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving departments data:', error);
    return false;
  }
};

let departments = loadDepartments();

module.exports = { departments, saveDepartments };
