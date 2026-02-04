import { apiClient } from '@/config/api';
import type { User } from '@/types';

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
}

/**
 * Get current user profile
 */
export const getProfile = async (): Promise<User> => {
  const response = await apiClient.get<User>('/users/me');
  return response.data;
};

/**
 * Update current user profile
 */
export const updateProfile = async (data: UpdateUserDto): Promise<User> => {
  const response = await apiClient.put<User>('/users/me', data);
  return response.data;
};
