import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Auth.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-logo">
              <span className="logo-letter-auth">A</span>
            </div>
            <h1>Check Your Email</h1>
            <p>If an account exists with that email, we've sent password reset instructions.</p>
          </div>

          <div className="auth-success-message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
            <p>Please check your inbox and spam folder. The link will expire in 1 hour.</p>
          </div>

          <div className="auth-footer">
            <Link to="/login">Back to Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-letter-auth">A</span>
          </div>
          <h1>Forgot Password?</h1>
          <p>Enter your email to receive reset instructions</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Remember your password?</span>
          <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
