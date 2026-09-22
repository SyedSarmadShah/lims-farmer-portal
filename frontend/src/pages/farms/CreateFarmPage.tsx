import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Trees,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  MapPin,
} from 'lucide-react';

import { createFarmApi } from '../../api/farms';
import { FarmMap } from '../../components/map/FarmMap';
import type { GeoPolygon } from '../../types/farm';
import { validateGeoPolygon } from '../../utils/geoUtils';

export const CreateFarmPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [boundary, setBoundary] = useState<GeoPolygon | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [boundaryError, setBoundaryError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setBoundaryError(null);
    setGeneralError(null);

    let hasClientError = false;

    if (!name.trim()) {
      setNameError('Farm name is required.');
      hasClientError = true;
    }

    if (!boundary) {
      setBoundaryError('Please draw your farm boundary polygon on the map before saving.');
      hasClientError = true;
    } else {
      const boundaryValidation = validateGeoPolygon(boundary);
      if (!boundaryValidation.isValid) {
        setBoundaryError(boundaryValidation.error || 'The drawn boundary polygon is invalid.');
        hasClientError = true;
      }
    }

    if (hasClientError) {
      return;
    }

    setSubmitting(true);
    try {
      await createFarmApi({
        name: name.trim(),
        location: location.trim() || undefined,
        boundary: boundary,
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
        }
        if (errorData.boundary) {
          setBoundaryError(
            Array.isArray(errorData.boundary)
              ? errorData.boundary.join(' ')
              : String(errorData.boundary)
          );
        }
        if (!errorData.name && !errorData.boundary) {
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

            {/* Boundary / Leaflet Map Section */}
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
                    Farm Boundary Mapping <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </h4>
                  <p style={{ fontSize: '0.8125rem', margin: 0 }}>
                    Outline the GIS polygon boundary around your agricultural holding parcel
                  </p>
                </div>
                <span className="badge badge-success">
                  <MapPin size={12} /> Interactive GIS
                </span>
              </div>

              {/* Instructions Callout */}
              <div
                style={{
                  backgroundColor: 'var(--brand-accent-tint)',
                  border: '1px solid #bbf7d0',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.8125rem',
                  color: 'var(--brand-primary)',
                }}
              >
                <div style={{ fontWeight: 600 }}>Instructions:</div>
                <div>
                  Click <strong>Draw Polygon</strong> &rarr; Click corners around your land &rarr; Double-click or click first point to close &rarr; Save Farm.
                </div>
              </div>

              {/* Modular Leaflet Map Component */}
              <FarmMap
                initialBoundary={boundary}
                onBoundaryChange={(newBoundary) => {
                  setBoundary(newBoundary);
                  if (boundaryError) setBoundaryError(null);
                }}
                height={460}
              />

              {boundaryError && (
                <div
                  className="alert alert-danger"
                  style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}
                >
                  <AlertCircle size={16} />
                  <span>{boundaryError}</span>
                </div>
              )}

              {/* GeoJSON inspection accordion / debug viewer if boundary exists */}
              {boundary && (
                <div style={{ marginTop: '0.75rem' }}>
                  <details
                    style={{
                      background: '#f8faf9',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                    }}
                  >
                    <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Inspect Generated GeoJSON Payload ({boundary.coordinates[0].length} coordinate vertices)
                    </summary>
                    <pre
                      style={{
                        margin: '0.5rem 0 0',
                        padding: '0.5rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        maxHeight: '140px',
                        overflowY: 'auto',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {JSON.stringify(boundary, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
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
