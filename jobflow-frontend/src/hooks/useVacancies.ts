import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
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
 * Uses optimistic updates for instant UI feedback.
 */
export function useAddVacancy() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<void, Error, string, { previousData: [QueryKey, SavedVacanciesResponse | undefined][] }>({
    mutationFn: addVacancy,

    onMutate: async (hhId) => {
      await queryClient.cancelQueries({ queryKey: vacancyKeys.saved() });

      const previousData = queryClient.getQueriesData<SavedVacanciesResponse>({
        queryKey: [...vacancyKeys.saved(), 'list'],
      });

      const stubEntry: SavedVacancyEntry = {
        vacancy: { hhId } as Vacancy,
        progress: [],
        notes: '',
        checklist: [],
      };

      for (const [queryKey, data] of previousData) {
        if (data) {
          queryClient.setQueryData<SavedVacanciesResponse>(queryKey, {
            ...data,
            items: [...data.items, stubEntry],
            total: data.total + 1,
          });
        }
      }

      return { previousData };
    },

    onSuccess: () => {
      showSuccess('Vacancy saved successfully');
    },

    onError: (error, _hhId, context) => {
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      showError('Failed to save vacancy. Please try again.');
      console.error('Failed to add vacancy:', error);
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: vacancyKeys.saved() });
    },
  });
}

/**
 * Hook to remove a vacancy from user's saved list
 * Uses optimistic updates for instant UI feedback.
 * Only invalidates saved list queries (not detail) to avoid 404 refetch on detail page.
 */
export function useRemoveVacancy() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<void, Error, string, { previousData: [QueryKey, SavedVacanciesResponse | undefined][] }>({
    mutationFn: removeVacancy,

    onMutate: async (hhId) => {
      await queryClient.cancelQueries({ queryKey: vacancyKeys.saved() });

      const previousData = queryClient.getQueriesData<SavedVacanciesResponse>({
        queryKey: [...vacancyKeys.saved(), 'list'],
      });

      for (const [queryKey, data] of previousData) {
        if (data) {
          queryClient.setQueryData<SavedVacanciesResponse>(queryKey, {
            ...data,
            items: data.items.filter((entry) => entry.vacancy?.hhId !== hhId),
            total: Math.max(0, data.total - 1),
          });
        }
      }

      return { previousData };
    },

    onSuccess: () => {
      showSuccess('Vacancy removed from saved list');
    },

    onError: (error, _hhId, context) => {
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      showError('Failed to remove vacancy. Please try again.');
      console.error('Failed to remove vacancy:', error);
    },

    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: [...vacancyKeys.saved(), 'list'],
      });
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
