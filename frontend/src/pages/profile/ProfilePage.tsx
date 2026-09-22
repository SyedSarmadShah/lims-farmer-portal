import React, { useState, useEffect } from 'react';
import { User as UserIcon, Save, CheckCircle2, AlertCircle } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { updateProfileApi } from '../../api/auth';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setCnic(user.cnic || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      await updateProfileApi({
        email: email.trim(),
        phone: phone.trim(),
        cnic: cnic.trim() || undefined,
      });
      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: Record<string, string[] | string> };
      };
      if (axiosError?.response?.data) {
        const errors = Object.entries(axiosError.response.data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
          .join(', ');
        setError(errors);
      } else {
        setError('Failed to update profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto' }}>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--brand-accent-tint)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserIcon size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Farmer Profile</h2>
              <p style={{ fontSize: '0.8125rem', margin: 0 }}>
                Manage your credentials and contact information
              </p>
            </div>
          </div>
        </div>

        <div className="card-body">
          {success && (
            <div className="alert alert-success">
              <CheckCircle2 size={18} />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Farmer ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={user?.id ? `#${user.id}` : ''}
                  disabled
                  style={{ backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-muted)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  value={user?.username || ''}
                  disabled
                  style={{ backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-muted)' }}
                />
                <div className="form-hint">Username cannot be altered after registration.</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profileEmail">
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="profileEmail"
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="profilePhone">
                  Phone Number
                </label>
                <input
                  id="profilePhone"
                  type="text"
                  className="form-control"
                  placeholder="03001234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profileCnic">
                  CNIC Number
                </label>
                <input
                  id="profileCnic"
                  type="text"
                  className="form-control"
                  placeholder="1234512345671"
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <div className="spinner spinner-sm" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
