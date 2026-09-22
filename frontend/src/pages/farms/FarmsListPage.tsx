import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trees,
  PlusCircle,
  MapPin,
  Calendar,
  Layers,
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
    <div>
      {/* Header Bar */}
      <div className="farms-header-bar">
        <div>
          <h2>My Agricultural Holdings</h2>
          <p>View and manage your registered farm holdings and GIS parcels</p>
        </div>
        <Link to="/farms/new" className="btn btn-primary">
          <PlusCircle size={16} />
          <span>Register New Farm</span>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.25rem' }}
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
        >
          <RefreshCw size={15} className={loading ? 'spinner-sm' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
        <div className="empty-state">
          <div className="empty-icon-wrap">
            <Trees size={32} />
          </div>
          <h2>No farms found</h2>
          <p style={{ maxWidth: '420px' }}>
            You haven't added any farms yet. Register your first farmland to begin tracking land boundaries and monitoring crop indices.
          </p>
          <Link to="/farms/new" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            <PlusCircle size={16} />
            <span>Register Your First Farm</span>
          </Link>
        </div>
      ) : filteredFarms.length === 0 ? (
        <div className="empty-state" style={{ padding: '2.5rem' }}>
          <h3>No matching farms</h3>
          <p>No farms found matching "{searchQuery}". Try a different keyword.</p>
          <button className="btn btn-secondary btn-sm" onClick={() => setSearchQuery('')}>
            Clear Search
          </button>
        </div>
      ) : (
        /* Farms Grid */
        <div className="farms-grid">
          {filteredFarms.map((farm) => {
            const hasBoundary = !!farm.boundary;
            return (
              <div key={farm.id} className="farm-card">
                <div className="farm-card-header">
                  <div>
                    <h3 className="farm-name">{farm.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                      <MapPin size={13} />
                      <span>{farm.location || 'Location not specified'}</span>
                    </div>
                  </div>

                  {hasBoundary ? (
                    <span className="badge badge-success" title="GeoJSON Polygon boundary stored">
                      <CheckCircle2 size={12} /> Polygon Mapped
                    </span>
                  ) : (
                    <span className="badge badge-warning" title="Map boundary pending">
                      <Clock size={12} /> Boundary Pending
                    </span>
                  )}
                </div>

                <div className="farm-card-info">
                  <div className="info-row">
                    <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>Registered: {new Date(farm.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="info-row">
                    <Layers size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>
                      {hasBoundary
                        ? `Boundary Type: ${farm.boundary?.type} (${farm.boundary?.coordinates[0].length} vertices)`
                        : 'Boundary Polygon: Ready to plot in GIS map'}
                    </span>
                  </div>
                </div>

                <div className="farm-card-actions">
                  <Link to={`/farms/${farm.id}`} className="btn btn-secondary btn-sm">
                    <ExternalLink size={14} />
                    <span>Open Farm</span>
                  </Link>

                  {deleteConfirmId === farm.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>Delete?</span>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        disabled={deletingId === farm.id}
                        onClick={() => handleDelete(farm.id)}
                      >
                        {deletingId === farm.id ? 'Deleting...' : 'Yes'}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-sm"
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
                      title="Delete farm"
                      onClick={() => setDeleteConfirmId(farm.id)}
                    >
                      <Trash2 size={15} />
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
