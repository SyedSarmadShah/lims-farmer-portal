import { apiClient } from './client';
import type {
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  User,
  ProfileUpdatePayload,
} from '../types/auth';


export const loginApi = async (credentials: LoginPayload): Promise<AuthTokens> => {
  const response = await apiClient.post<AuthTokens>('/accounts/login/', credentials);
  return response.data;
};

export const registerApi = async (payload: RegisterPayload): Promise<User> => {
  const response = await apiClient.post<User>('/accounts/register/', payload);
  return response.data;
};

export const getProfileApi = async (): Promise<User> => {
  const response = await apiClient.get<User>('/accounts/profile/');
  return response.data;
};

export const updateProfileApi = async (payload: ProfileUpdatePayload): Promise<User> => {
  const response = await apiClient.patch<User>('/accounts/profile/', payload);
  return response.data;
};
