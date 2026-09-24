import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Sprout,
  MapPin,
  Calendar,
  Layers,
  Activity,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Save,
  PenTool,
  RefreshCw,
} from 'lucide-react';
import {
  getFarmByIdApi,
  deleteFarmApi,
  updateFarmApi,
  getFarmNdviStatsApi,
} from '../../api/farms';
import type { Farm, GeoPolygon, NDVIStatistics } from '../../types/farm';
import { FarmMap } from '../../components/map/FarmMap';
import { calculatePolygonMetrics } from '../../utils/geoUtils';

type TabKey = 'overview' | 'boundary' | 'ndvi';

const getVegetationIndicator = (avgNdvi: number): { label: 'Healthy' | 'Moderate' | 'Poor'; badgeClass: string } => {
  if (avgNdvi >= 0.5) {
    return { label: 'Healthy', badgeClass: 'badge-success' };
  }
  if (avgNdvi >= 0.3) {
    return { label: 'Moderate', badgeClass: 'badge-warning' };
  }
  return { label: 'Poor', badgeClass: 'badge-danger' };
};

export const FarmDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State: only Overview, Boundary, and NDVI
  const rawTab = searchParams.get('tab');
  const activeTab: TabKey =
    rawTab === 'boundary' || rawTab === 'ndvi'
      ? rawTab
      : 'overview';

  const setActiveTab = (tab: TabKey) => {
    setSearchParams({ tab });
  };

  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Boundary editing state
  const [editableBoundary, setEditableBoundary] = useState<GeoPolygon | null>(null);
  const [savingBoundary, setSavingBoundary] = useState(false);
  const [boundarySaveSuccess, setBoundarySaveSuccess] = useState(false);
  const [boundarySaveError, setBoundarySaveError] = useState<string | null>(null);
  const [triggerDrawCount, setTriggerDrawCount] = useState(0);

  // NDVI Statistics State
  const [ndviStats, setNdviStats] = useState<NDVIStatistics | null>(null);
  const [ndviStatsLoading, setNdviStatsLoading] = useState(false);
  const [ndviStatsError, setNdviStatsError] = useState<string | null>(null);

  // Fetch Farm by ID
  const fetchFarm = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getFarmByIdApi(Number(id));
      setFarm(data);
      setEditableBoundary(data.boundary);
    } catch {
      setError('Farm not found or you do not have permission to view this holding.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFarm();
  }, [fetchFarm]);

  const farmId = farm?.id;
  const hasBoundary = Boolean(farm?.boundary);

  // Fetch NDVI Statistics when farm has boundary
  const fetchNdviStats = React.useCallback(async () => {
    if (!farmId || !hasBoundary) {
      setNdviStats(null);
      return;
    }
    setNdviStatsLoading(true);
    setNdviStatsError(null);
    try {
      const stats = await getFarmNdviStatsApi(farmId);
      setNdviStats(stats);
    } catch {
      setNdviStatsError('NDVI imagery is not available for this farm.');
    } finally {
      setNdviStatsLoading(false);
    }
  }, [farmId, hasBoundary]);

  useEffect(() => {
    if (activeTab === 'ndvi' || activeTab === 'overview') {
      fetchNdviStats();
    }
  }, [activeTab, fetchNdviStats]);

  // Handle Save Boundary
  const handleSaveBoundary = async () => {
    if (!farm) return;
    setSavingBoundary(true);
    setBoundarySaveSuccess(false);
    setBoundarySaveError(null);

    try {
      const updatedFarm = await updateFarmApi(farm.id, {
        boundary: editableBoundary,
      });
      setFarm(updatedFarm);
      setEditableBoundary(updatedFarm.boundary);
      setBoundarySaveSuccess(true);
      setTimeout(() => setBoundarySaveSuccess(false), 4000);
    } catch {
      setBoundarySaveError('Failed to save boundary to backend. Please check coordinates and retry.');
    } finally {
      setSavingBoundary(false);
    }
  };

  // Handle Farm Deletion
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

  // Computed Polygon Metrics
  const metrics = useMemo(() => {
    const coords = farm?.boundary?.coordinates?.[0];
    if (coords) {
      return calculatePolygonMetrics(coords);
    }
    return null;
  }, [farm?.boundary?.coordinates]);

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
        <Link to="/farms" className="btn btn-primary" style={{ minHeight: '44px' }}>
          <ArrowLeft size={16} />
          <span>Return to My Farms</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="farm-detail-container" style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Top Navigation & Action Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
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
            minHeight: '36px',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to My Farms</span>
        </Link>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn btn-outline btn-sm"
          style={{
            color: 'var(--color-danger)',
            borderColor: 'var(--border-subtle)',
            minHeight: '38px',
          }}
        >
          <Trash2 size={15} />
          <span>{deleting ? 'Deleting...' : 'Delete Farm'}</span>
        </button>
      </div>

      {/* Central Farm Header Hub */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--brand-accent-tint)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sprout size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', margin: 0 }}>🌾 {farm.name}</h2>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.25rem',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} />
                  <span>{farm.location || 'Location unassigned'}</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} />
                  <span>Registration Date: {new Date(farm.created_at).toLocaleDateString()}</span>
                </span>
              </div>
            </div>
          </div>

          <div>
            {hasBoundary ? (
              <span className="badge badge-success">
                <CheckCircle2 size={13} /> Boundary Mapped
              </span>
            ) : (
              <span className="badge badge-warning">
                <Clock size={13} /> Boundary Needed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Horizontal Tabs Bar (Overview, Boundary, NDVI) */}
      <div className="farm-tabs-bar" role="tablist" aria-label="Farm Detail Navigation">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={`farm-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Layers size={16} />
          <span>1. Overview</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'boundary'}
          className={`farm-tab-btn ${activeTab === 'boundary' ? 'active' : ''}`}
          onClick={() => setActiveTab('boundary')}
        >
          <PenTool size={16} />
          <span>2. Boundary</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ndvi'}
          className={`farm-tab-btn ${activeTab === 'ndvi' ? 'active' : ''}`}
          onClick={() => setActiveTab('ndvi')}
        >
          <Activity size={16} />
          <span>3. NDVI</span>
        </button>
      </div>

      {/* ====================================================
          TAB 1: OVERVIEW TAB
          ==================================================== */}
      {activeTab === 'overview' && (
        <div className="farm-tab-content">
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Farm Information</h3>
              {hasBoundary ? (
                <span className="badge badge-success">
                  <CheckCircle2 size={13} /> Boundary Status: Mapped
                </span>
              ) : (
                <span className="badge badge-warning">
                  <Clock size={13} /> Boundary Status: Pending
                </span>
              )}
            </div>

            <div className="card-body">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Farm Name
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '0.25rem' }}>
                    {farm.name}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Location
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '0.25rem' }}>
                    {farm.location || 'Location unassigned'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Created Date (Registration)
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '0.25rem' }}>
                    {new Date(farm.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Boundary Status
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '0.25rem' }}>
                    {hasBoundary ? 'Boundary Mapped' : 'No boundary drawn'}
                  </div>
                </div>

                {metrics && (
                  <>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Calculated Area
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '0.25rem', color: 'var(--brand-primary)' }}>
                        {metrics.acres} Acres <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>({metrics.hectares} Ha)</span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Corner Vertices
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '0.25rem' }}>
                        {metrics.vertexCount} vertices
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Quick Actions Navigation: Edit Boundary and View NDVI */}
              <div style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  Quick Actions
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ minHeight: '44px', justifyContent: 'center' }}
                    onClick={() => setActiveTab('boundary')}
                  >
                    <PenTool size={16} />
                    <span>{hasBoundary ? 'Edit Boundary' : 'Draw Boundary'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ minHeight: '44px', justifyContent: 'center' }}
                    onClick={() => setActiveTab('ndvi')}
                  >
                    <Activity size={16} />
                    <span>View NDVI</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 2: BOUNDARY TAB
          ==================================================== */}
      {activeTab === 'boundary' && (
        <div className="farm-tab-content">
          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Farm Boundary Mapping</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Draw, edit, or delete polygon coordinates around your farmland, then save to update.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveBoundary}
                  disabled={savingBoundary || editableBoundary === farm.boundary}
                  style={{ minHeight: '40px' }}
                >
                  {savingBoundary ? (
                    <>
                      <div className="spinner spinner-sm" />
                      <span>Saving Boundary...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Boundary</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="card-body">
              {/* Feedback Alerts */}
              {boundarySaveSuccess && (
                <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                  <CheckCircle2 size={18} />
                  <span>Farm boundary saved successfully!</span>
                </div>
              )}

              {boundarySaveError && (
                <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                  <AlertCircle size={18} />
                  <span>{boundarySaveError}</span>
                </div>
              )}

              {/* Empty state if no boundary has been drawn */}
              {!farm.boundary && !editableBoundary && (
                <div
                  className="alert alert-warning"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <AlertCircle size={18} />
                    <span>No farm boundary has been drawn.</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ minHeight: '38px' }}
                    onClick={() => setTriggerDrawCount((prev) => prev + 1)}
                  >
                    <PenTool size={15} />
                    <span>Draw Boundary</span>
                  </button>
                </div>
              )}

              {/* Leaflet & Leaflet-Geoman Interactive Boundary Editor */}
              <FarmMap
                initialBoundary={editableBoundary}
                onBoundaryChange={(newBoundary) => setEditableBoundary(newBoundary)}
                readOnly={false}
                viewMode="map"
                showLayerSwitcher={false}
                triggerDraw={triggerDrawCount}
                height={480}
                farmId={farm.id}
              />
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 3: NDVI TAB
          ==================================================== */}
      {activeTab === 'ndvi' && (
        <div className="farm-tab-content">
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>NDVI Imagery & Vegetation Condition</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Normalized Difference Vegetation Index (B08/B04) calculated directly from Sentinel-2 satellite data.
                </p>
              </div>

              {ndviStats && (
                <span className={`badge ${getVegetationIndicator(ndviStats.average_ndvi).badgeClass}`}>
                  Vegetation: {getVegetationIndicator(ndviStats.average_ndvi).label}
                </span>
              )}
            </div>

            <div className="card-body">
              {!hasBoundary ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                  <div className="empty-icon-wrap" style={{ margin: '0 auto 1rem' }}>
                    <Activity size={36} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                    No farm boundary has been drawn.
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                    A farm boundary is required to calculate NDVI vegetation indices and imagery for your land.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ minHeight: '44px' }}
                    onClick={() => setActiveTab('boundary')}
                  >
                    <PenTool size={16} />
                    <span>Draw Boundary</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Leaflet Map with NDVI Layer */}
                  <FarmMap
                    initialBoundary={farm.boundary}
                    readOnly={true}
                    viewMode="ndvi"
                    showLayerSwitcher={false}
                    height={460}
                    farmId={farm.id}
                  />

                  {/* NDVI Statistics Section Displayed Below Imagery */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        NDVI Statistics
                      </h4>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={fetchNdviStats}
                        disabled={ndviStatsLoading}
                        style={{ minHeight: '34px' }}
                      >
                        <RefreshCw size={14} className={ndviStatsLoading ? 'spinner-sm' : ''} />
                        <span>Refresh Stats</span>
                      </button>
                    </div>

                    {ndviStatsLoading ? (
                      <div style={{ padding: '2rem 0', textAlign: 'center' }}>
                        <div className="spinner spinner-sm" style={{ margin: '0 auto 0.5rem' }} />
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                          Retrieving NDVI statistics...
                        </p>
                      </div>
                    ) : ndviStatsError ? (
                      <div className="alert alert-danger" style={{ margin: 0 }}>
                        <AlertCircle size={16} />
                        <span>NDVI imagery is not available for this farm.</span>
                      </div>
                    ) : ndviStats ? (
                      <div>
                        {/* 3 Metric Cards */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '0.85rem',
                            marginBottom: '1rem',
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: 'var(--bg-surface-subtle)',
                              padding: '1rem',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-subtle)',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                              Average NDVI
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--brand-primary)', marginTop: '0.25rem' }}>
                              {ndviStats.average_ndvi.toFixed(2)}
                            </div>
                          </div>

                          <div
                            style={{
                              backgroundColor: 'var(--bg-surface-subtle)',
                              padding: '1rem',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-subtle)',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                              Minimum NDVI
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                              {ndviStats.minimum_ndvi.toFixed(2)}
                            </div>
                          </div>

                          <div
                            style={{
                              backgroundColor: 'var(--bg-surface-subtle)',
                              padding: '1rem',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-subtle)',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                              Maximum NDVI
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                              {ndviStats.maximum_ndvi.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Vegetation Indicator Card */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.85rem 1.25rem',
                            backgroundColor: 'var(--brand-accent-tint)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid #bbf7d0',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.875rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
                              Vegetation Indicator:
                            </span>
                            <span
                              style={{
                                marginLeft: '0.5rem',
                                fontWeight: 700,
                                fontSize: '1rem',
                                color: 'var(--brand-primary)',
                              }}
                            >
                              {getVegetationIndicator(ndviStats.average_ndvi).label}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.8125rem', color: 'var(--brand-primary)' }}>
                            Based on backend Sentinel-2 values
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="alert alert-warning" style={{ margin: 0 }}>
                        <AlertCircle size={16} />
                        <span>NDVI imagery is not available for this farm.</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
