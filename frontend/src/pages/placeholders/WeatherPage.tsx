import { CloudSun, Info } from 'lucide-react';


export const WeatherPage: React.FC = () => {
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
                backgroundColor: 'var(--color-info-bg)',
                color: 'var(--color-info)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CloudSun size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Agri-Weather & Forecasting</h2>
              <p style={{ fontSize: '0.8125rem', margin: 0 }}>
                Meteorological data and farm irrigation advisories
              </p>
            </div>
          </div>
          <span className="badge badge-info">Future Feature</span>
        </div>

        <div className="card-body">
          <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-info-bg)',
                color: 'var(--color-info)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <CloudSun size={32} />
            </div>
            <h3>Agri-Weather Advisory Hub</h3>
            <p style={{ maxWidth: '460px' }}>
              This section is reserved for hyper-local weather tracking, rain radar alerts, evapotranspiration estimates, and optimal spray/irrigation windows based on your farm coordinates.
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
              <Info size={16} style={{ color: 'var(--color-info)' }} />
              <span>Weather data integration will be connected after map boundary drawing is established.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
