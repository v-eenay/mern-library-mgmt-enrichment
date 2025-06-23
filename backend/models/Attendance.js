const fs = require('fs');
const path = require('path');

// Load attendance data from JSON file
const loadAttendance = () => {
  try {
    const dataPath = path.join(__dirname, '../data/attendance.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading attendance data:', error);
    return [];
  }
};

// Save attendance data to JSON file
const saveAttendance = (attendance) => {
  try {
    const dataPath = path.join(__dirname, '../data/attendance.json');
    fs.writeFileSync(dataPath, JSON.stringify(attendance, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving attendance data:', error);
    return false;
  }
};

let attendance = loadAttendance();

module.exports = { attendance, saveAttendance };
