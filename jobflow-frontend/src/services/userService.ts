import { apiClient } from '@/config/api';
import type { User } from '@/types';
import type { ApiResponse } from '@/types/api.types';

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

/**
 * Get current user profile
 */
export const getProfile = async (): Promise<User> => {
  const response = await apiClient.get<ApiResponse<User>>('/users/me');
  return response.data.data;
};

/**
 * Update current user profile
 */
export const updateProfile = async (data: UpdateUserDto): Promise<User> => {
  const response = await apiClient.put<ApiResponse<User>>('/users/me', data);
  return response.data.data;
};

/**
 * Change current user password
 */
export const changePassword = async (data: ChangePasswordDto): Promise<{ message: string }> => {
  const response = await apiClient.patch<ApiResponse<{ message: string }>>('/users/me/password', data);
  return response.data.data;
};
