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
  Map as MapIcon,
  Satellite,
} from 'lucide-react';

import type { GeoPolygon } from '../../types/farm';
import {
  latLngsToGeoPolygon,
  geoPolygonToLatLngs,
  calculatePolygonMetrics,
  type PolygonMetrics,
} from '../../utils/geoUtils';
import { getFarmSatelliteImageApi } from '../../api/satellite';

// Sensible default map center: Agricultural hub in Punjab / Pakistan
const DEFAULT_CENTER: [number, number] = [31.5204, 73.5];
const DEFAULT_ZOOM = 9;

export interface FarmMapProps {
  initialBoundary?: GeoPolygon | null;
  onBoundaryChange?: (boundary: GeoPolygon | null) => void;
  readOnly?: boolean;
  height?: string | number;
  center?: [number, number];
  zoom?: number;
  farmId?: number;
  allowSatellite?: boolean;
  defaultViewMode?: 'map' | 'satellite';
  onViewModeChange?: (mode: 'map' | 'satellite') => void;
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
  defaultViewMode = 'map',
  onViewModeChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);

  const [viewMode, setViewMode] = useState<'map' | 'satellite'>(defaultViewMode);
  const [satelliteLoading, setSatelliteLoading] = useState(false);
  const [satelliteError, setSatelliteError] = useState<string | null>(null);

  const satelliteUrlRef = useRef<string | null>(null);
  const imageOverlayRef = useRef<L.ImageOverlay | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const currentViewModeRef = useRef<'map' | 'satellite'>(viewMode);
  const activeFetchFarmIdRef = useRef<number | null>(null);

  useEffect(() => {
    currentViewModeRef.current = viewMode;
  }, [viewMode]);

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

  // Display satellite image overlay covering the farm's geographic bounds
  const displaySatelliteOverlay = useCallback(
    (url: string) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const bounds = getPolygonBounds();
      if (!bounds || !bounds.isValid()) {
        setSatelliteError('Unable to load satellite imagery.');
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
        alt: 'Sentinel-2 Satellite Imagery',
      });

      overlay.addTo(map);
      imageOverlayRef.current = overlay;

      // Keep polygon boundary visible on top of satellite imagery
      if (polygonLayerRef.current) {
        polygonLayerRef.current.bringToFront();
      }
    },
    [getPolygonBounds]
  );

  // Remove satellite image overlay from map
  const removeSatelliteOverlay = useCallback(() => {
    if (imageOverlayRef.current) {
      imageOverlayRef.current.remove();
      imageOverlayRef.current = null;
    }
  }, []);

  // Request satellite imagery using authenticated API client
  const loadSatelliteImage = useCallback(
    async (targetFarmId: number) => {
      if (satelliteUrlRef.current) {
        displaySatelliteOverlay(satelliteUrlRef.current);
        return;
      }

      setSatelliteLoading(true);
      setSatelliteError(null);
      activeFetchFarmIdRef.current = targetFarmId;

      try {
        const blob = await getFarmSatelliteImageApi(targetFarmId);
        if (!isMountedRef.current || activeFetchFarmIdRef.current !== targetFarmId) {
          return;
        }

        const objectUrl = URL.createObjectURL(blob);
        satelliteUrlRef.current = objectUrl;

        if (currentViewModeRef.current === 'satellite') {
          displaySatelliteOverlay(objectUrl);
        }
      } catch {
        if (isMountedRef.current) {
          setSatelliteError('Unable to load satellite imagery.');
        }
      } finally {
        if (isMountedRef.current) {
          setSatelliteLoading(false);
        }
      }
    },
    [displaySatelliteOverlay]
  );

  // Switch between standard map and satellite view
  const handleViewModeChange = (mode: 'map' | 'satellite') => {
    if (mode === viewMode) return;
    setViewMode(mode);
    currentViewModeRef.current = mode;
    if (onViewModeChange) {
      onViewModeChange(mode);
    }

    if (mode === 'satellite') {
      if (farmId) {
        loadSatelliteImage(farmId);
      }
    } else {
      removeSatelliteOverlay();
      setSatelliteError(null);
    }
  };

  const handleRetrySatellite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (farmId) {
      loadSatelliteImage(farmId);
    }
  };

  // Clean up Object URL on component unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (satelliteUrlRef.current) {
        URL.revokeObjectURL(satelliteUrlRef.current);
        satelliteUrlRef.current = null;
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
      removeSatelliteOverlay();
      if (currentViewModeRef.current === 'satellite' && farmId) {
        loadSatelliteImage(farmId);
      }
    }
  }, [farmId, removeSatelliteOverlay, loadSatelliteImage]);


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

  // Determine whether to display the Satellite / Map toggle
  const showSatelliteToggle =
    allowSatellite ?? (Boolean(farmId) && Boolean(initialBoundary?.coordinates?.[0]));

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
        {/* Map Layer Switcher: Normal Street Map vs Sentinel-2 Satellite Imagery */}
        {showSatelliteToggle && (
          <div className="farm-map-layer-control" role="group" aria-label="Map Layer Toggle">
            <button
              type="button"
              className={`farm-map-layer-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('map')}
              id="farm-map-view-normal"
              title="OpenStreetMap Standard View"
            >
              <MapIcon size={14} />
              <span>Map</span>
            </button>
            <button
              type="button"
              className={`farm-map-layer-btn ${viewMode === 'satellite' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('satellite')}
              id="farm-map-view-satellite"
              title="Sentinel-2 Satellite View"
            >
              <Satellite size={14} />
              <span>Satellite</span>
            </button>
          </div>
        )}

        {/* Small Floating Status Indicators */}
        {showSatelliteToggle && viewMode === 'satellite' && satelliteLoading && (
          <div className="farm-map-status-pill loading" id="satellite-loading-pill">
            <div className="spinner spinner-sm" style={{ width: 14, height: 14 }} />
            <span>Loading satellite imagery...</span>
          </div>
        )}

        {showSatelliteToggle && viewMode === 'satellite' && satelliteError && (
          <div className="farm-map-status-pill error" id="satellite-error-pill">
            <AlertCircle size={14} />
            <span>{satelliteError}</span>
            <button
              type="button"
              className="btn-retry-pill"
              onClick={handleRetrySatellite}
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
            {viewMode === 'satellite' ? (
              satelliteLoading ? (
                <span className="badge badge-warning">
                  <div className="spinner spinner-sm" style={{ width: 12, height: 12 }} /> Satellite Loading...
                </span>
              ) : satelliteError ? (
                <span className="badge badge-danger">
                  <AlertCircle size={13} /> Satellite Unavailable
                </span>
              ) : (
                <span className="badge badge-success">
                  <Satellite size={13} /> Sentinel-2 True Color
                </span>
              )
            ) : (
              <span className="badge badge-success">
                <CheckCircle2 size={13} /> Boundary Plotted
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
            {viewMode === 'satellite' && !satelliteLoading && !satelliteError && (
              <>
                <span className="hud-metric-divider">•</span>
                <span className="hud-metric-item" style={{ color: 'var(--text-secondary)' }}>
                  10m Multispectral
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

