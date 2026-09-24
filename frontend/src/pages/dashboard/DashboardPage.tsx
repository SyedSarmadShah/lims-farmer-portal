import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  PlusCircle,
  MapPin,
  Calendar,
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
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

  const recentFarms = farms.slice(0, 5);

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <div className="dashboard-banner">
        <div className="banner-text">
          <h1>Welcome back, {user?.username || 'Farmer'}! 🌱</h1>
          <p>
            Quick overview of your registered agricultural holdings and fields.
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

      {/* Overview Stat Card */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <Sprout size={24} />
          </div>
          <div className="stat-meta">
            <div className="stat-label">Total Farms</div>
            <div className="stat-value">{loading ? '—' : farms.length}</div>
            <div className="stat-sub">Registered agricultural holdings</div>
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
        /* Empty State */
        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div className="empty-icon-wrap" style={{ margin: '0 auto 1rem' }}>
            <Sprout size={36} />
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            You have not created any farms yet.
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            Register your first farmland from My Farms to outline field boundaries and inspect satellite NDVI data.
          </p>
          <Link to="/farms/new" className="btn btn-primary" style={{ minHeight: '44px' }}>
            <PlusCircle size={18} />
            <span>Create Farm</span>
          </Link>
        </div>
      ) : (
        /* Recent Farms List */
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Recent Farms</h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Your latest registered land parcels
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/farms" className="btn btn-outline btn-sm">
                <span>View All ({farms.length})</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentFarms.map((farm) => {
                const hasBoundary = Boolean(farm.boundary);
                return (
                  <div
                    key={farm.id}
                    className="recent-farm-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
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
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)',
                          flexWrap: 'wrap',
                        }}
                      >
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

                      <Link to={`/farms/${farm.id}`} className="btn btn-secondary btn-sm" style={{ minHeight: '36px' }}>
                        <span>Open Farm</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
