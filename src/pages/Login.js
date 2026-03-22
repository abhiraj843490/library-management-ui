import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    setTimeout(() => {
      const result = login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
      setLoading(false);
    }, 500);
  };

  const handleDemoAdmin = () => {
    setEmail('akash@gmail.com');
    setPassword('admin123');
  };

  const handleDemoStudent = () => {
    setEmail('aarav.kumar@email.com');
    setPassword('student1');
  };

  const handleDemoGirl = () => {
    setEmail('neha.patel@email.com');
    setPassword('student1');
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-header">
            <span className="nav-icon">📚</span>
            <h1>Genius Tech Library</h1>
            <p>Login to your account</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="demo-section">
            <p className="demo-title">📌 Demo Credentials</p>
            <div className="demo-buttons">
              <button
                type="button"
                className="demo-button demo-admin"
                onClick={handleDemoAdmin}
                disabled={loading}
              >
                👨‍💼 Admin
                <small>akash@gmail.com</small>
              </button>
              <button
                type="button"
                className="demo-button demo-student"
                onClick={handleDemoStudent}
                disabled={loading}
              >
                👨‍🎓 Student
                <small>aarav.kumar@email.com</small>
              </button>
              <button
                type="button"
                className="demo-button demo-student"
                onClick={handleDemoGirl}
                disabled={loading}
              >
                👩‍🎓 Student (Girl)
                <small>neha.patel@email.com</small>
              </button>
            </div>
          </div>

          <div className="credentials-info">
            <h4>Demo Accounts Available:</h4>
            <ul>
              <li>
                <strong>Admin Account:</strong>
                <br />
                Email: akash@gmail.com
                <br />
                Password: admin123
              </li>
              <li>
                <strong>Student Account (Boy):</strong>
                <br />
                Email: aarav.kumar@email.com
                <br />
                Password: student1
              </li>
              <li>
                <strong>Student Account (Girl):</strong>
                <br />
                Email: neha.patel@email.com
                <br />
                Password: student1
              </li>
            </ul>
          </div>
        </div>

        <div className="login-background">
          <div className="background-shape shape-1"></div>
          <div className="background-shape shape-2"></div>
          <div className="background-shape shape-3"></div>
        </div>
      </div>
    </div>
  );
}
