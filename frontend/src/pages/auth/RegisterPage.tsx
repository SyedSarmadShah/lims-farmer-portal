import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';


import { useAuth } from '../../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const topRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cnic: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalErrors, setGeneralErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const errorList: string[] = [];

    if (!formData.username.trim()) {
      errors.username = 'Username is required.';
      errorList.push('Username is required.');
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters.';
      errorList.push('Username must be at least 3 characters.');
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required.';
      errorList.push('Email is required.');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address.';
      errorList.push('Please enter a valid email address.');
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
      errorList.push('Password is required.');
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
      errorList.push('Password must be at least 8 characters long.');
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
      errorList.push('Passwords do not match.');
    }

    if (formData.cnic && formData.cnic.trim().length > 15) {
      errors.cnic = 'CNIC cannot exceed 15 characters.';
      errorList.push('CNIC cannot exceed 15 characters.');
    }

    if (formData.phone && formData.phone.trim().length > 20) {
      errors.phone = 'Phone number cannot exceed 20 characters.';
      errorList.push('Phone number cannot exceed 20 characters.');
    }

    setFieldErrors(errors);
    setGeneralErrors(errorList);
    if (errorList.length > 0) {
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    return errorList.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralErrors([]);

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        cnic: formData.cnic.trim() || undefined,
      });

      setRegisteredSuccess(true);
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          data?: Record<string, string[] | string>;
        };
      };

      const collectedErrors: string[] = [];
      const newFieldErrors: Record<string, string> = {};

      if (axiosError?.response?.data && typeof axiosError.response.data === 'object') {
        const data = axiosError.response.data;

        Object.entries(data).forEach(([key, val]) => {
          const message = Array.isArray(val) ? val.join(' ') : String(val);
          if (['username', 'email', 'password', 'phone', 'cnic'].includes(key)) {
            newFieldErrors[key] = message;
            collectedErrors.push(`${key.toUpperCase()}: ${message}`);
          } else {
            collectedErrors.push(`${key}: ${message}`);
          }
        });

        setFieldErrors(newFieldErrors);
        if (collectedErrors.length === 0) {
          collectedErrors.push('Registration failed. Please verify your details.');
        }
      } else {
        collectedErrors.push('Unable to connect to server. Please check your backend connection.');
      }

      setGeneralErrors(collectedErrors);
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ padding: '2.5rem 1rem' }}>
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <div ref={topRef} />
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

        <h1 className="auth-title">Register Farmer Account</h1>
        <p className="auth-subtitle">Join the portal to map, monitor, and analyze your farmlands</p>

        {registeredSuccess && (
          <div className="alert alert-success" role="alert">
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Registration successful!</strong> Logging in and redirecting to your farmer dashboard...
            </div>
          </div>
        )}

        {generalErrors.length > 0 && (
          <div className="alert alert-danger" role="alert">
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Registration could not be completed:</strong>
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.35rem' }}>
                {generalErrors.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className={`form-control ${fieldErrors.username ? 'error-border' : ''}`}
              placeholder="e.g. tariq_farmer"
              value={formData.username}
              onChange={handleChange}
              disabled={submitting || registeredSuccess}
            />
            {fieldErrors.username && <div className="form-error">{fieldErrors.username}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={`form-control ${fieldErrors.email ? 'error-border' : ''}`}
              placeholder="farmer@domain.com"
              value={formData.email}
              onChange={handleChange}
              disabled={submitting || registeredSuccess}
            />
            {fieldErrors.email && <div className="form-error">{fieldErrors.email}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className={`form-control ${fieldErrors.password ? 'error-border' : ''}`}
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={handleChange}
                disabled={submitting || registeredSuccess}
              />
              {fieldErrors.password && <div className="form-error">{fieldErrors.password}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm Password <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className={`form-control ${fieldErrors.confirmPassword ? 'error-border' : ''}`}
                placeholder="Repeat password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={submitting || registeredSuccess}
              />
              {fieldErrors.confirmPassword && (
                <div className="form-error">{fieldErrors.confirmPassword}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                maxLength={20}
                className={`form-control ${fieldErrors.phone ? 'error-border' : ''}`}
                placeholder="03001234567"
                value={formData.phone}
                onChange={handleChange}
                disabled={submitting || registeredSuccess}
              />
              {fieldErrors.phone && <div className="form-error">{fieldErrors.phone}</div>}
              <div className="form-hint">Max 20 chars</div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cnic">
                CNIC Number
              </label>
              <input
                id="cnic"
                name="cnic"
                type="text"
                maxLength={15}
                className={`form-control ${fieldErrors.cnic ? 'error-border' : ''}`}
                placeholder="1234512345671"
                value={formData.cnic}
                onChange={handleChange}
                disabled={submitting || registeredSuccess}
              />
              {fieldErrors.cnic && <div className="form-error">{fieldErrors.cnic}</div>}
              <div className="form-hint">Max 15 chars (e.g. 1234512345671)</div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting || registeredSuccess}
            style={{ marginTop: '1rem', padding: '0.75rem' }}
          >
            {submitting ? (
              <>
                <div className="spinner spinner-sm" />
                <span>Creating Account & Signing in...</span>
              </>
            ) : registeredSuccess ? (
              <>
                <CheckCircle2 size={16} />
                <span>Account Created!</span>
              </>
            ) : (
              <>
                <span>Complete Farmer Registration</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already registered?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Sign in to existing account
          </Link>
        </div>
      </div>
    </div>
  );
};
