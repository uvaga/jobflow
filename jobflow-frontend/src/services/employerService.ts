import { apiClient } from '@/config/api';
import type { ApiResponse } from '@/types/api.types';

export interface EmployerDetail {
  id: string;
  name: string;
  description: string | null;
  branded_description: string | null;
  site_url: string;
  alternate_url: string;
  area: {
    id: string;
    name: string;
    url: string;
  };
  logo_urls: {
    '90'?: string;
    '240'?: string;
    original?: string;
  } | null;
  industries: Array<{ id: string; name: string }>;
  open_vacancies: number;
  trusted: boolean;
  accredited_it_employer?: boolean;
  type: string | null;
  vacancies_url: string;
}

/**
 * Fetch employer details by ID (proxied through backend to hh.ru API)
 * Note: Backend TransformInterceptor wraps response in { data: {...} }
 */
export const fetchEmployer = async (id: string): Promise<EmployerDetail> => {
  const response = await apiClient.get<ApiResponse<EmployerDetail>>(
    `/employers/${id}`,
  );
  return response.data.data;
};
