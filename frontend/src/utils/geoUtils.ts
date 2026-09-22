import type { GeoPolygon } from '../types/farm';

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface PolygonMetrics {
  vertexCount: number;
  squareMeters: number;
  hectares: number;
  acres: number;
}

/**
 * Converts an array of LatLng objects into a valid GeoJSON Polygon object.
 * Format: coordinates: [[[longitude, latitude], ...]]
 * Ensures the linear ring has at least 4 coordinates and is closed (first == last).
 */
export const latLngsToGeoPolygon = (latLngs: LatLngPoint[]): GeoPolygon | null => {
  if (!latLngs || latLngs.length < 3) {
    return null;
  }

  // Map to [longitude, latitude] with clean precision
  const ring: number[][] = latLngs.map((pt) => [
    Number(pt.lng.toFixed(6)),
    Number(pt.lat.toFixed(6)),
  ]);

  // Ensure closed ring: first point must equal last point
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
  }

  // Check that the ring has at least 4 coordinates (3 distinct vertices + closing point)
  if (ring.length < 4) {
    return null;
  }

  return {
    type: 'Polygon',
    coordinates: [ring],
  };
};

/**
 * Converts a GeoJSON Polygon linear ring into an array of Leaflet [latitude, longitude] tuples.
 */
export const geoPolygonToLatLngs = (geoPolygon: GeoPolygon): [number, number][] => {
  if (!geoPolygon?.coordinates?.[0]) {
    return [];
  }

  const ring = geoPolygon.coordinates[0];
  return ring.map(([lng, lat]) => [lat, lng]);
};

/**
 * Client-side validation matching backend Django FarmSerializer validate_boundary
 */
export const validateGeoPolygon = (
  polygon: GeoPolygon | null
): { isValid: boolean; error?: string } => {
  if (!polygon) {
    return { isValid: false, error: 'No farm boundary has been drawn.' };
  }

  if (polygon.type !== 'Polygon') {
    return { isValid: false, error: "Boundary type must be 'Polygon'." };
  }

  if (!Array.isArray(polygon.coordinates) || polygon.coordinates.length !== 1) {
    return { isValid: false, error: 'Polygon coordinates must contain exactly one linear ring.' };
  }

  const ring = polygon.coordinates[0];
  if (!Array.isArray(ring) || ring.length < 4) {
    return { isValid: false, error: 'A polygon must contain at least 3 distinct boundary vertices.' };
  }

  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    return { isValid: false, error: 'The first and last polygon coordinates must be identical.' };
  }

  for (const point of ring) {
    if (!Array.isArray(point) || point.length !== 2 || typeof point[0] !== 'number' || typeof point[1] !== 'number') {
      return { isValid: false, error: 'Each coordinate must be [longitude, latitude].' };
    }

    const [lng, lat] = point;
    if (lng < -180 || lng > 180) {
      return { isValid: false, error: 'Longitude must be between -180 and 180.' };
    }
    if (lat < -90 || lat > 90) {
      return { isValid: false, error: 'Latitude must be between -90 and 90.' };
    }
  }

  return { isValid: true };
};

/**
 * Calculates approximate surface area of a polygon defined by [longitude, latitude] coordinates
 * using projected planar projection (equirectangular approximation suitable for farm parcels).
 */
export const calculatePolygonMetrics = (coordinates: number[][]): PolygonMetrics => {
  if (!coordinates || coordinates.length < 4) {
    return { vertexCount: 0, squareMeters: 0, hectares: 0, acres: 0 };
  }

  // Count distinct vertices (exclude the duplicated closing point)
  const vertexCount = coordinates.length - 1;

  // Earth radius in meters
  const R = 6378137;
  const toRad = Math.PI / 180;

  // Mean latitude
  let sumLat = 0;
  for (let i = 0; i < vertexCount; i++) {
    sumLat += coordinates[i][1];
  }
  const meanLatRad = (sumLat / vertexCount) * toRad;
  const cosMeanLat = Math.cos(meanLatRad);

  // Convert to planar coordinates (meters)
  const points = coordinates.map(([lng, lat]) => ({
    x: R * lng * toRad * cosMeanLat,
    y: R * lat * toRad,
  }));

  // Standard shoelace formula
  let areaM2 = 0;
  for (let i = 0; i < points.length - 1; i++) {
    areaM2 += points[i].x * points[i + 1].y - points[i + 1].x * points[i].y;
  }
  areaM2 = Math.abs(areaM2) / 2;

  const hectares = areaM2 / 10000;
  const acres = areaM2 / 4046.85642;

  return {
    vertexCount,
    squareMeters: Math.round(areaM2),
    hectares: Number(hectares.toFixed(2)),
    acres: Number(acres.toFixed(2)),
  };
};
