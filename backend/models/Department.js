const { v4: uuidv4 } = require('uuid');

// Demo departments data
let departments = [
  {
    id: uuidv4(),
    name: 'Engineering',
    description: 'Software development and technical operations',
    manager: 'John Doe',
    employeeCount: 15,
    budget: 2500000,
    createdAt: new Date('2022-01-01'),
    updatedAt: new Date('2022-01-01')
  },
  {
    id: uuidv4(),
    name: 'Human Resources',
    description: 'Employee relations and organizational development',
    manager: 'Mike Johnson',
    employeeCount: 5,
    budget: 800000,
    createdAt: new Date('2022-01-01'),
    updatedAt: new Date('2022-01-01')
  },
  {
    id: uuidv4(),
    name: 'Marketing',
    description: 'Brand promotion and customer acquisition',
    manager: 'Sarah Wilson',
    employeeCount: 8,
    budget: 1200000,
    createdAt: new Date('2022-01-01'),
    updatedAt: new Date('2022-01-01')
  },
  {
    id: uuidv4(),
    name: 'Product',
    description: 'Product strategy and management',
    manager: 'Jane Smith',
    employeeCount: 12,
    budget: 1800000,
    createdAt: new Date('2022-01-01'),
    updatedAt: new Date('2022-01-01')
  },
  {
    id: uuidv4(),
    name: 'Finance',
    description: 'Financial planning and accounting',
    manager: 'Robert Brown',
    employeeCount: 6,
    budget: 900000,
    createdAt: new Date('2022-01-01'),
    updatedAt: new Date('2022-01-01')
  }
];

module.exports = { departments };
