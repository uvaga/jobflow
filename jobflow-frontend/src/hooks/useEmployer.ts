import { useQuery } from '@tanstack/react-query';
import { fetchEmployer, type EmployerDetail } from '@/services/employerService';

export const employerKeys = {
  all: ['employers'] as const,
  detail: (id: string) => [...employerKeys.all, id] as const,
};

/**
 * Hook to get employer details by ID
 * Fetches from backend which proxies to hh.ru API
 */
export function useEmployer(id: string | undefined, enabled = true) {
  return useQuery<EmployerDetail, Error>({
    queryKey: id ? employerKeys.detail(id) : ['employer-placeholder'],
    queryFn: () => {
      if (!id) throw new Error('Employer ID is required');
      return fetchEmployer(id);
    },
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
}
