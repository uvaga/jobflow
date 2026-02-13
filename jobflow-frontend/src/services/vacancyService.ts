import { apiClient } from '@/config/api';
import type { Vacancy, PaginatedResponse, SavedVacanciesResponse, SavedVacancyEntry, ChecklistItem } from '@/types';
import type { ApiResponse } from '@/types/api.types';

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

export interface SavedVacanciesParams {
  status?: string;
  sortBy?: 'savedDate' | 'name';
  sortOrder?: 'asc' | 'desc';
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
    '/vacancies/search',
    {
      params,
    },
  );
  return response.data;
};

/**
 * Fetch user's saved vacancies with filtering and pagination
 * Note: Backend TransformInterceptor wraps response in { data: {...} }
 */
export const fetchSavedVacancies = async (
  params?: SavedVacanciesParams,
): Promise<SavedVacanciesResponse> => {
  const response = await apiClient.get<ApiResponse<SavedVacanciesResponse>>(
    '/users/me/vacancies',
    { params },
  );
  return response.data.data;
};

/**
 * Fetch a single saved vacancy detail by hh.ru ID
 * Note: Backend TransformInterceptor wraps response in { data: {...} }
 */
export const fetchSavedVacancyDetail = async (
  hhId: string,
): Promise<SavedVacancyEntry> => {
  const response = await apiClient.get<ApiResponse<SavedVacancyEntry>>(
    `/users/me/vacancies/${hhId}`,
  );
  return response.data.data;
};

/**
 * Add a vacancy to user's saved list (fetches from hh.ru and stores permanently)
 */
export const addVacancy = async (hhId: string): Promise<void> => {
  await apiClient.post(`/users/me/vacancies/${hhId}`);
};

/**
 * Remove a vacancy from user's saved list
 */
export const removeVacancy = async (hhId: string): Promise<void> => {
  await apiClient.delete(`/users/me/vacancies/${hhId}`);
};

/**
 * Refresh a saved vacancy from hh.ru API
 * Note: Backend TransformInterceptor wraps response in { data: {...} }
 */
export const refreshSavedVacancy = async (hhId: string): Promise<Vacancy> => {
  const response = await apiClient.post<ApiResponse<Vacancy>>(
    `/users/me/vacancies/${hhId}/refresh`,
  );
  return response.data.data;
};

/**
 * Update progress status for a saved vacancy
 * Note: Backend TransformInterceptor wraps response in { data: {...} }
 */
export const updateVacancyProgress = async (
  hhId: string,
  status: string,
): Promise<SavedVacancyEntry> => {
  const response = await apiClient.patch<ApiResponse<SavedVacancyEntry>>(
    `/users/me/vacancies/${hhId}/progress`,
    { status },
  );
  return response.data.data;
};

/**
 * Update notes for a saved vacancy
 * Note: Backend TransformInterceptor wraps response in { data: {...} }
 */
export const updateVacancyNotes = async (
  hhId: string,
  notes: string,
): Promise<SavedVacancyEntry> => {
  const response = await apiClient.patch<ApiResponse<SavedVacancyEntry>>(
    `/users/me/vacancies/${hhId}/notes`,
    { notes },
  );
  return response.data.data;
};

/**
 * Update checklist for a saved vacancy
 * Note: Backend TransformInterceptor wraps response in { data: {...} }
 */
export const updateVacancyChecklist = async (
  hhId: string,
  checklist: ChecklistItem[],
): Promise<SavedVacancyEntry> => {
  const response = await apiClient.patch<ApiResponse<SavedVacancyEntry>>(
    `/users/me/vacancies/${hhId}/checklist`,
    { checklist },
  );
  return response.data.data;
};
