import React, { useState } from 'react';
import './Login.css';
import dohrniiLogo from '../assets/images/Dohrnii Logo.svg';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const mockUsers = [
    { id: 1, username: 'dr.smith', password: 'password123', name: 'Dr. Smith', role: 'Physician' },
    { id: 2, username: 'dr.johnson', password: 'password123', name: 'Dr. Johnson', role: 'Cardiologist' },
    { id: 3, username: 'dr.williams', password: 'password123', name: 'Dr. Williams', role: 'Neurologist' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const user = mockUsers.find(
        u => u.username === credentials.username && u.password === credentials.password
      );

      if (user) {
        onLogin({
          id: user.id,
          name: user.name,
          role: user.role,
          username: user.username
        });
      } else {
        setError('Invalid username or password');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleDemoLogin = (username) => {
    const user = mockUsers.find(u => u.username === username);
    if (user) {
      setCredentials({ username: user.username, password: 'password123' });
    }
  };

  return (
    <div className="login">
      <div className="login-container">
        <div className="login-header">
          <img src={dohrniiLogo} alt="Dohrnii Logo" className="login-logo" />
          <h1>Medical AI Assistant</h1>
          <p>Evidence-based medical answers for healthcare professionals</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter your username"
              required
              disabled={isLoading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="login-button"
          >
            {isLoading ? (
              <span className="loading-indicator">
                <div className="spinner"></div>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="demo-section">
          <h3 style={{ margin: '4px' }}>Demo Accounts</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.55)' }}>Click to auto-fill credentials:</p>
          <div className="demo-buttons">
            {mockUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleDemoLogin(user.username)}
                className="demo-button"
                disabled={isLoading}
              >
                <div className="demo-user-info">
                  <strong>{user.name}</strong>
                  <small>{user.role}</small>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;