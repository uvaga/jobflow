import { apiClient } from '@/config/api';
import type {
  VacancyProgress,
  CreateVacancyProgressDto,
  UpdateVacancyProgressDto,
  VacancyProgressFilters,
  VacancyProgressStatistics,
} from '@/types';

/**
 * Get all vacancy progress records with optional filters
 */
export const getAll = async (
  filters?: VacancyProgressFilters,
): Promise<VacancyProgress[]> => {
  const response = await apiClient.get<VacancyProgress[]>('/vacancy-progress', {
    params: filters,
  });
  return response.data;
};

/**
 * Get a single vacancy progress record by ID
 */
export const getById = async (id: string): Promise<VacancyProgress> => {
  const response = await apiClient.get<VacancyProgress>(
    `/vacancy-progress/${id}`,
  );
  return response.data;
};

/**
 * Create a new vacancy progress record
 */
export const create = async (
  data: CreateVacancyProgressDto,
): Promise<VacancyProgress> => {
  const response = await apiClient.post<VacancyProgress>(
    '/vacancy-progress',
    data,
  );
  return response.data;
};

/**
 * Update a vacancy progress record
 */
export const update = async (
  id: string,
  data: UpdateVacancyProgressDto,
): Promise<VacancyProgress> => {
  const response = await apiClient.patch<VacancyProgress>(
    `/vacancy-progress/${id}`,
    data,
  );
  return response.data;
};

/**
 * Delete a vacancy progress record
 */
export const deleteVacancyProgress = async (id: string): Promise<void> => {
  await apiClient.delete(`/vacancy-progress/${id}`);
};

/**
 * Get vacancy progress statistics
 */
export const getStatistics = async (): Promise<VacancyProgressStatistics> => {
  const response = await apiClient.get<VacancyProgressStatistics>(
    '/vacancy-progress/statistics',
  );
  return response.data;
};
