import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAll,
  getById,
  create,
  update,
  deleteVacancyProgress,
  getStatistics,
} from '@/services/vacancyProgressService';
import type {
  VacancyProgress,
  CreateVacancyProgressDto,
  UpdateVacancyProgressDto,
  VacancyProgressFilters,
  VacancyProgressStatistics,
} from '@/types';

// Query keys for consistent cache management
export const vacancyProgressKeys = {
  all: ['vacancyProgress'] as const,
  lists: () => [...vacancyProgressKeys.all, 'list'] as const,
  list: (filters?: VacancyProgressFilters) =>
    [...vacancyProgressKeys.lists(), filters] as const,
  details: () => [...vacancyProgressKeys.all, 'detail'] as const,
  detail: (id: string) => [...vacancyProgressKeys.details(), id] as const,
  statistics: () => [...vacancyProgressKeys.all, 'statistics'] as const,
};

/**
 * Hook to fetch all vacancy progress records with optional filters
 * @param filters - Optional filters (status, priority, tags)
 * @param enabled - Whether the query should run (default: true)
 */
export function useVacancyProgress(
  filters?: VacancyProgressFilters,
  enabled = true,
) {
  return useQuery<VacancyProgress[], Error>({
    queryKey: vacancyProgressKeys.list(filters),
    queryFn: () => getAll(filters),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch a single vacancy progress record by ID
 * @param id - VacancyProgress ID
 * @param enabled - Whether the query should run (default: true when id is provided)
 */
export function useVacancyProgressDetail(
  id: string | undefined,
  enabled = true,
) {
  return useQuery<VacancyProgress, Error>({
    queryKey: id
      ? vacancyProgressKeys.detail(id)
      : ['vacancyProgress-placeholder'],
    queryFn: () => {
      if (!id) throw new Error('VacancyProgress ID is required');
      return getById(id);
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch vacancy progress statistics
 * @param enabled - Whether the query should run (default: true)
 */
export function useVacancyProgressStatistics(enabled = true) {
  return useQuery<VacancyProgressStatistics, Error>({
    queryKey: vacancyProgressKeys.statistics(),
    queryFn: getStatistics,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new vacancy progress record
 * Automatically invalidates vacancy progress cache on success
 */
export function useCreateVacancyProgress() {
  const queryClient = useQueryClient();

  return useMutation<VacancyProgress, Error, CreateVacancyProgressDto>({
    mutationFn: create,
    onSuccess: () => {
      // Invalidate all vacancy progress queries
      void queryClient.invalidateQueries({
        queryKey: vacancyProgressKeys.all,
      });
    },
  });
}

/**
 * Hook to update a vacancy progress record
 * Automatically invalidates cache on success
 */
export function useUpdateVacancyProgress() {
  const queryClient = useQueryClient();

  return useMutation<
    VacancyProgress,
    Error,
    { id: string; data: UpdateVacancyProgressDto }
  >({
    mutationFn: ({ id, data }) => update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific item and all lists
      void queryClient.invalidateQueries({
        queryKey: vacancyProgressKeys.detail(variables.id),
      });
      void queryClient.invalidateQueries({
        queryKey: vacancyProgressKeys.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: vacancyProgressKeys.statistics(),
      });
    },
  });
}

/**
 * Hook to delete a vacancy progress record
 * Automatically invalidates cache on success
 */
export function useDeleteVacancyProgress() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteVacancyProgress,
    onSuccess: () => {
      // Invalidate all vacancy progress queries
      void queryClient.invalidateQueries({
        queryKey: vacancyProgressKeys.all,
      });
    },
  });
}
