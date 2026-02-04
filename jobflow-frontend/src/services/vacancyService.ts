import { apiClient } from '@/config/api';
import { Vacancy, PaginatedResponse } from '@/types';

export interface VacancySearchParams {
  query?: string;
  areaId?: string;
  salaryFrom?: number;
  experienceId?: string;
  scheduleId?: string;
  employmentId?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch a single vacancy by ID
 */
export const fetchVacancy = async (id: string): Promise<Vacancy> => {
  const response = await apiClient.get<Vacancy>(`/vacancies/${id}`);
  return response.data;
};

/**
 * Search vacancies with filters and pagination
 */
export const searchVacancies = async (
  params: VacancySearchParams,
): Promise<PaginatedResponse<Vacancy>> => {
  const response = await apiClient.get<PaginatedResponse<Vacancy>>(
    '/vacancies',
    {
      params,
    },
  );
  return response.data;
};

/**
 * Fetch user's saved vacancies
 */
export const fetchSavedVacancies = async (): Promise<Vacancy[]> => {
  const response = await apiClient.get<{ vacancies: Vacancy[] }>(
    '/users/me/vacancies',
  );
  return response.data.vacancies;
};

/**
 * Add a vacancy to user's saved list
 */
export const addVacancy = async (vacancyId: string): Promise<void> => {
  await apiClient.post(`/users/me/vacancies/${vacancyId}`);
};

/**
 * Remove a vacancy from user's saved list
 */
export const removeVacancy = async (vacancyId: string): Promise<void> => {
  await apiClient.delete(`/users/me/vacancies/${vacancyId}`);
};
