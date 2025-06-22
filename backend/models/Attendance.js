const { v4: uuidv4 } = require('uuid');

// Demo attendance data
let attendance = [
  {
    id: uuidv4(),
    employeeId: 'john-doe-id',
    employeeName: 'John Doe',
    date: '2024-06-22',
    clockIn: '09:00:00',
    clockOut: '17:30:00',
    totalHours: 8.5,
    status: 'present',
    notes: 'Regular working day',
    createdAt: new Date('2024-06-22T09:00:00'),
    updatedAt: new Date('2024-06-22T17:30:00')
  },
  {
    id: uuidv4(),
    employeeId: 'jane-smith-id',
    employeeName: 'Jane Smith',
    date: '2024-06-22',
    clockIn: '08:45:00',
    clockOut: '17:15:00',
    totalHours: 8.5,
    status: 'present',
    notes: 'Early arrival',
    createdAt: new Date('2024-06-22T08:45:00'),
    updatedAt: new Date('2024-06-22T17:15:00')
  },
  {
    id: uuidv4(),
    employeeId: 'mike-johnson-id',
    employeeName: 'Mike Johnson',
    date: '2024-06-22',
    clockIn: '09:15:00',
    clockOut: '18:00:00',
    totalHours: 8.75,
    status: 'present',
    notes: 'Extended hours for project',
    createdAt: new Date('2024-06-22T09:15:00'),
    updatedAt: new Date('2024-06-22T18:00:00')
  },
  {
    id: uuidv4(),
    employeeId: 'sarah-wilson-id',
    employeeName: 'Sarah Wilson',
    date: '2024-06-22',
    clockIn: null,
    clockOut: null,
    totalHours: 0,
    status: 'absent',
    notes: 'Sick leave',
    createdAt: new Date('2024-06-22T00:00:00'),
    updatedAt: new Date('2024-06-22T00:00:00')
  },
  {
    id: uuidv4(),
    employeeId: 'john-doe-id',
    employeeName: 'John Doe',
    date: '2024-06-21',
    clockIn: '09:05:00',
    clockOut: '17:35:00',
    totalHours: 8.5,
    status: 'present',
    notes: 'Regular working day',
    createdAt: new Date('2024-06-21T09:05:00'),
    updatedAt: new Date('2024-06-21T17:35:00')
  }
];

module.exports = { attendance };
