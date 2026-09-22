import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trees,
  MapPin,
  Layers,
  Map,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { getFarmByIdApi, deleteFarmApi } from '../../api/farms';
import type { Farm } from '../../types/farm';


export const FarmDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchFarm = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getFarmByIdApi(Number(id));
        setFarm(data);
      } catch {
        setError('Farm not found or you do not have permission to view this holding.');
      } finally {
        setLoading(false);
      }
    };

    fetchFarm();
  }, [id]);

  const handleDelete = async () => {
    if (!farm || !window.confirm(`Are you sure you want to delete "${farm.name}"?`)) {
      return;
    }
    setDeleting(true);
    try {
      await deleteFarmApi(farm.id);
      navigate('/farms');
    } catch {
      alert('Failed to delete farm.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p>Loading farm details...</p>
      </div>
    );
  }

  if (error || !farm) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{error || 'Farm could not be retrieved.'}</span>
        </div>
        <Link to="/farms" className="btn btn-primary">
          <ArrowLeft size={16} />
          <span>Return to Farms</span>
        </Link>
      </div>
    );
  }

  const hasBoundary = !!farm.boundary;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Navigation & Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
        }}
      >
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

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn btn-outline btn-sm"
          style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
        >
          <Trash2 size={15} />
          <span>{deleting ? 'Deleting...' : 'Delete Farm'}</span>
        </button>
      </div>

      {/* Farm Overview Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
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
              <Trees size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', margin: 0 }}>{farm.name}</h2>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.2rem',
                }}
              >
                <MapPin size={14} />
                <span>{farm.location || 'Location unassigned'}</span>
              </div>
            </div>
          </div>

          <div>
            {hasBoundary ? (
              <span className="badge badge-success">
                <CheckCircle2 size={13} /> Boundary Defined
              </span>
            ) : (
              <span className="badge badge-warning">
                <Clock size={13} /> Boundary Pending
              </span>
            )}
          </div>
        </div>

        <div className="card-body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Farm ID
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginTop: '0.2rem' }}>
                #{farm.id}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Created At
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginTop: '0.2rem' }}>
                {new Date(farm.created_at).toLocaleString()}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Last Updated
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginTop: '0.2rem' }}>
                {new Date(farm.updated_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GIS Boundary Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} style={{ color: 'var(--brand-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Farm Boundary & Map Geometry</h3>
          </div>
          <span className="badge badge-info">Map Viewer - Next Step</span>
        </div>
        <div className="card-body">
          {hasBoundary ? (
            <div>
              <p style={{ marginBottom: '1rem' }}>
                GeoJSON polygon linear ring is recorded with{' '}
                <strong>{farm.boundary?.coordinates[0].length}</strong> coordinate vertices.
              </p>
              <div
                style={{
                  background: '#f8faf9',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8125rem',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  color: 'var(--text-primary)',
                }}
              >
                <pre style={{ margin: 0 }}>
                  {JSON.stringify(farm.boundary, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="boundary-preview-box">
              <Map size={36} style={{ color: 'var(--brand-primary)' }} />
              <h4 style={{ color: 'var(--brand-primary)', margin: 0 }}>
                No GeoJSON boundary polygon mapped yet
              </h4>
              <p style={{ maxWidth: '500px', fontSize: '0.875rem' }}>
                Map rendering and interactive boundary drawing tools will be integrated using Leaflet in the next development phase.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Future Analytics Reserved Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Satellite Coverage</h3>
            <span className="badge badge-neutral">Future Step</span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '0.875rem' }}>
              Once the polygon boundary is confirmed on Leaflet, Sentinel-2 / Landsat-8 imagery passes over this farm will be queried.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>NDVI & Crop Health</h3>
            <span className="badge badge-neutral">Future Step</span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '0.875rem' }}>
              Vegetation health indexes, moisture stress alerts, and historical canopy vigor graphs will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
