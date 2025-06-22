// Test file to demonstrate API endpoints
// You can run these tests using a tool like Postman or curl

const API_BASE = 'http://localhost:5000/api';

// Test data examples
const testEmployee = {
  firstName: 'Alice',
  lastName: 'Johnson',
  email: 'alice.johnson@company.com',
  phone: '+1-555-0127',
  position: 'UI/UX Designer',
  department: 'Design',
  salary: 65000
};

const testDepartment = {
  name: 'Design',
  description: 'User experience and interface design',
  manager: 'Alice Johnson',
  budget: 1000000
};

const testAttendance = {
  employeeId: 'some-employee-id',
  employeeName: 'Alice Johnson',
  date: '2024-06-22',
  clockIn: '09:15:00',
  clockOut: '17:45:00',
  status: 'present',
  notes: 'Regular working day'
};

// Example API calls using fetch (for browser testing)
const apiTests = {
  // Employee endpoints
  getAllEmployees: () => fetch(`${API_BASE}/employees`),
  getEmployeeById: (id) => fetch(`${API_BASE}/employees/${id}`),
  createEmployee: () => fetch(`${API_BASE}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testEmployee)
  }),
  updateEmployee: (id) => fetch(`${API_BASE}/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...testEmployee, salary: 70000 })
  }),
  deleteEmployee: (id) => fetch(`${API_BASE}/employees/${id}`, {
    method: 'DELETE'
  }),
  getEmployeeStats: () => fetch(`${API_BASE}/employees/stats/summary`),

  // Department endpoints
  getAllDepartments: () => fetch(`${API_BASE}/departments`),
  getDepartmentById: (id) => fetch(`${API_BASE}/departments/${id}`),
  createDepartment: () => fetch(`${API_BASE}/departments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testDepartment)
  }),
  updateDepartment: (id) => fetch(`${API_BASE}/departments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...testDepartment, budget: 1200000 })
  }),
  deleteDepartment: (id) => fetch(`${API_BASE}/departments/${id}`, {
    method: 'DELETE'
  }),
  getDepartmentStats: () => fetch(`${API_BASE}/departments/stats/budget`),

  // Attendance endpoints
  getAllAttendance: () => fetch(`${API_BASE}/attendance`),
  getAttendanceById: (id) => fetch(`${API_BASE}/attendance/${id}`),
  createAttendance: () => fetch(`${API_BASE}/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testAttendance)
  }),
  updateAttendance: (id) => fetch(`${API_BASE}/attendance/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clockOut: '18:00:00', notes: 'Extended hours' })
  }),
  deleteAttendance: (id) => fetch(`${API_BASE}/attendance/${id}`, {
    method: 'DELETE'
  }),
  clockIn: () => fetch(`${API_BASE}/attendance/clock-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      employeeId: 'test-employee-id', 
      employeeName: 'Test Employee' 
    })
  }),
  clockOut: () => fetch(`${API_BASE}/attendance/clock-out`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: 'test-employee-id' })
  }),
  getAttendanceStats: () => fetch(`${API_BASE}/attendance/stats/summary`)
};

// CURL commands for testing (copy and paste these in terminal)
const curlCommands = `
# Get all employees
curl http://localhost:5000/api/employees

# Create a new employee
curl -X POST http://localhost:5000/api/employees \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(testEmployee)}'

# Get all departments
curl http://localhost:5000/api/departments

# Create a new department
curl -X POST http://localhost:5000/api/departments \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(testDepartment)}'

# Get all attendance records
curl http://localhost:5000/api/attendance

# Clock in an employee
curl -X POST http://localhost:5000/api/attendance/clock-in \\
  -H "Content-Type: application/json" \\
  -d '{"employeeId": "test-employee-id", "employeeName": "Test Employee"}'

# Get employee statistics
curl http://localhost:5000/api/employees/stats/summary

# Get department budget statistics
curl http://localhost:5000/api/departments/stats/budget

# Get attendance statistics
curl http://localhost:5000/api/attendance/stats/summary

# Health check
curl http://localhost:5000/health
`;

console.log('API Test Examples:');
console.log('================');
console.log('Server URL:', API_BASE);
console.log('Test functions available in apiTests object');
console.log('CURL commands:');
console.log(curlCommands);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { apiTests, testEmployee, testDepartment, testAttendance };
}
