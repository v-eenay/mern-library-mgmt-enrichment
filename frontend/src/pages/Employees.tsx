import React from 'react';
import './Employees.css';

const Employees: React.FC = () => {
  // Mock employee data
  const employees = [
    {
      id: 1,
      name: 'John Doe',
      position: 'Software Engineer',
      department: 'Engineering',
      email: 'john.doe@company.com',
      phone: '+1 (555) 123-4567',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Jane Smith',
      position: 'Product Manager',
      department: 'Product',
      email: 'jane.smith@company.com',
      phone: '+1 (555) 234-5678',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      position: 'HR Specialist',
      department: 'Human Resources',
      email: 'mike.johnson@company.com',
      phone: '+1 (555) 345-6789',
      status: 'Active'
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      position: 'Marketing Manager',
      department: 'Marketing',
      email: 'sarah.wilson@company.com',
      phone: '+1 (555) 456-7890',
      status: 'On Leave'
    },
    {
      id: 5,
      name: 'David Brown',
      position: 'Finance Analyst',
      department: 'Finance',
      email: 'david.brown@company.com',
      phone: '+1 (555) 567-8901',
      status: 'Active'
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Employee Management</h1>
        <p className="page-subtitle">Manage and view all employee information</p>
        <div className="page-actions">
          <button className="btn btn-primary">Add New Employee</button>
          <button className="btn btn-secondary">Export Data</button>
        </div>
      </div>

      <div className="page-content">
          <div className="filters-section">
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Search employees..." 
                className="search-input"
              />
            </div>
            <div className="filter-controls">
              <select className="filter-select">
                <option value="">All Departments</option>
                <option value="engineering">Engineering</option>
                <option value="product">Product</option>
                <option value="hr">Human Resources</option>
                <option value="marketing">Marketing</option>
                <option value="finance">Finance</option>
              </select>
              <select className="filter-select">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="on-leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="employees-grid">
            {employees.map(employee => (
              <div key={employee.id} className="employee-card">
                <div className="employee-avatar">
                  <div className="avatar-placeholder">
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div className="employee-info">
                  <h3 className="employee-name">{employee.name}</h3>
                  <p className="employee-position">{employee.position}</p>
                  <p className="employee-department">{employee.department}</p>
                  <div className="employee-contact">
                    <p className="employee-email">{employee.email}</p>
                    <p className="employee-phone">{employee.phone}</p>
                  </div>
                  <div className="employee-status">
                    <span className={`status-badge ${employee.status.toLowerCase().replace(' ', '-')}`}>
                      {employee.status}
                    </span>
                  </div>
                </div>
                <div className="employee-actions">
                  <button className="btn-icon" title="View Profile">
                    👁️
                  </button>
                  <button className="btn-icon" title="Edit">
                    ✏️
                  </button>
                  <button className="btn-icon" title="Delete">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

        <div className="pagination">
          <button className="btn btn-secondary">Previous</button>
          <span className="pagination-info">Page 1 of 1</span>
          <button className="btn btn-secondary">Next</button>
        </div>
      </div>
    </div>
  );
};

export default Employees;
