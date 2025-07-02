# HRMS Employee API Documentation

## Overview

The HRMS Employee API provides comprehensive employee management functionality including CRUD operations, advanced search, filtering, statistics, and bulk operations. The API is built with a modular architecture separating concerns into controllers, services, models, and validation layers.

## API Structure

```
backend/src/
├── controllers/employeeController.js  # HTTP request handlers
├── services/employeeService.js        # Business logic layer
├── models/Employee.js                 # Data models and persistence
├── validations/employeeValidation.js  # Request validation middleware
└── routes/
    ├── index.js                       # Main routes registration
    └── employeeRoutes.js             # Employee-specific routes
```

## Base URL

All API endpoints are prefixed with `/api`

Example: `http://localhost:5000/api/employees`

## Endpoints

### 1. Health Check
- **GET** `/api/health`
- Check if API is running
- **Response**: `{ success: true, message: "HRMS API is running successfully" }`

### 2. API Information
- **GET** `/api/info`
- Get information about available endpoints
- **Response**: Complete API documentation

### 3. Get All Employees
- **GET** `/api/employees`
- **Query Parameters**:
  - `department` (string): Filter by department
  - `status` (string): Filter by status (active/inactive)
  - `search` (string): Search in name, email, position
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 10)
  - `sortBy` (string): Field to sort by (default: 'name')
  - `sortOrder` (string): Sort direction (asc/desc, default: 'asc')

**Example**: `/api/employees?department=Engineering&status=active&page=1&limit=5`

### 4. Get Employee Statistics
- **GET** `/api/employees/stats`
- Get dashboard statistics (total employees, by department, etc.)

### 5. Search Employees
- **GET** `/api/employees/search`
- **Query Parameters**:
  - `q` or `query` (string): Search query
  - `department` (string): Filter by department
  - `position` (string): Filter by position
  - `status` (string): Filter by status
  - `dateFrom` (string): Filter by date range start
  - `dateTo` (string): Filter by date range end
  - `salaryMin` (number): Minimum salary filter
  - `salaryMax` (number): Maximum salary filter

### 6. Export Employees
- **GET** `/api/employees/export`
- **Query Parameters**:
  - `format` (string): Export format (json/csv, default: json)
  - `department` (string): Filter by department
  - `status` (string): Filter by status
  - `dateFrom` (string): Date range start
  - `dateTo` (string): Date range end

### 7. Get Employee by ID
- **GET** `/api/employees/:id`
- **Parameters**: `id` (string): Employee ID (format: emp-xxxxx)

### 8. Create Employee
- **POST** `/api/employees`
- **Body**: Employee object (see Employee Schema below)

### 9. Bulk Import Employees
- **POST** `/api/employees/bulk-import`
- **Body**: 
```json
{
  "employees": [
    { /* employee object 1 */ },
    { /* employee object 2 */ }
  ]
}
```

### 10. Update Employee
- **PUT** `/api/employees/:id`
- **Parameters**: `id` (string): Employee ID
- **Body**: Partial employee object with fields to update

### 11. Delete Employee
- **DELETE** `/api/employees/:id`
- **Parameters**: `id` (string): Employee ID

## Employee Schema

```json
{
  "id": "emp-12345",                    // Auto-generated
  "name": "John Doe",                   // Required
  "email": "john.doe@company.com",      // Required, unique
  "phone": "+1-555-0123",              // Required
  "address": "123 Main St, City, State", // Required
  "position": "Software Engineer",      // Required
  "department": "Engineering",          // Required
  "dateOfJoining": "2024-01-15",       // Required (YYYY-MM-DD)
  "salary": 75000,                     // Required, number
  "status": "active",                  // Required (active/inactive)
  "emergencyContact": {                // Required
    "name": "Jane Doe",
    "phone": "+1-555-0124",
    "relationship": "Spouse"
  },
  "createdAt": "2024-01-15T10:30:00.000Z", // Auto-generated
  "updatedAt": "2024-01-15T10:30:00.000Z"  // Auto-updated
}
```

## Response Format

All API responses follow a standardized format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "pagination": { /* pagination info for list endpoints */ },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Validation

The API includes comprehensive validation for:

- **Employee ID**: Must follow format `emp-xxxxx`
- **Email**: Must be valid email format and unique
- **Phone**: Must be valid phone number format
- **Date fields**: Must be valid ISO date format
- **Required fields**: All required fields must be present
- **Data types**: Salary must be number, status must be valid enum, etc.

## Error Codes

- `MISSING_EMPLOYEE_ID`: Employee ID not provided
- `INVALID_EMPLOYEE_ID_FORMAT`: Employee ID format invalid
- `EMPLOYEE_NOT_FOUND`: Employee with given ID not found
- `DUPLICATE_EMAIL`: Employee with email already exists
- `VALIDATION_ERROR`: Request data validation failed
- `MISSING_REQUIRED_FIELD`: Required field not provided
- `INVALID_DATA_TYPE`: Field has wrong data type

## Example Usage

### Create Employee
```bash
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john.smith@company.com",
    "phone": "+1-555-0199",
    "address": "456 Oak Ave, City, State",
    "position": "Frontend Developer",
    "department": "Engineering",
    "dateOfJoining": "2024-02-01",
    "salary": 70000,
    "status": "active",
    "emergencyContact": {
      "name": "Mary Smith",
      "phone": "+1-555-0198",
      "relationship": "Wife"
    }
  }'
```

### Get Employees with Filtering
```bash
curl "http://localhost:5000/api/employees?department=Engineering&status=active&page=1&limit=10"
```

### Search Employees
```bash
curl "http://localhost:5000/api/employees/search?q=developer&department=Engineering&salaryMin=60000"
```

## Development Notes

- All controller functions include comprehensive error handling
- Request validation is performed by middleware before reaching controllers
- Service layer handles all business logic and data processing
- Model layer manages data persistence and validation
- All operations include proper logging for debugging
- API supports CORS for frontend integration

## Testing

Use tools like Postman, curl, or any HTTP client to test the endpoints. The API includes health check endpoints to verify connectivity before testing main functionality.
