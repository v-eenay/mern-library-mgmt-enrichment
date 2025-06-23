import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password');
    }
  };

  const handleDemoLogin = (userType: 'admin' | 'employee' | 'manager' | 'hr' | 'marketing') => {
    const demoCredentials = {
      admin: { email: 'admin@company.com', password: 'password123' },
      employee: { email: 'john.doe@company.com', password: 'password123' },
      manager: { email: 'jane.smith@company.com', password: 'password123' },
      hr: { email: 'mike.johnson@company.com', password: 'password123' },
      marketing: { email: 'sarah.wilson@company.com', password: 'password123' }
    };

    const credentials = demoCredentials[userType];
    setEmail(credentials.email);
    setPassword(credentials.password);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>HRMS Login</h1>
          <p>Human Resource Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-section">
          <button 
            type="button" 
            className="demo-toggle"
            onClick={() => setShowDemo(!showDemo)}
          >
            {showDemo ? 'Hide' : 'Show'} Demo Accounts
          </button>
          
          {showDemo && (
            <div className="demo-accounts">
              <h3>Demo Accounts</h3>
              <p className="demo-password">All accounts use password: <strong>password123</strong></p>
              <div className="demo-buttons">
                <button 
                  type="button"
                  className="demo-btn admin"
                  onClick={() => handleDemoLogin('admin')}
                >
                  <strong>Admin User</strong>
                  <small>admin@company.com</small>
                </button>
                <button 
                  type="button"
                  className="demo-btn manager"
                  onClick={() => handleDemoLogin('manager')}
                >
                  <strong>Product Manager</strong>
                  <small>jane.smith@company.com</small>
                </button>
                <button 
                  type="button"
                  className="demo-btn hr"
                  onClick={() => handleDemoLogin('hr')}
                >
                  <strong>HR Manager</strong>
                  <small>mike.johnson@company.com</small>
                </button>
                <button 
                  type="button"
                  className="demo-btn employee"
                  onClick={() => handleDemoLogin('employee')}
                >
                  <strong>Software Engineer</strong>
                  <small>john.doe@company.com</small>
                </button>
                <button 
                  type="button"
                  className="demo-btn marketing"
                  onClick={() => handleDemoLogin('marketing')}
                >
                  <strong>Marketing Specialist</strong>
                  <small>sarah.wilson@company.com</small>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="login-footer">
          <p>&copy; 2024 HRMS. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
