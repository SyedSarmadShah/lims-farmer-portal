import React from 'react';
import { Activity, Info, Layers } from 'lucide-react';

export const HealthPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
              <Activity size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>NDVI & Crop Field Health</h2>
              <p style={{ fontSize: '0.8125rem', margin: 0 }}>
                Earth observation and multispectral vegetation indexing
              </p>
            </div>
          </div>
          <span className="badge badge-warning">Future Feature</span>
        </div>

        <div className="card-body">
          <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'var(--brand-accent-tint)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Layers size={32} />
            </div>
            <h3>Satellite NDVI Analytics</h3>
            <p style={{ maxWidth: '480px' }}>
              Normalized Difference Vegetation Index (NDVI), NDRE, and true-color satellite overlays will be generated dynamically once farm boundaries are finalized in the Leaflet GIS viewer.
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-surface-subtle)',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                marginTop: '1rem',
              }}
            >
              <Info size={16} style={{ color: 'var(--color-warning)' }} />
              <span>Satellite imagery feeds and automated spectral calculation will follow boundary drawing.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
