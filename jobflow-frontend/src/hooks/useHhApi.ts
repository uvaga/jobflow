import { useQuery } from '@tanstack/react-query';
import {
  searchHhVacancies,
  getHhVacancy,
  getHhDictionaries,
  getHhCountries,
  getHhAreaById,
  getHhProfessionalRoles,
  getHhIndustries,
  flattenProfessionalRoles,
  flattenIndustries,
  type HhSearchParams,
  type HhSearchResponse,
  type HhVacancyDetail,
  type HhDictionaries,
  type HhAreaDetail,
  type HhProfessionalRole,
  type HhProfessionalRolesResponse,
  type HhIndustryItem,
  type HhIndustriesResponse,
} from '@/services/hhApiService';

// Query keys for hh.ru API
export const hhApiKeys = {
  all: ['hh'] as const,
  vacancies: () => [...hhApiKeys.all, 'vacancies'] as const,
  vacancyList: (params: HhSearchParams) => [...hhApiKeys.vacancies(), params] as const,
  vacancy: (id: string) => [...hhApiKeys.vacancies(), id] as const,
  dictionaries: () => [...hhApiKeys.all, 'dictionaries'] as const,
  areas: () => [...hhApiKeys.all, 'areas'] as const,
  countries: () => [...hhApiKeys.areas(), 'countries'] as const,
  professionalAreas: () => [...hhApiKeys.all, 'professional-areas'] as const,
  industries: () => [...hhApiKeys.all, 'industries'] as const,
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

/**
 * Hook to get HH.ru dictionaries (employment, schedule, experience, etc.)
 * Uses React Query in-memory cache
 */
export function useHhDictionaries(enabled = true) {
  return useQuery<HhDictionaries, Error>({
    queryKey: hhApiKeys.dictionaries(),
    queryFn: () => getHhDictionaries(),
    enabled,
    retry: 1,
    staleTime: 1000 * 60 * 60, // 1 hour - dictionaries change rarely
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  });
}

/**
 * Hook to get HH.ru countries list (lazy-loaded)
 * Fetches from /areas/countries endpoint (lightweight)
 */
export function useHhCountries(enabled = true) {
  return useQuery<HhAreaDetail[], Error>({
    queryKey: hhApiKeys.countries(),
    queryFn: () => getHhCountries(),
    enabled,
    retry: 1,
    staleTime: 1000 * 60 * 60, // 1 hour - countries change rarely
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  });
}

/**
 * Hook to get regions for a specific country (lazy-loaded)
 * Fetches from /areas/{countryId} endpoint
 */
export function useHhRegionsByCountryId(countryId: string | undefined, enabled = true) {
  return useQuery<HhAreaDetail[], Error>({
    queryKey: [...hhApiKeys.areas(), 'country', countryId],
    queryFn: async () => {
      if (!countryId) return [];
      const country = await getHhAreaById(countryId);
      return country.areas || [];
    },
    enabled: enabled && !!countryId,
    retry: 1,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  });
}

/**
 * Hook to get cities for a specific region (lazy-loaded)
 * Fetches from /areas/{regionId} endpoint
 */
export function useHhCitiesByRegionId(regionId: string | undefined, enabled = true) {
  return useQuery<HhAreaDetail[], Error>({
    queryKey: [...hhApiKeys.areas(), 'region', regionId],
    queryFn: async () => {
      if (!regionId) return [];
      const region = await getHhAreaById(regionId);
      return region.areas || [];
    },
    enabled: enabled && !!regionId,
    retry: 1,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  });
}

/**
 * Hook to get HH.ru professional roles (flattened list from all categories)
 * Uses React Query in-memory cache
 */
export function useHhProfessionalRoles(enabled = true) {
  return useQuery<HhProfessionalRole[], Error>({
    queryKey: hhApiKeys.professionalAreas(),
    queryFn: async () => {
      const response = await getHhProfessionalRoles();
      return flattenProfessionalRoles(response);
    },
    enabled,
    retry: 1,
    staleTime: 1000 * 60 * 60, // 1 hour - roles change very rarely
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  });
}

/**
 * Hook to get HH.ru industries (flattened list from all categories)
 * Uses React Query in-memory cache
 */
export function useHhIndustries(enabled = true) {
  return useQuery<HhIndustryItem[], Error>({
    queryKey: hhApiKeys.industries(),
    queryFn: async () => {
      const response = await getHhIndustries();
      return flattenIndustries(response);
    },
    enabled,
    retry: 1,
    staleTime: 1000 * 60 * 60, // 1 hour - industries change very rarely
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  });
}

// Old utility hooks removed - replaced with direct API call hooks:
// - useRegionsByCountry → useHhRegionsByCountryId
// - useCitiesByRegion → useHhCitiesByRegionId
