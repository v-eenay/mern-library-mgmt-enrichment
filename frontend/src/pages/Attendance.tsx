import React, { useState } from 'react';
import './Attendance.css';

const Attendance: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Mock attendance data
  const todayAttendance = [
    {
      id: 1,
      name: 'John Doe',
      department: 'Engineering',
      clockIn: '09:00 AM',
      clockOut: '06:00 PM',
      status: 'Present',
      hoursWorked: '8.5'
    },
    {
      id: 2,
      name: 'Jane Smith',
      department: 'Product',
      clockIn: '08:45 AM',
      clockOut: '05:30 PM',
      status: 'Present',
      hoursWorked: '8.25'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      department: 'HR',
      clockIn: '09:15 AM',
      clockOut: '-',
      status: 'Present',
      hoursWorked: '6.5'
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      department: 'Marketing',
      clockIn: '-',
      clockOut: '-',
      status: 'Absent',
      hoursWorked: '0'
    },
    {
      id: 5,
      name: 'David Brown',
      department: 'Finance',
      clockIn: '08:30 AM',
      clockOut: '05:45 PM',
      status: 'Present',
      hoursWorked: '8.75'
    }
  ];

  const attendanceStats = {
    totalEmployees: 150,
    presentToday: 142,
    absentToday: 8,
    lateArrivals: 12,
    averageHours: 8.2
  };

  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="attendance-page">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">Attendance Management</h1>
          <p className="page-subtitle">Track and manage employee attendance</p>
          <div className="current-time">
            <span className="time-label">Current Time:</span>
            <span className="time-display">{currentTime}</span>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="container">
          {/* Quick Actions */}
          <div className="quick-actions">
            <div className="clock-section">
              <h3>Quick Clock In/Out</h3>
              <div className="clock-buttons">
                <button className="btn btn-success">Clock In</button>
                <button className="btn btn-danger">Clock Out</button>
                <button className="btn btn-warning">Break</button>
              </div>
            </div>
          </div>

          {/* Attendance Stats */}
          <div className="attendance-stats">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-number">{attendanceStats.totalEmployees}</div>
                <div className="stat-label">Total Employees</div>
              </div>
            </div>
            <div className="stat-card present">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-number">{attendanceStats.presentToday}</div>
                <div className="stat-label">Present Today</div>
              </div>
            </div>
            <div className="stat-card absent">
              <div className="stat-icon">❌</div>
              <div className="stat-content">
                <div className="stat-number">{attendanceStats.absentToday}</div>
                <div className="stat-label">Absent Today</div>
              </div>
            </div>
            <div className="stat-card late">
              <div className="stat-icon">⏰</div>
              <div className="stat-content">
                <div className="stat-number">{attendanceStats.lateArrivals}</div>
                <div className="stat-label">Late Arrivals</div>
              </div>
            </div>
            <div className="stat-card hours">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-number">{attendanceStats.averageHours}h</div>
                <div className="stat-label">Avg. Hours</div>
              </div>
            </div>
          </div>

          {/* Today's Attendance */}
          <div className="attendance-section">
            <div className="section-header">
              <h2>Today's Attendance</h2>
              <div className="section-actions">
                <button className="btn btn-secondary">Export Report</button>
                <button className="btn btn-primary">Mark Attendance</button>
              </div>
            </div>

            <div className="attendance-table">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Hours Worked</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAttendance.map(record => (
                    <tr key={record.id}>
                      <td className="employee-cell">
                        <div className="employee-info">
                          <div className="employee-avatar">
                            {record.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="employee-name">{record.name}</span>
                        </div>
                      </td>
                      <td>{record.department}</td>
                      <td className={record.clockIn === '-' ? 'absent-time' : ''}>
                        {record.clockIn}
                      </td>
                      <td className={record.clockOut === '-' ? 'pending-time' : ''}>
                        {record.clockOut}
                      </td>
                      <td>{record.hoursWorked}h</td>
                      <td>
                        <span className={`status-badge ${record.status.toLowerCase()}`}>
                          {record.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-icon" title="Edit">
                            ✏️
                          </button>
                          <button className="btn-icon" title="View Details">
                            👁️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attendance Calendar */}
          <div className="calendar-section">
            <h3>Attendance Calendar</h3>
            <div className="calendar-placeholder">
              <p>📅 Interactive calendar view would be implemented here</p>
              <p>Features: Monthly view, attendance patterns, holiday tracking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
