# HRMS Backend API

A RESTful API for Human Resource Management System built with Express.js.

## Features

- Employee Management (CRUD operations)
- Department Management (CRUD operations)
- Attendance Tracking (CRUD operations)
- Clock-in/Clock-out functionality
- Statistics and reporting endpoints
- Input validation and error handling
- Pagination support

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/employees` | Get all employees (with pagination and filters) |
| GET | `/employees/:id` | Get employee by ID |
| POST | `/employees` | Create new employee |
| PUT | `/employees/:id` | Update employee |
| DELETE | `/employees/:id` | Delete employee |
| GET | `/employees/stats/summary` | Get employee statistics |

#### Query Parameters for GET /employees:
- `department` - Filter by department
- `status` - Filter by status (active/inactive)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

#### Employee Object Structure:
```json
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "phone": "+1-555-0123",
  "position": "Software Engineer",
  "department": "Engineering",
  "salary": 75000,
  "hireDate": "2023-01-15",
  "status": "active",
  "createdAt": "2023-01-15T00:00:00.000Z",
  "updatedAt": "2023-01-15T00:00:00.000Z"
}
```

### Departments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/departments` | Get all departments (with pagination) |
| GET | `/departments/:id` | Get department by ID |
| POST | `/departments` | Create new department |
| PUT | `/departments/:id` | Update department |
| DELETE | `/departments/:id` | Delete department |
| GET | `/departments/stats/budget` | Get department budget statistics |

#### Department Object Structure:
```json
{
  "id": "uuid",
  "name": "Engineering",
  "description": "Software development and technical operations",
  "manager": "John Doe",
  "employeeCount": 15,
  "budget": 2500000,
  "createdAt": "2022-01-01T00:00:00.000Z",
  "updatedAt": "2022-01-01T00:00:00.000Z"
}
```

### Attendance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/attendance` | Get all attendance records (with filters and pagination) |
| GET | `/attendance/:id` | Get attendance record by ID |
| POST | `/attendance` | Create new attendance record |
| PUT | `/attendance/:id` | Update attendance record |
| DELETE | `/attendance/:id` | Delete attendance record |
| POST | `/attendance/clock-in` | Clock in an employee |
| POST | `/attendance/clock-out` | Clock out an employee |
| GET | `/attendance/stats/summary` | Get attendance statistics |

#### Query Parameters for GET /attendance:
- `employeeId` - Filter by employee ID
- `date` - Filter by specific date (YYYY-MM-DD)
- `startDate` & `endDate` - Filter by date range
- `status` - Filter by status (present/absent)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

#### Attendance Object Structure:
```json
{
  "id": "uuid",
  "employeeId": "employee-uuid",
  "employeeName": "John Doe",
  "date": "2024-06-22",
  "clockIn": "09:00:00",
  "clockOut": "17:30:00",
  "totalHours": 8.5,
  "status": "present",
  "notes": "Regular working day",
  "createdAt": "2024-06-22T09:00:00.000Z",
  "updatedAt": "2024-06-22T17:30:00.000Z"
}
```

## Example API Calls

### Create a new employee:
```bash
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alice",
    "lastName": "Johnson",
    "email": "alice.johnson@company.com",
    "phone": "+1-555-0127",
    "position": "Designer",
    "department": "Design",
    "salary": 65000
  }'
```

### Clock in an employee:
```bash
curl -X POST http://localhost:5000/api/attendance/clock-in \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "employee-uuid",
    "employeeName": "John Doe"
  }'
```

### Get employee statistics:
```bash
curl http://localhost:5000/api/employees/stats/summary
```

## Response Format

All API responses follow this format:

### Success Response:
```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... } // Only for paginated endpoints
}
```

### Error Response:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Error Handling

The API includes comprehensive error handling for:
- Validation errors (400 Bad Request)
- Not found errors (404 Not Found)
- Server errors (500 Internal Server Error)

## Development

### Available Scripts:
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Dependencies:
- Express.js - Web framework
- CORS - Cross-origin resource sharing
- dotenv - Environment variables
- uuid - UUID generation

## Notes

- This is a demo API using in-memory storage
- Data will be reset when the server restarts
- For production use, integrate with a proper database (MongoDB, PostgreSQL, etc.)
- Add authentication and authorization middleware
- Implement proper logging and monitoring
