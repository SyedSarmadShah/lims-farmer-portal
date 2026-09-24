export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // GeoJSON Polygon linear ring: [[[lng, lat], [lng, lat], ...]]
}

export interface Farm {
  id: number;
  name: string;
  owner: number;
  location: string;
  boundary: GeoPolygon | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFarmPayload {
  name: string;
  location?: string;
  boundary?: GeoPolygon | null;
}

export interface UpdateFarmPayload {
  name?: string;
  location?: string;
  boundary?: GeoPolygon | null;
}

export type { NDVIStatistics } from './satellite';

