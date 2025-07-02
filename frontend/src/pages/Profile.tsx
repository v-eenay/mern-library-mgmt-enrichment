import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    role: user?.role || '',
    department: user?.department || '',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, City, State 12345',
    dateOfBirth: '1990-01-15',
    hireDate: '2022-03-15',
    emergencyContact: 'Jane Doe - +1 (555) 987-6543',
    skills: 'JavaScript, React, Node.js, TypeScript',
    bio: 'Experienced software developer with a passion for creating efficient and scalable web applications.'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // In a real application, this would save to the backend
    console.log('Saving profile data:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      role: user?.role || '',
      department: user?.department || '',
      phone: '+1 (555) 123-4567',
      address: '123 Main Street, City, State 12345',
      dateOfBirth: '1990-01-15',
      hireDate: '2022-03-15',
      emergencyContact: 'Jane Doe - +1 (555) 987-6543',
      skills: 'JavaScript, React, Node.js, TypeScript',
      bio: 'Experienced software developer with a passion for creating efficient and scalable web applications.'
    });
    setIsEditing(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">User Profile</h1>
        <p className="page-subtitle">Manage your personal information and account settings</p>
      </div>

      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="profile-avatar">
            <div className="avatar-placeholder">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <h3 className="profile-name">{user?.firstName} {user?.lastName}</h3>
            <p className="profile-role">{user?.role}</p>
            <p className="profile-department">{user?.department}</p>
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-label">Employee ID</span>
              <span className="stat-value">{user?.id}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Status</span>
              <span className="stat-value status-active">Active</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Hire Date</span>
              <span className="stat-value">March 15, 2022</span>
            </div>
          </div>
        </div>

        <div className="profile-main">
          <div className="profile-section">
            <div className="section-header">
              <h2>Personal Information</h2>
              {!isEditing ? (
                <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="btn btn-success btn-sm" onClick={handleSave}>
                    Save Changes
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  ) : (
                    <div className="form-display">{formData.firstName}</div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  ) : (
                    <div className="form-display">{formData.lastName}</div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  ) : (
                    <div className="form-display">{formData.email}</div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  ) : (
                    <div className="form-display">{formData.phone}</div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                ) : (
                  <div className="form-display">{formData.address}</div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  ) : (
                    <div className="form-display">{new Date(formData.dateOfBirth).toLocaleDateString()}</div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Emergency Contact</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  ) : (
                    <div className="form-display">{formData.emergencyContact}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2>Professional Information</h2>
            <div className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <div className="form-display">{formData.role}</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <div className="form-display">{formData.department}</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Skills</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter skills separated by commas"
                  />
                ) : (
                  <div className="form-display">{formData.skills}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Bio</label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="form-input form-textarea"
                    rows={4}
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <div className="form-display">{formData.bio}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
