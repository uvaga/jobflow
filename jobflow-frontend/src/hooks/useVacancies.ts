import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchVacancy,
  searchVacancies,
  fetchSavedVacancies,
  addVacancy,
  removeVacancy,
  type VacancySearchParams,
} from '@/services/vacancyService';
import type { Vacancy, PaginatedResponse } from '@/types';

// Query keys for consistent cache management
export const vacancyKeys = {
  all: ['vacancies'] as const,
  lists: () => [...vacancyKeys.all, 'list'] as const,
  list: (params: VacancySearchParams) =>
    [...vacancyKeys.lists(), params] as const,
  details: () => [...vacancyKeys.all, 'detail'] as const,
  detail: (id: string) => [...vacancyKeys.details(), id] as const,
  saved: () => [...vacancyKeys.all, 'saved'] as const,
};

/**
 * Hook to fetch a single vacancy by ID
 * @param id - Vacancy ID
 * @param enabled - Whether the query should run (default: true when id is provided)
 */
export function useVacancy(id: string | undefined, enabled = true) {
  return useQuery<Vacancy, Error>({
    queryKey: id ? vacancyKeys.detail(id) : ['vacancy-placeholder'],
    queryFn: () => {
      if (!id) throw new Error('Vacancy ID is required');
      return fetchVacancy(id);
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to search vacancies with filters and pagination
 * @param params - Search parameters
 * @param enabled - Whether the query should run (default: true)
 */
export function useVacancySearch(params: VacancySearchParams, enabled = true) {
  return useQuery<PaginatedResponse<Vacancy>, Error>({
    queryKey: vacancyKeys.list(params),
    queryFn: () => searchVacancies(params),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading new page
  });
}

/**
 * Hook to fetch user's saved vacancies
 * @param enabled - Whether the query should run (default: true)
 */
export function useSavedVacancies(enabled = true) {
  return useQuery<Vacancy[], Error>({
    queryKey: vacancyKeys.saved(),
    queryFn: fetchSavedVacancies,
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to add a vacancy to user's saved list
 * Automatically invalidates saved vacancies cache on success
 */
export function useAddVacancy() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: addVacancy,
    onSuccess: () => {
      // Invalidate saved vacancies to refetch updated list
      void queryClient.invalidateQueries({ queryKey: vacancyKeys.saved() });
    },
  });
}

/**
 * Hook to remove a vacancy from user's saved list
 * Automatically invalidates saved vacancies cache on success
 */
export function useRemoveVacancy() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: removeVacancy,
    onSuccess: () => {
      // Invalidate saved vacancies to refetch updated list
      void queryClient.invalidateQueries({ queryKey: vacancyKeys.saved() });
    },
  });
}
