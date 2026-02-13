import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchVacancy,
  searchVacancies,
  fetchSavedVacancies,
  fetchSavedVacancyDetail,
  addVacancy,
  removeVacancy,
  refreshSavedVacancy,
  updateVacancyProgress,
  updateVacancyNotes,
  updateVacancyChecklist,
  type VacancySearchParams,
  type SavedVacanciesParams,
} from '@/services/vacancyService';
import type { Vacancy, PaginatedResponse, SavedVacanciesResponse, SavedVacancyEntry, ChecklistItem } from '@/types';
import { useToast } from './useToast';

// Query keys for consistent cache management
export const vacancyKeys = {
  all: ['vacancies'] as const,
  lists: () => [...vacancyKeys.all, 'list'] as const,
  list: (params: VacancySearchParams) =>
    [...vacancyKeys.lists(), params] as const,
  details: () => [...vacancyKeys.all, 'detail'] as const,
  detail: (id: string) => [...vacancyKeys.details(), id] as const,
  saved: () => [...vacancyKeys.all, 'saved'] as const,
  savedList: (params?: SavedVacanciesParams) =>
    [...vacancyKeys.saved(), 'list', params] as const,
  savedDetail: (hhId: string) =>
    [...vacancyKeys.saved(), 'detail', hhId] as const,
};

/**
 * Hook to fetch a single vacancy by ID
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
 */
export function useVacancySearch(params: VacancySearchParams, enabled = true) {
  return useQuery<PaginatedResponse<Vacancy>, Error>({
    queryKey: vacancyKeys.list(params),
    queryFn: () => searchVacancies(params),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch user's saved vacancies with filtering and pagination
 */
export function useSavedVacancies(params?: SavedVacanciesParams, enabled = true) {
  return useQuery<SavedVacanciesResponse, Error>({
    queryKey: vacancyKeys.savedList(params),
    queryFn: () => fetchSavedVacancies(params),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch a single saved vacancy detail by hh.ru ID
 */
export function useSavedVacancyDetail(hhId: string | undefined, enabled = true) {
  return useQuery<SavedVacancyEntry, Error>({
    queryKey: hhId ? vacancyKeys.savedDetail(hhId) : ['saved-vacancy-placeholder'],
    queryFn: () => {
      if (!hhId) throw new Error('Vacancy hhId is required');
      return fetchSavedVacancyDetail(hhId);
    },
    enabled: enabled && !!hhId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to add a vacancy to user's saved list
 */
export function useAddVacancy() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<void, Error, string>({
    mutationFn: addVacancy,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vacancyKeys.saved() });
      showSuccess('Vacancy saved successfully');
    },
    onError: (error: Error) => {
      showError('Failed to save vacancy. Please try again.');
      console.error('Failed to add vacancy:', error);
    },
  });
}

/**
 * Hook to remove a vacancy from user's saved list
 */
export function useRemoveVacancy() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<void, Error, string>({
    mutationFn: removeVacancy,
    onSuccess: () => {
      // Only invalidate saved list queries — not detail queries.
      // If removing from the detail page, the detail observer would cause a
      // 404 refetch before the component navigates away and unmounts.
      void queryClient.invalidateQueries({
        queryKey: [...vacancyKeys.saved(), 'list'],
      });
      showSuccess('Vacancy removed from saved list');
    },
    onError: (error: Error) => {
      showError('Failed to remove vacancy. Please try again.');
      console.error('Failed to remove vacancy:', error);
    },
  });
}

/**
 * Hook to refresh a saved vacancy from hh.ru API
 */
export function useRefreshSavedVacancy() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<Vacancy, Error, string>({
    mutationFn: refreshSavedVacancy,
    onSuccess: (_data, hhId) => {
      void queryClient.invalidateQueries({ queryKey: vacancyKeys.saved() });
      void queryClient.invalidateQueries({ queryKey: vacancyKeys.savedDetail(hhId) });
      showSuccess('Vacancy data refreshed');
    },
    onError: (error: Error) => {
      showError('Failed to refresh vacancy. Please try again.');
      console.error('Failed to refresh vacancy:', error);
    },
  });
}

/**
 * Hook to update progress status for a saved vacancy
 */
export function useUpdateSavedVacancyProgress() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<SavedVacancyEntry, Error, { hhId: string; status: string }>({
    mutationFn: ({ hhId, status }) => updateVacancyProgress(hhId, status),
    onSuccess: (_data, { hhId }) => {
      void queryClient.invalidateQueries({ queryKey: vacancyKeys.saved() });
      void queryClient.invalidateQueries({ queryKey: vacancyKeys.savedDetail(hhId) });
      showSuccess('Progress updated');
    },
    onError: (error: Error) => {
      showError('Failed to update progress. Please try again.');
      console.error('Failed to update progress:', error);
    },
  });
}

/**
 * Hook to update notes for a saved vacancy
 */
export function useUpdateSavedVacancyNotes() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<SavedVacancyEntry, Error, { hhId: string; notes: string }>({
    mutationFn: ({ hhId, notes }) => updateVacancyNotes(hhId, notes),
    onSuccess: (_data, { hhId }) => {
      void queryClient.invalidateQueries({ queryKey: vacancyKeys.savedDetail(hhId) });
      showSuccess('Notes saved');
    },
    onError: (error: Error) => {
      showError('Failed to save notes. Please try again.');
      console.error('Failed to save notes:', error);
    },
  });
}

/**
 * Hook to update checklist for a saved vacancy
 */
export function useUpdateSavedVacancyChecklist() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<SavedVacancyEntry, Error, { hhId: string; checklist: ChecklistItem[] }>({
    mutationFn: ({ hhId, checklist }) => updateVacancyChecklist(hhId, checklist),
    onSuccess: (_data, { hhId }) => {
      void queryClient.invalidateQueries({ queryKey: vacancyKeys.savedDetail(hhId) });
      showSuccess('Checklist updated');
    },
    onError: (error: Error) => {
      showError('Failed to update checklist. Please try again.');
      console.error('Failed to update checklist:', error);
    },
  });
}
