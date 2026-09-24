import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

import {
  PenTool,
  Square,
  Edit3,
  RotateCcw,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Activity,
} from 'lucide-react';

import type { GeoPolygon } from '../../types/farm';
import {
  latLngsToGeoPolygon,
  geoPolygonToLatLngs,
  calculatePolygonMetrics,
  type PolygonMetrics,
} from '../../utils/geoUtils';
import { getFarmSatelliteImageApi, getFarmNdviImageApi } from '../../api/satellite';

// Sensible default map center: Agricultural hub in Punjab / Pakistan
const DEFAULT_CENTER: [number, number] = [31.5204, 73.5];
const DEFAULT_ZOOM = 9;

export type FarmMapViewMode = 'map' | 'satellite' | 'ndvi';

export interface FarmMapProps {
  initialBoundary?: GeoPolygon | null;
  onBoundaryChange?: (boundary: GeoPolygon | null) => void;
  readOnly?: boolean;
  height?: string | number;
  center?: [number, number];
  zoom?: number;
  farmId?: number;
  allowSatellite?: boolean;
  viewMode?: FarmMapViewMode;
  defaultViewMode?: FarmMapViewMode;
  showLayerSwitcher?: boolean;
  onViewModeChange?: (mode: FarmMapViewMode) => void;
  triggerDraw?: number;
}

