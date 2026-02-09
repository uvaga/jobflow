import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  searchHhVacancies,
  getHhVacancy,
  getHhDictionaries,
  getHhCountries,
  getHhAreas,
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
  countries: () => [...hhApiKeys.all, 'countries'] as const,
  areas: () => [...hhApiKeys.all, 'areas'] as const,
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
export function useHhDictionaries() {
  return useQuery<HhDictionaries, Error>({
    queryKey: hhApiKeys.dictionaries(),
    queryFn: () => getHhDictionaries(),
    retry: 1,
  });
}

/**
 * Hook to get HH.ru countries list
 * Uses React Query in-memory cache
 */
export function useHhCountries() {
  return useQuery<HhAreaDetail[], Error>({
    queryKey: hhApiKeys.countries(),
    queryFn: () => getHhCountries(),
    retry: 1,
  });
}

/**
 * Hook to get HH.ru full areas hierarchy (countries → regions → cities)
 * Uses React Query in-memory cache
 */
export function useHhAreas() {
  return useQuery<HhAreaDetail[], Error>({
    queryKey: hhApiKeys.areas(),
    queryFn: () => getHhAreas(),
    retry: 1,
  });
}

/**
 * Hook to get HH.ru professional roles (flattened list from all categories)
 * Uses React Query in-memory cache
 */
export function useHhProfessionalRoles() {
  return useQuery<HhProfessionalRole[], Error>({
    queryKey: hhApiKeys.professionalAreas(),
    queryFn: async () => {
      const response = await getHhProfessionalRoles();
      return flattenProfessionalRoles(response);
    },
    retry: 1,
    staleTime: 1000 * 60 * 60, // 1 hour - roles change very rarely
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  });
}

/**
 * Hook to get HH.ru industries (flattened list from all categories)
 * Uses React Query in-memory cache
 */
export function useHhIndustries() {
  return useQuery<HhIndustryItem[], Error>({
    queryKey: hhApiKeys.industries(),
    queryFn: async () => {
      const response = await getHhIndustries();
      return flattenIndustries(response);
    },
    retry: 1,
    staleTime: 1000 * 60 * 60, // 1 hour - industries change very rarely
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  });
}

/**
 * Utility hook: Get regions for selected country
 * Filters areas hierarchy to return only regions of the specified country
 */
export function useRegionsByCountry(countryId?: string) {
  const { data: areas } = useHhAreas();

  return useMemo(() => {
    if (!countryId || !areas) return [];
    const country = areas.find((a) => a.id === countryId);
    return country?.areas || [];
  }, [areas, countryId]);
}

/**
 * Utility hook: Get cities for selected region
 * Flattens nested area structure to return cities in the specified region
 */
export function useCitiesByRegion(regionId?: string) {
  const { data: areas } = useHhAreas();

  return useMemo(() => {
    if (!regionId || !areas) return [];

    // Find region in hierarchy (country → region)
    for (const country of areas) {
      if (!country.areas) continue;
      const region = country.areas.find((r) => r.id === regionId);
      if (region) {
        return region.areas || [];
      }
    }
    return [];
  }, [areas, regionId]);
}

// Removed useSpecializationsByArea - no longer needed with flat professional roles list
