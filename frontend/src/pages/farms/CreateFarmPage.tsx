import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Trees,
  Map,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';

import { createFarmApi } from '../../api/farms';

export const CreateFarmPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState(false);

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
      await createFarmApi({
        name: name.trim(),
        location: location.trim() || undefined,
        boundary: null, // As specified: map/boundary is prepared for the next step
      });

      setCreatedSuccess(true);
      setTimeout(() => {
        navigate('/farms');
      }, 1200);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: Record<string, string[] | string> };
      };
      if (axiosError?.response?.data) {
        const errorData = axiosError.response.data;
        if (errorData.name) {
          setNameError(Array.isArray(errorData.name) ? errorData.name.join(' ') : String(errorData.name));
        } else {
          setGeneralError(JSON.stringify(errorData));
        }
      } else {
        setGeneralError('Failed to register farm. Please ensure the backend is available.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      {/* Back link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/farms"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
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
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--brand-accent-tint)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trees size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Register New Farm</h2>
              <p style={{ fontSize: '0.8125rem', margin: 0 }}>
                Record farm metadata into your Land Information Management System
              </p>
            </div>
          </div>
        </div>

        <div className="card-body">
          {createdSuccess && (
            <div className="alert alert-success">
              <CheckCircle2 size={18} />
              <span>Farm registered successfully! Redirecting to farm list...</span>
            </div>
          )}

          {generalError && (
            <div className="alert alert-danger">
              <AlertCircle size={18} />
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Basic Farm Information */}
            <div className="form-group">
              <label className="form-label" htmlFor="farmName">
                Farm Name <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="farmName"
                type="text"
                className="form-control"
                placeholder="e.g. Green Valley Agro Farm"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                disabled={submitting || createdSuccess}
                autoFocus
              />
              {nameError && <div className="form-error">{nameError}</div>}
              <div className="form-hint">A recognizable title for this land parcel.</div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="farmLocation">
                Location
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="farmLocation"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Chak 42-SB, Sargodha or Islamabad"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={submitting || createdSuccess}
                />
              </div>
              <div className="form-hint">
                District, tehsil, mouza, or address of the agricultural land.
              </div>
            </div>

            {/* Boundary / Leaflet Map Prepared Section */}
            <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>
                    Farm Boundary
                  </h4>
                  <p style={{ fontSize: '0.8125rem', margin: 0 }}>
                    GeoJSON linear ring polygon coordinate definition
                  </p>
                </div>
                <span className="badge badge-info">Next Step: GIS Map</span>
              </div>

              {/* Prepared Placeholder Container */}
              <div className="boundary-preview-box">
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-primary)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <Map size={26} />
                </div>
                <h4 style={{ color: 'var(--brand-primary)', margin: 0 }}>
                  Map will be added in the next implementation step.
                </h4>
                <p style={{ maxWidth: '480px', margin: 0, fontSize: '0.875rem' }}>
                  In the upcoming implementation step, an interactive Leaflet GIS map with drawing tools will allow you to pinpoint satellite coordinates and outline the polygon boundary of this farm.
                </p>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    backgroundColor: '#ffffff',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <Info size={14} style={{ color: 'var(--color-info)' }} />
                  <span>You can save the farm now and plot boundaries later.</span>
                </div>
              </div>
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
              <Link to="/farms" className="btn btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || createdSuccess}
              >
                {submitting ? (
                  <>
                    <div className="spinner spinner-sm" />
                    <span>Saving Farm...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Farm</span>
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
