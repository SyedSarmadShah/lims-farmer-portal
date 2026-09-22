import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';


import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Navigate to previous location or dashboard after login
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

  const fillDemoCredentials = () => {
    setUsername('farmer1');
    setPassword('Farmer123!');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both your username and password.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await login({ username: username.trim(), password });
      setLoginSuccess(true);
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          status?: number;
          data?: { detail?: string; non_field_errors?: string[] };
        };
      };

      if (axiosError?.response?.status === 401) {
        setError('No active account found with these credentials. Please check your username and password, or register a new farmer account.');
      } else {
        const message =
          axiosError?.response?.data?.detail ||
          axiosError?.response?.data?.non_field_errors?.[0] ||
          'Unable to sign in. Please ensure the backend server is running.';
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-brand">
          <img
            src="/lims_logo.png"
            alt="LIMS Logo"
            style={{
              width: '46px',
              height: '46px',
              objectFit: 'contain',
              borderRadius: '8px',
            }}
          />

          <div className="auth-brand-text">
            <h2>LIMS Farmer Portal</h2>
            <p>Land Information Management System</p>
          </div>
        </div>

        <h1 className="auth-title">Farmer Sign In</h1>
        <p className="auth-subtitle">Enter your credentials to access your farm portal</p>

        {loginSuccess && (
          <div className="alert alert-success" role="alert">
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Sign in successful!</strong> Redirecting to your dashboard...
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        {/* Demo Account Quick-Fill Card */}
        <div
          style={{
            backgroundColor: 'var(--brand-accent-tint)',
            border: '1px solid var(--brand-accent)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            fontSize: '0.8125rem',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>
              Quick Demo Account:
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              <code>farmer1</code> / <code>Farmer123!</code>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fillDemoCredentials}
            disabled={submitting}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          >
            <KeyRound size={13} />
            <span>Use Demo</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="form-control"
              placeholder="e.g. farmer1"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              autoComplete="username"
              required
              disabled={submitting || loginSuccess}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              autoComplete="current-password"
              required
              disabled={submitting || loginSuccess}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting || loginSuccess}
            style={{ marginTop: '1.5rem', padding: '0.75rem' }}
          >
            {submitting ? (
              <>
                <div className="spinner spinner-sm" />
                <span>Signing in to portal...</span>
              </>
            ) : loginSuccess ? (
              <>
                <CheckCircle2 size={16} />
                <span>Signed In!</span>
              </>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account yet?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>
            Register as a new farmer
          </Link>
        </div>
      </div>
    </div>
  );
};
