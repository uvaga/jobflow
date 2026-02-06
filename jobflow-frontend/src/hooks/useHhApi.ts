import { useQuery } from '@tanstack/react-query';
import {
  searchHhVacancies,
  getHhVacancy,
  type HhSearchParams,
  type HhSearchResponse,
  type HhVacancyDetail,
} from '@/services/hhApiService';

// Query keys for hh.ru API
export const hhApiKeys = {
  all: ['hh'] as const,
  vacancies: () => [...hhApiKeys.all, 'vacancies'] as const,
  vacancyList: (params: HhSearchParams) => [...hhApiKeys.vacancies(), params] as const,
  vacancy: (id: string) => [...hhApiKeys.vacancies(), id] as const,
};

/**
 * Hook to search vacancies on hh.ru API
 */
export function useHhVacancySearch(params: HhSearchParams, enabled = true) {
  return useQuery<HhSearchResponse, Error>({
    queryKey: hhApiKeys.vacancyList(params),
    queryFn: () => searchHhVacancies(params),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to get single vacancy from hh.ru API
 * Uses longer cache time (10 min) since vacancy details change less frequently
 */
export function useHhVacancy(id: string | undefined, enabled = true) {
  return useQuery<HhVacancyDetail, Error>({
    queryKey: id ? hhApiKeys.vacancy(id) : ['hh-vacancy-placeholder'],
    queryFn: () => {
      if (!id) throw new Error('Vacancy ID is required');
      return getHhVacancy(id);
    },
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes - details change less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
    retry: 2,
  });
}
