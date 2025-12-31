import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/api';
import type { LoginResponse } from '../types';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await auth.login(username, password) as LoginResponse;

      // Store token and username
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('username', response.user.username);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        'Login failed. Please check your credentials.'
      );
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Multi-Location Monitoring</h1>
        <p className="login-subtitle">Unified Monitoring Platform</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            className="button button-primary"
            disabled={isLoading || !username || !password}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="login-footer">
          Monitoring system v1.0.0
        </p>
      </div>
    </div>
  );
}
