import { apiClient } from './client';
import type { Farm, CreateFarmPayload, UpdateFarmPayload } from '../types/farm';


export const getFarmsApi = async (): Promise<Farm[]> => {
  const response = await apiClient.get<Farm[]>('/farms/');
  return response.data;
};

export const getFarmByIdApi = async (id: number): Promise<Farm> => {
  const response = await apiClient.get<Farm>(`/farms/${id}/`);
  return response.data;
};

export const createFarmApi = async (data: CreateFarmPayload): Promise<Farm> => {
  const response = await apiClient.post<Farm>('/farms/', data);
  return response.data;
};

export const updateFarmApi = async (id: number, data: UpdateFarmPayload): Promise<Farm> => {
  const response = await apiClient.patch<Farm>(`/farms/${id}/`, data);
  return response.data;
};

export const deleteFarmApi = async (id: number): Promise<void> => {
  await apiClient.delete(`/farms/${id}/`);
};

export { getFarmSatelliteImageApi, getFarmNdviImageApi } from './satellite';


