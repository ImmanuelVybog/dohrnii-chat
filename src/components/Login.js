import { useState } from 'react';
import './Login.css';
import dohrniiLogo from '../assets/images/Dohrnii Logo.svg';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const mockUsers = [
    { id: 1, username: 'dr.smith', password: 'password123', name: 'Dr. Smith', role: 'Physician' },
    { id: 2, username: 'dr.johnson', password: 'password123', name: 'Dr. Johnson', role: 'Cardiologist' },
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
      <div className="login-wrapper">
        <div className="login-image-section">
          <div className="login-image-content">
            <h2>Clinical clarity,</h2>
            <h2>powered by intelligence.</h2>
            <p>Evidence-based insights at the point of care. Designed for clinicians who demand precision.</p>
          </div>
        </div>
        <div className="login-container">
          <div className="login-content">
            <div className="login-header">
              <img src={dohrniiLogo} alt="Dohrnii Logo" className="login-logo" />
              <h1>Welcome back</h1>
              <p>Sign in to access your clinical workspace</p>
            </div>
            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter your username"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="login-form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle-button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
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
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </form>
            <div className="demo-section">
              <h3 style={{ margin: '4px' }}>Demo Accounts</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.55)', marginTop: '8px' }}>Click to auto-fill credentials</p>
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
      </div>
    </div>
  );
};

export default Login;