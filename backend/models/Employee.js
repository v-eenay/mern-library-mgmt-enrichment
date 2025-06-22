const { v4: uuidv4 } = require('uuid');

// Demo employees data
let employees = [
  {
    id: uuidv4(),
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    phone: '+1-555-0123',
    position: 'Software Engineer',
    department: 'Engineering',
    salary: 75000,
    hireDate: '2023-01-15',
    status: 'active',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15')
  },
  {
    id: uuidv4(),
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@company.com',
    phone: '+1-555-0124',
    position: 'Product Manager',
    department: 'Product',
    salary: 85000,
    hireDate: '2022-08-20',
    status: 'active',
    createdAt: new Date('2022-08-20'),
    updatedAt: new Date('2022-08-20')
  },
  {
    id: uuidv4(),
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@company.com',
    phone: '+1-555-0125',
    position: 'HR Manager',
    department: 'Human Resources',
    salary: 70000,
    hireDate: '2022-03-10',
    status: 'active',
    createdAt: new Date('2022-03-10'),
    updatedAt: new Date('2022-03-10')
  },
  {
    id: uuidv4(),
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@company.com',
    phone: '+1-555-0126',
    position: 'Marketing Specialist',
    department: 'Marketing',
    salary: 60000,
    hireDate: '2023-05-12',
    status: 'active',
    createdAt: new Date('2023-05-12'),
    updatedAt: new Date('2023-05-12')
  }
];

module.exports = { employees };
