import { apiClient } from './client';

/**
 * Fetches Sentinel-2 true-color satellite imagery for a specific farm parcel.
 * Uses the existing authenticated Axios client to attach the Bearer token.
 * Returns the raw binary image as a Blob.
 */
export const getFarmSatelliteImageApi = async (farmId: number): Promise<Blob> => {
  const response = await apiClient.get<Blob>(`/satellite/farms/${farmId}/image/`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Fetches Sentinel-2 NDVI (Normalized Difference Vegetation Index) imagery for a specific farm parcel.
 * Uses the existing authenticated Axios client to attach the Bearer token.
 * Returns the raw binary image as a Blob.
 */
export const getFarmNdviImageApi = async (farmId: number): Promise<Blob> => {
  const response = await apiClient.get<Blob>(`/satellite/farms/${farmId}/ndvi/`, {
    responseType: 'blob',
  });
  return response.data;
};

