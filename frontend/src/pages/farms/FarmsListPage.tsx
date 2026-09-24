import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  PlusCircle,
  MapPin,
  Calendar,
  Search,
  AlertCircle,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { getFarmsApi, deleteFarmApi } from '../../api/farms';
import type { Farm } from '../../types/farm';

export const FarmsListPage: React.FC = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchFarms = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFarmsApi();
      setFarms(data);
    } catch {
      setError('Failed to load farms from backend server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteFarmApi(id);
      setFarms((prev) => prev.filter((f) => f.id !== id));
      setDeleteConfirmId(null);
    } catch {
      alert('Unable to delete farm. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredFarms = farms.filter((farm) => {
    const query = searchQuery.toLowerCase();
    return (
      farm.name.toLowerCase().includes(query) ||
      (farm.location && farm.location.toLowerCase().includes(query))
    );
  });

  return (
    <div className="farms-page-container">
      {/* Top Header Bar */}
      <div className="farms-header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.35rem' }}>My Farms</h2>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            View and manage your registered agricultural land holdings
          </p>
        </div>
        <Link to="/farms/new" className="btn btn-primary" style={{ minHeight: '44px' }}>
          <PlusCircle size={18} />
          <span>Create Farm</span>
        </Link>
      </div>

      {/* Search & Actions Bar */}
      <div
        className="farms-search-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem', minHeight: '44px', fontSize: '0.9375rem' }}
            placeholder="Search farms by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          className="btn btn-secondary"
          onClick={fetchFarms}
          disabled={loading}
          title="Refresh farm records"
          style={{ minHeight: '44px' }}
        >
          <RefreshCw size={16} className={loading ? 'spinner-sm' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={fetchFarms}>
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ padding: '4rem 0', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Retrieving your registered farms...</p>
        </div>
      ) : farms.length === 0 ? (
        /* Empty State */
        <div className="empty-state" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div className="empty-icon-wrap" style={{ margin: '0 auto 1rem' }}>
            <Sprout size={36} />
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            You have not created any farms yet.
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            Register your first farmland to outline field boundaries, view GIS maps, and inspect satellite NDVI data.
          </p>
          <Link to="/farms/new" className="btn btn-primary" style={{ minHeight: '44px' }}>
            <PlusCircle size={18} />
            <span>Create Farm</span>
          </Link>
        </div>
      ) : filteredFarms.length === 0 ? (
        <div className="empty-state" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <h3>No matching farms</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1rem' }}>
            No farms found matching "{searchQuery}".
          </p>
          <button className="btn btn-secondary btn-sm" onClick={() => setSearchQuery('')}>
            Clear Search
          </button>
        </div>
      ) : (
        /* Responsive Farms Grid: 1 col on mobile, 2 on tablet, multi on desktop */
        <div className="farms-grid">
          {filteredFarms.map((farm) => {
            const hasBoundary = Boolean(farm.boundary);
            return (
              <div key={farm.id} className="farm-card">
                <div className="farm-card-header">
                  <div>
                    <h3 className="farm-name" style={{ margin: 0 }}>🌾 {farm.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.35rem' }}>
                      <MapPin size={14} />
                      <span>{farm.location || 'Location not specified'}</span>
                    </div>
                  </div>

                  {hasBoundary ? (
                    <span className="badge badge-success">
                      <CheckCircle2 size={12} /> Boundary Mapped
                    </span>
                  ) : (
                    <span className="badge badge-warning">
                      <Clock size={12} /> Boundary Needed
                    </span>
                  )}
                </div>

                <div className="farm-card-info">
                  <div className="info-row">
                    <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>Registration Date: {new Date(farm.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="farm-card-actions">
                  <Link to={`/farms/${farm.id}`} className="btn btn-primary btn-sm" style={{ minHeight: '38px', gap: '0.4rem' }}>
                    <ExternalLink size={15} />
                    <span>Open Farm</span>
                  </Link>

                  {deleteConfirmId === farm.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-danger)', fontWeight: 600 }}>Delete?</span>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.35rem 0.65rem', minHeight: '34px' }}
                        disabled={deletingId === farm.id}
                        onClick={() => handleDelete(farm.id)}
                      >
                        {deletingId === farm.id ? 'Deleting...' : 'Yes'}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.35rem 0.65rem', minHeight: '34px' }}
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-sm btn-outline"
                      style={{ minHeight: '38px', color: 'var(--color-danger)', borderColor: 'var(--border-subtle)', padding: '0.4rem 0.75rem' }}
                      title="Delete farm"
                      onClick={() => setDeleteConfirmId(farm.id)}
                    >
                      <Trash2 size={15} />
                      <span>Delete Farm</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
