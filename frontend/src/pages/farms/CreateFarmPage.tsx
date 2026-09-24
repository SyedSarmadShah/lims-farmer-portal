import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sprout,
  Save,
  ArrowLeft,
  AlertCircle,
  MapPin,
} from 'lucide-react';

import { createFarmApi } from '../../api/farms';

export const CreateFarmPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setGeneralError(null);

    if (!name.trim()) {
      setNameError('Farm name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const createdFarm = await createFarmApi({
        name: name.trim(),
        location: location.trim() || undefined,
      });

      // Redirect user directly to Boundary tab of the new farm
      navigate(`/farms/${createdFarm.id}?tab=boundary`);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: Record<string, string[] | string> };
      };
      if (axiosError?.response?.data) {
        const errorData = axiosError.response.data;
        if (errorData.name) {
          setNameError(
            Array.isArray(errorData.name)
              ? errorData.name.join(' ')
              : String(errorData.name)
          );
        } else {
          setGeneralError('Failed to create farm. Please review entered details.');
        }
      } else {
        setGeneralError('Failed to create farm. Please ensure backend server is reachable.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Back to Farms Navigation */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/farms"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            minHeight: '36px',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to My Farms</span>
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--brand-accent-tint)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sprout size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Create Farm</h2>
              <p style={{ fontSize: '0.8125rem', margin: 0, color: 'var(--text-secondary)' }}>
                Step 1: Register farm name and location
              </p>
            </div>
          </div>
        </div>

        <div className="card-body">
          {generalError && (
            <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={18} />
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Farm Name */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" htmlFor="farmName" style={{ fontWeight: 600 }}>
                Farm Name <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="farmName"
                type="text"
                className="form-control"
                style={{ minHeight: '44px', fontSize: '1rem' }}
                placeholder="e.g. Green Valley Farm"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                disabled={submitting}
                autoFocus
              />
              {nameError && <div className="form-error" style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', marginTop: '0.35rem' }}>{nameError}</div>}
              <div className="form-hint" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                A recognizable name for your agricultural land.
              </div>
            </div>

            {/* Farm Location */}
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label" htmlFor="farmLocation" style={{ fontWeight: 600 }}>
                Location
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  id="farmLocation"
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem', minHeight: '44px', fontSize: '1rem' }}
                  placeholder="e.g. Chak 42-SB, Sargodha or District/Tehsil"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="form-hint" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                District, tehsil, village, or address of the land parcel.
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.875rem 1rem',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1.75rem',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
              }}
            >
              ℹ️ After creating this farm, you will be redirected to the <strong>Boundary</strong> tab where you can outline your farm boundaries on the interactive map.
            </div>

            {/* Action buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <Link to="/farms" className="btn btn-secondary" style={{ minHeight: '44px' }}>
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ minHeight: '44px', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
              >
                {submitting ? (
                  <>
                    <div className="spinner spinner-sm" />
                    <span>Creating Farm...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Create Farm & Draw Boundary</span>
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