export const FarmMap: React.FC<FarmMapProps> = ({
  initialBoundary,
  onBoundaryChange,
  readOnly = false,
  height = 460,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  farmId,
  allowSatellite,
  viewMode: controlledViewMode,
  defaultViewMode = 'map',
  showLayerSwitcher,
  onViewModeChange,
  triggerDraw,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);

  const [viewMode, setViewMode] = useState<FarmMapViewMode>(controlledViewMode ?? defaultViewMode);
  const [layerLoading, setLayerLoading] = useState(false);
  const [layerError, setLayerError] = useState<string | null>(null);

  const satelliteUrlRef = useRef<string | null>(null);
  const ndviUrlRef = useRef<string | null>(null);
  const imageOverlayRef = useRef<L.ImageOverlay | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const currentViewModeRef = useRef<FarmMapViewMode>(viewMode);
  const activeFetchFarmIdRef = useRef<number | null>(null);

  useEffect(() => {
    currentViewModeRef.current = viewMode;
  }, [viewMode]);

  // Window resize handler for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const [metrics, setMetrics] = useState<PolygonMetrics | null>(() => {
    if (initialBoundary?.coordinates?.[0]) {
      return calculatePolygonMetrics(initialBoundary.coordinates[0]);
    }
    return null;
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);


  const onBoundaryChangeRef = useRef(onBoundaryChange);
  useEffect(() => {
    onBoundaryChangeRef.current = onBoundaryChange;
  }, [onBoundaryChange]);

  const initialBoundaryRef = useRef(initialBoundary);
  const readOnlyRef = useRef(readOnly);

  // Helper to extract polygon points and update GeoJSON
  const handlePolygonUpdate = useCallback((layer: L.Polygon) => {
    const rawLatLngs = layer.getLatLngs();
    // Handle possible nested rings
    const ring = Array.isArray(rawLatLngs[0])
      ? (rawLatLngs[0] as L.LatLng[])
      : (rawLatLngs as L.LatLng[]);

    const points = ring.map((ll) => ({ lat: ll.lat, lng: ll.lng }));
    const geoPoly = latLngsToGeoPolygon(points);

    if (geoPoly?.coordinates?.[0]) {
      const polyMetrics = calculatePolygonMetrics(geoPoly.coordinates[0]);
      setMetrics(polyMetrics);
      if (onBoundaryChangeRef.current) {
        onBoundaryChangeRef.current(geoPoly);
      }
    }
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Avoid re-initialization if already created
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: true,
      attributionControl: true,
    });

    // Add OpenStreetMap standard tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Dedicated pane for satellite overlay to guarantee it sits under polygon boundaries
    if (!map.getPane('satellitePane')) {
      const satellitePane = map.createPane('satellitePane');
      satellitePane.style.zIndex = '300';
    }

    mapInstanceRef.current = map;

    // Configure Geoman if not readOnly
    if (!readOnlyRef.current) {
      map.pm.addControls({
        position: 'topleft',
        drawMarker: false,
        drawCircleMarker: false,
        drawPolyline: false,
        drawRectangle: true,
        drawPolygon: true,
        drawCircle: false,
        drawText: false,
        editMode: true,
        dragMode: false,
        cutPolygon: false,
        removalMode: true,
        rotateMode: false,
      });

      map.pm.setPathOptions({
        color: '#184e36',
        fillColor: '#2bb673',
        fillOpacity: 0.35,
        weight: 3,
      });

      // Handle newly drawn polygon/rectangle
      map.on('pm:create', (e) => {
        const newLayer = e.layer as L.Polygon;

        // Ensure only one boundary exists per farm
        if (polygonLayerRef.current && polygonLayerRef.current !== newLayer) {
          map.removeLayer(polygonLayerRef.current);
        }

        polygonLayerRef.current = newLayer;
        setIsDrawing(false);

        // Attach change listeners to the new layer
        newLayer.on('pm:edit', () => handlePolygonUpdate(newLayer));
        newLayer.on('pm:update', () => handlePolygonUpdate(newLayer));
        newLayer.on('pm:dragend', () => handlePolygonUpdate(newLayer));

        handlePolygonUpdate(newLayer);
      });

      // Handle layer removal via Geoman toolbar
      map.on('pm:remove', (e) => {
        if (e.layer === polygonLayerRef.current) {
          polygonLayerRef.current = null;
          setMetrics(null);
          if (onBoundaryChangeRef.current) {
            onBoundaryChangeRef.current(null);
          }
        }
      });

      // Track drawing / editing states for UI buttons
      map.on('pm:drawstart', () => setIsDrawing(true));
      map.on('pm:drawend', () => setIsDrawing(false));
      map.on('pm:globaleditmodetoggled', (e: { enabled: boolean }) => {
        setIsEditing(e.enabled);
      });
    }

    // Render initial boundary if present
    const initBound = initialBoundaryRef.current;
    if (initBound?.coordinates?.[0]) {
      const latLngs = geoPolygonToLatLngs(initBound);
      if (latLngs.length > 0) {
        const layer = L.polygon(latLngs, {
          color: '#184e36',
          fillColor: '#2bb673',
          fillOpacity: 0.35,
          weight: 3,
        }).addTo(map);

        polygonLayerRef.current = layer;

        if (!readOnlyRef.current) {
          layer.on('pm:edit', () => handlePolygonUpdate(layer));
          layer.on('pm:update', () => handlePolygonUpdate(layer));
          layer.on('pm:dragend', () => handlePolygonUpdate(layer));
        }

        // Fit map view to the polygon bounds
        try {
          map.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 16 });
        } catch {
          // In case bounds are invalid
        }
      }
    }

    // Ensure map tiles render properly after DOM layout
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (imageOverlayRef.current) {
        imageOverlayRef.current.remove();
        imageOverlayRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [center, zoom, handlePolygonUpdate]);

  // Calculate Leaflet bounds from the active polygon layer or GeoJSON boundary
  const getPolygonBounds = useCallback((): L.LatLngBounds | null => {
    if (polygonLayerRef.current) {
      return polygonLayerRef.current.getBounds();
    }
    const init = initialBoundary || initialBoundaryRef.current;
    if (init?.coordinates?.[0] && init.coordinates[0].length >= 3) {
      const latLngs = geoPolygonToLatLngs(init);
      if (latLngs.length > 0) {
        return L.latLngBounds(latLngs);
      }
    }
    return null;
  }, [initialBoundary]);

  // Display imagery overlay covering the farm's geographic bounds
  const displayImageOverlay = useCallback(
    (url: string, altText: string) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const bounds = getPolygonBounds();
      if (!bounds || !bounds.isValid()) {
        setLayerError(
          currentViewModeRef.current === 'ndvi'
            ? 'NDVI imagery is not available for this farm.'
            : 'Satellite imagery is currently unavailable.'
        );
        return;
      }

      // Remove existing overlay if present
      if (imageOverlayRef.current) {
        imageOverlayRef.current.remove();
        imageOverlayRef.current = null;
      }

      const overlay = L.imageOverlay(url, bounds, {
        pane: 'satellitePane',
        opacity: 1,
        interactive: false,
        alt: altText,
      });

      overlay.addTo(map);
      imageOverlayRef.current = overlay;

      // Keep polygon boundary visible on top of imagery
      if (polygonLayerRef.current) {
        polygonLayerRef.current.bringToFront();
      }
    },
    [getPolygonBounds]
  );

  // Remove imagery overlay from map
  const removeImageOverlay = useCallback(() => {
    if (imageOverlayRef.current) {
      imageOverlayRef.current.remove();
      imageOverlayRef.current = null;
    }
  }, []);

  // Request satellite imagery using authenticated API client
  const loadSatelliteImage = useCallback(
    async (targetFarmId: number) => {
      if (satelliteUrlRef.current) {
        displayImageOverlay(satelliteUrlRef.current, 'Sentinel-2 Satellite Imagery');
        return;
      }

      setLayerLoading(true);
      setLayerError(null);
      activeFetchFarmIdRef.current = targetFarmId;

      try {
        const blob = await getFarmSatelliteImageApi(targetFarmId);
        if (!isMountedRef.current || activeFetchFarmIdRef.current !== targetFarmId) {
          return;
        }

        const objectUrl = URL.createObjectURL(blob);
        satelliteUrlRef.current = objectUrl;

        if (currentViewModeRef.current === 'satellite') {
          displayImageOverlay(objectUrl, 'Sentinel-2 Satellite Imagery');
        }
      } catch {
        if (isMountedRef.current) {
          setLayerError('Unable to load satellite imagery.');
        }
      } finally {
        if (isMountedRef.current) {
          setLayerLoading(false);
        }
      }
    },
    [displayImageOverlay]
  );

  // Request NDVI imagery using authenticated API client
  const loadNdviImage = useCallback(
    async (targetFarmId: number) => {
      if (ndviUrlRef.current) {
        displayImageOverlay(ndviUrlRef.current, 'Sentinel-2 NDVI Imagery');
        return;
      }

      setLayerLoading(true);
      setLayerError(null);
      activeFetchFarmIdRef.current = targetFarmId;

      try {
        const blob = await getFarmNdviImageApi(targetFarmId);
        if (!isMountedRef.current || activeFetchFarmIdRef.current !== targetFarmId) {
          return;
        }

        const objectUrl = URL.createObjectURL(blob);
        ndviUrlRef.current = objectUrl;

        if (currentViewModeRef.current === 'ndvi') {
          displayImageOverlay(objectUrl, 'Sentinel-2 NDVI Imagery');
        }
      } catch {
        if (isMountedRef.current) {
          setLayerError('NDVI imagery is not available for this farm.');
        }
      } finally {
        if (isMountedRef.current) {
          setLayerLoading(false);
        }
      }
    },
    [displayImageOverlay]
  );

  // Switch between standard map, satellite view, and NDVI view
  const handleViewModeChange = useCallback((mode: FarmMapViewMode) => {
    setViewMode(mode);
    currentViewModeRef.current = mode;
    setLayerError(null);
    if (onViewModeChange) {
      onViewModeChange(mode);
    }

    if (mode === 'map') {
      removeImageOverlay();
    } else if (mode === 'satellite') {
      removeImageOverlay();
      if (farmId) {
        loadSatelliteImage(farmId);
      }
    } else if (mode === 'ndvi') {
      removeImageOverlay();
      if (farmId) {
        loadNdviImage(farmId);
      }
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);
  }, [farmId, onViewModeChange, removeImageOverlay, loadSatelliteImage, loadNdviImage]);

  // Sync controlled viewMode
  useEffect(() => {
    if (controlledViewMode && controlledViewMode !== viewMode) {
      handleViewModeChange(controlledViewMode);
    }
  }, [controlledViewMode, viewMode, handleViewModeChange]);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!farmId) return;
    if (viewMode === 'satellite') {
      loadSatelliteImage(farmId);
    } else if (viewMode === 'ndvi') {
      loadNdviImage(farmId);
    }
  };

  // Clean up Object URLs on component unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (satelliteUrlRef.current) {
        URL.revokeObjectURL(satelliteUrlRef.current);
        satelliteUrlRef.current = null;
      }
      if (ndviUrlRef.current) {
        URL.revokeObjectURL(ndviUrlRef.current);
        ndviUrlRef.current = null;
      }
    };
  }, []);

  // Clean up and reload if farmId changes
  const prevFarmIdRef = useRef<number | undefined>(farmId);
  useEffect(() => {
    if (prevFarmIdRef.current !== farmId) {
      prevFarmIdRef.current = farmId;
      if (satelliteUrlRef.current) {
        URL.revokeObjectURL(satelliteUrlRef.current);
        satelliteUrlRef.current = null;
      }
      if (ndviUrlRef.current) {
        URL.revokeObjectURL(ndviUrlRef.current);
        ndviUrlRef.current = null;
      }
      removeImageOverlay();
      if (currentViewModeRef.current === 'satellite' && farmId) {
        loadSatelliteImage(farmId);
      } else if (currentViewModeRef.current === 'ndvi' && farmId) {
        loadNdviImage(farmId);
      }
    }
  }, [farmId, removeImageOverlay, loadSatelliteImage, loadNdviImage]);



  // Toolbar Action Handlers
  const handleStartDrawPolygon = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.pm.enableDraw('Polygon', {
      snappable: true,
      snapDistance: 20,
    });
  };

  const handleStartDrawRectangle = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.pm.enableDraw('Rectangle', {
      snappable: true,
      snapDistance: 20,
    });
  };

  const handleToggleEdit = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.pm.toggleGlobalEditMode();
  };

  const handleClearBoundary = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (map.pm.globalEditModeEnabled()) {
      map.pm.disableGlobalEditMode();
    }
    map.pm.disableDraw();

    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }
    setMetrics(null);
    if (onBoundaryChangeRef.current) {
      onBoundaryChangeRef.current(null);
    }
  };

  const handleResetOrFitView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (polygonLayerRef.current) {
      map.fitBounds(polygonLayerRef.current.getBounds(), { padding: [40, 40] });
    } else {
      map.setView(center, zoom);
    }
  };

  // Sync initialBoundary updates when props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (initialBoundary?.coordinates?.[0] && initialBoundary.coordinates[0].length >= 3) {
      const latLngs = geoPolygonToLatLngs(initialBoundary);
      if (latLngs.length > 0) {
        if (polygonLayerRef.current) {
          polygonLayerRef.current.setLatLngs(latLngs);
        } else {
          const layer = L.polygon(latLngs, {
            color: '#184e36',
            fillColor: '#2bb673',
            fillOpacity: 0.35,
            weight: 3,
          }).addTo(map);
          polygonLayerRef.current = layer;

          if (!readOnly) {
            layer.on('pm:edit', () => handlePolygonUpdate(layer));
            layer.on('pm:update', () => handlePolygonUpdate(layer));
            layer.on('pm:dragend', () => handlePolygonUpdate(layer));
          }
        }

        const polyMetrics = calculatePolygonMetrics(initialBoundary.coordinates[0]);
        setMetrics(polyMetrics);

        try {
          map.fitBounds(polygonLayerRef.current.getBounds(), { padding: [40, 40], maxZoom: 16 });
        } catch {
          // Ignore
        }
      }
    } else if (!initialBoundary && polygonLayerRef.current && readOnly) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
      setMetrics(null);
    }
  }, [initialBoundary, readOnly, handlePolygonUpdate]);

  // Trigger draw when requested by parent
  useEffect(() => {
    if (triggerDraw && !readOnly && mapInstanceRef.current) {
      handleStartDrawPolygon();
    }
  }, [triggerDraw, readOnly]);

  // Determine whether to display the Satellite / Map toggle
  const showSatelliteToggle =
    showLayerSwitcher ?? (allowSatellite ?? (Boolean(farmId) && Boolean(initialBoundary?.coordinates?.[0])));

  return (
    <div className="farm-map-wrapper">
      {/* Top Action Toolbar (when editable) */}
      {!readOnly && (
        <div className="farm-map-toolbar">
          <div className="farm-map-toolbar-group">
            <button
              type="button"
              className={`btn btn-sm ${isDrawing ? 'btn-primary' : 'btn-outline'}`}
              onClick={handleStartDrawPolygon}
              title="Click points around your farm parcel to draw polygon"
            >
              <PenTool size={14} />
              <span>Draw Polygon</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={handleStartDrawRectangle}
              title="Click and drag to draw a rectangular field"
            >
              <Square size={14} />
              <span>Draw Rectangle</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm ${isEditing ? 'btn-primary' : 'btn-outline'}`}
              onClick={handleToggleEdit}
              disabled={!metrics}
              title="Click to drag or adjust boundary vertices"
            >
              <Edit3 size={14} />
              <span>{isEditing ? 'Done Editing' : 'Edit Boundary'}</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline btn-outline-danger"
              onClick={handleClearBoundary}
              disabled={!metrics}
              title="Clear current boundary and redraw"
            >
              <RotateCcw size={14} />
              <span>Clear / Redraw</span>
            </button>
          </div>

          <div className="farm-map-toolbar-group">
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={handleResetOrFitView}
              title="Center on boundary or reset view"
            >
              <Maximize2 size={14} />
              <span>{metrics ? 'Fit Boundary' : 'Reset View'}</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setShowHelp(!showHelp)}
              title="How to draw instructions"
            >
              <HelpCircle size={14} />
              <span>Instructions</span>
            </button>
          </div>
        </div>
      )}

      {/* Helpful drawing instructions dropdown / pill */}
      {showHelp && !readOnly && (
        <div className="farm-map-help-box">
          <h5>How to map your farm boundary:</h5>
          <ol>
            <li>
              Click <strong>"Draw Polygon"</strong> above or use the polygon tool on the top-left of the map.
            </li>
            <li>
              Click on each corner/edge of your farmland parcel on the map.
            </li>
            <li>
              Click on the first vertex or double-click to close and complete the boundary.
            </li>
            <li>
              Use <strong>"Edit Boundary"</strong> to drag corner vertices to fine-tune parcel lines.
            </li>
            <li>
              Review the calculated area below, then click <strong>"Save Farm"</strong>.
            </li>
          </ol>
        </div>
      )}

      {/* Main Leaflet Map Div with Overlay Controls */}
      <div
        ref={mapContainerRef}
        className="farm-map-container"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >


        {/* Small Floating Status Indicators */}
        {showSatelliteToggle && viewMode !== 'map' && layerLoading && (
          <div className="farm-map-status-pill loading" id="satellite-loading-pill">
            <div className="spinner spinner-sm" style={{ width: 14, height: 14 }} />
            <span>{viewMode === 'ndvi' ? 'Loading NDVI...' : 'Loading satellite imagery...'}</span>
          </div>
        )}

        {showSatelliteToggle && viewMode !== 'map' && layerError && (
          <div className="farm-map-status-pill error" id="satellite-error-pill">
            <AlertCircle size={14} />
            <span>{layerError}</span>
            <button
              type="button"
              className="btn-retry-pill"
              onClick={handleRetry}
              title="Try loading imagery again"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Real-time Farm Boundary HUD Badge */}
      <div className="farm-map-hud">
        {metrics ? (
          <div className="farm-map-hud-metrics">
            {viewMode === 'map' ? (
              <span className="badge badge-success">
                <CheckCircle2 size={13} /> Boundary Plotted
              </span>
            ) : layerLoading ? (
              <span className="badge badge-warning">
                <div className="spinner spinner-sm" style={{ width: 12, height: 12 }} /> NDVI Loading...
              </span>
            ) : layerError ? (
              <span className="badge badge-danger">
                <AlertCircle size={13} /> NDVI Unavailable
              </span>
            ) : (
              <span className="badge badge-success">
                <Activity size={13} /> Sentinel-2 NDVI
              </span>
            )}
            <span className="hud-metric-item">
              <strong>{metrics.vertexCount}</strong> corner vertices
            </span>
            <span className="hud-metric-divider">•</span>
            <span className="hud-metric-item">
              Area: <strong>{metrics.acres}</strong> Acres{' '}
              <span style={{ color: 'var(--text-muted)' }}>({metrics.hectares} Ha)</span>
            </span>
            {viewMode !== 'map' && !layerLoading && !layerError && (
              <>
                <span className="hud-metric-divider">•</span>
                <span className="hud-metric-item" style={{ color: 'var(--text-secondary)' }}>
                  {viewMode === 'ndvi' ? 'Vegetation Index (B08/B04)' : '10m Multispectral'}
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="farm-map-hud-empty">
            <span className="badge badge-warning">
              <AlertCircle size={13} /> Boundary Pending
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {readOnly
                ? 'No boundary polygon has been mapped for this farm.'
                : 'Click "Draw Polygon" and outline your farm land.'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

