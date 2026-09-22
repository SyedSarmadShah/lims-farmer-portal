import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  PlusCircle,
  MapPin,
  Calendar,
  Satellite,
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getFarmsApi } from '../../api/farms';
import type { Farm } from '../../types/farm';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFarms = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFarmsApi();
      setFarms(data);
    } catch {
      setError('Unable to load your farms. Please check your internet connection or backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const recentFarms = farms.slice(0, 3);

  return (
    <div>
      {/* Welcome Banner */}
      <div className="dashboard-banner">
        <div className="banner-text">
          <h1>Welcome back, {user?.username || 'Farmer'}! 🌱</h1>
          <p>
            Manage your farms and monitor your crops using satellite data.
          </p>
        </div>
      </div>

      {/* Error alert with retry */}
      {error && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={fetchFarms}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Stat Card */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 340px))' }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <Sprout size={24} />
          </div>
          <div className="stat-meta">
            <div className="stat-label">My Farms</div>
            <div className="stat-value">{loading ? '—' : farms.length}</div>
            <div className="stat-sub">Registered farms</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ padding: '3.5rem 0', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Loading your farm records...</p>
        </div>
      ) : farms.length === 0 ? (
        /* First-Time Farmer Onboarding Section */
        <div className="onboarding-card">
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--brand-accent-tint)',
              color: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <Sparkles size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.4rem', color: 'var(--brand-primary)' }}>
            Welcome to LIMS Farmer Portal 🌱
          </h2>
          <p style={{ maxWidth: '520px', margin: '0 auto 1.5rem', color: 'var(--text-secondary)' }}>
            Let's get your farm registered. You'll then be able to mark its boundary on the map and check your crop health using satellite data.
          </p>

          <div className="onboarding-steps">
            <div className="onboarding-step-box">
              <div className="onboarding-step-num">1</div>
              <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem' }}>Add your farm</h4>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Give your farm a name (e.g. My Wheat Farm) and specify its village or district.
              </p>
            </div>

            <div className="onboarding-step-box">
              <div className="onboarding-step-num">2</div>
              <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem' }}>Mark farm boundary</h4>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Open the interactive map and click the corners of your land to outline your field.
              </p>
            </div>

            <div className="onboarding-step-box">
              <div className="onboarding-step-num">3</div>
              <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem' }}>Check crop health</h4>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Receive instant satellite-based vegetation analysis to monitor crop vigor.
              </p>
            </div>
          </div>

          <Link to="/farms/new" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}>
            <PlusCircle size={18} />
            <span>+ Add My Farm</span>
          </Link>
        </div>
      ) : (
        /* Returning Farmer Dashboard Grid */
        <div className="dashboard-grid">
          {/* Left Column: Recent Farms */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 style={{ margin: 0 }}>Recent Farms</h3>
                <p style={{ margin: 0, fontSize: '0.8125rem' }}>Your latest registered land</p>
              </div>
              <Link to="/farms" className="btn btn-outline btn-sm">
                <span>View All ({farms.length})</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentFarms.map((farm) => {
                  const hasBoundary = !!farm.boundary;
                  return (
                    <div
                      key={farm.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.1rem 1.25rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        border: '1px solid var(--border-subtle)',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                          🌾 {farm.name}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <MapPin size={14} />
                            {farm.location || 'Location not specified'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Calendar size={14} />
                            {new Date(farm.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {hasBoundary ? (
                          <span className="badge badge-success">
                            <CheckCircle2 size={13} /> Boundary Mapped
                          </span>
                        ) : (
                          <span className="badge badge-warning">
                            <Clock size={13} /> Boundary Needed
                          </span>
                        )}

                        <Link to={`/farms/${farm.id}`} className="btn btn-secondary btn-sm">
                          View Farm
                        </Link>

                        {hasBoundary && (
                          <Link to="/health" className="btn btn-primary btn-sm">
                            <Satellite size={14} />
                            <span>Crop Health</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Crop Health & Weather Information */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Satellite Crop Health Card */}
            <div className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--brand-accent-tint)',
                      color: 'var(--brand-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Satellite size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Satellite Crop Health</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Sentinel-2 Vegetation Monitoring
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-body">
                <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                  Satellites scan your farm from space to check crop greenness and vegetation health without requiring field sensors.
                </p>

                {/* Visual Health Scale Preview */}
                <div className="crop-health-scale-preview">
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                      VEGETATION SCALE
                    </div>
                    <div className="health-dot-bar">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>Low</span>
                      <span className="health-dot" style={{ backgroundColor: '#ef4444' }} title="Low / Dry" />
                      <span className="health-dot" style={{ backgroundColor: '#f97316' }} title="Moderate" />
                      <span className="health-dot" style={{ backgroundColor: '#eab308' }} title="Fair" />
                      <span className="health-dot" style={{ backgroundColor: '#22c55e' }} title="Healthy" />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>High</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                      🟢 Healthy (0.72)
                    </span>
                  </div>
                </div>

                <Link to="/health" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                  <span>Open Crop Health</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
