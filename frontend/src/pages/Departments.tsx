import React from 'react';
import './Departments.css';

const Departments: React.FC = () => {
  // Mock department data
  const departments = [
    {
      id: 1,
      name: 'Engineering',
      description: 'Software development and technical solutions',
      manager: 'John Smith',
      employeeCount: 45,
      budget: '$2,500,000',
      established: '2018'
    },
    {
      id: 2,
      name: 'Human Resources',
      description: 'Employee relations and organizational development',
      manager: 'Sarah Johnson',
      employeeCount: 8,
      budget: '$500,000',
      established: '2015'
    },
    {
      id: 3,
      name: 'Marketing',
      description: 'Brand management and customer acquisition',
      manager: 'Mike Wilson',
      employeeCount: 15,
      budget: '$1,200,000',
      established: '2016'
    },
    {
      id: 4,
      name: 'Finance',
      description: 'Financial planning and accounting services',
      manager: 'Emma Davis',
      employeeCount: 12,
      budget: '$800,000',
      established: '2015'
    },
    {
      id: 5,
      name: 'Product',
      description: 'Product strategy and user experience design',
      manager: 'Alex Chen',
      employeeCount: 20,
      budget: '$1,800,000',
      established: '2017'
    },
    {
      id: 6,
      name: 'Sales',
      description: 'Revenue generation and client relationships',
      manager: 'Lisa Anderson',
      employeeCount: 25,
      budget: '$3,000,000',
      established: '2015'
    }
  ];

  return (
    <div className="departments-page">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">Department Management</h1>
          <p className="page-subtitle">Organize and manage company departments</p>
          <div className="page-actions">
            <button className="btn btn-primary">Add New Department</button>
            <button className="btn btn-secondary">Generate Report</button>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="container">
          <div className="department-stats">
            <div className="stat-card">
              <div className="stat-icon">🏢</div>
              <div className="stat-content">
                <div className="stat-number">{departments.length}</div>
                <div className="stat-label">Total Departments</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-number">
                  {departments.reduce((sum, dept) => sum + dept.employeeCount, 0)}
                </div>
                <div className="stat-label">Total Employees</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-number">$9.8M</div>
                <div className="stat-label">Total Budget</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-number">92%</div>
                <div className="stat-label">Efficiency Rate</div>
              </div>
            </div>
          </div>

          <div className="departments-grid">
            {departments.map(department => (
              <div key={department.id} className="department-card">
                <div className="department-header">
                  <h3 className="department-name">{department.name}</h3>
                  <div className="department-actions">
                    <button className="btn-icon" title="View Details">
                      👁️
                    </button>
                    <button className="btn-icon" title="Edit">
                      ✏️
                    </button>
                    <button className="btn-icon" title="Settings">
                      ⚙️
                    </button>
                  </div>
                </div>
                
                <p className="department-description">{department.description}</p>
                
                <div className="department-details">
                  <div className="detail-item">
                    <span className="detail-label">Manager:</span>
                    <span className="detail-value">{department.manager}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Employees:</span>
                    <span className="detail-value">{department.employeeCount}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Budget:</span>
                    <span className="detail-value">{department.budget}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Established:</span>
                    <span className="detail-value">{department.established}</span>
                  </div>
                </div>

                <div className="department-footer">
                  <button className="btn btn-outline">View Employees</button>
                  <button className="btn btn-outline">View Reports</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Departments;
