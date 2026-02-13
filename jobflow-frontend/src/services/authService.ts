import { apiClient } from '@/config/api';
import type { ApiResponse } from '@/types/api.types';

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Register a new user
 */
export const register = async (data: RegisterDto): Promise<AuthResponse> => {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
  return response.data.data;
};

/**
 * Login user
 */
export const login = async (data: LoginDto): Promise<AuthResponse> => {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
  return response.data.data;
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (refreshToken) {
    await apiClient.post('/auth/logout', {}, {
      headers: { Authorization: `Bearer ${refreshToken}` }
    });
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (): Promise<AuthResponse> => {
  const token = localStorage.getItem('refreshToken');
  const response = await apiClient.post<ApiResponse<AuthResponse>>(
    '/auth/refresh',
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.data;
};
