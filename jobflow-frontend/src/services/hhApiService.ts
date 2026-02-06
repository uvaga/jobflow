import axios from 'axios';

const HH_API_BASE_URL = 'https://api.hh.ru';
const HH_API_LOCALE = import.meta.env.VITE_HH_API_LOCALE || 'EN';

// hh.ru API search parameters
export interface HhSearchParams {
  text?: string;
  area?: string;
  salary?: number;
  only_with_salary?: boolean;
  experience?: string;
  employment?: string;
  schedule?: string;
  page?: number;
  per_page?: number;
}

// Common types
interface HhNamedEntity {
  id: string;
  name: string;
}

interface HhEmployer {
  id: string;
  name: string;
  url?: string;
  alternate_url?: string;
  logo_urls?: {
    '90'?: string;
    '240'?: string;
    original?: string;
  } | null;
  trusted: boolean;
  accredited_it_employer?: boolean;
}

interface HhSalary {
  from?: number | null;
  to?: number | null;
  currency: string;
  gross?: boolean;
}

interface HhArea {
  id: string;
  name: string;
  url: string;
}

// hh.ru vacancy from search results
export interface HhVacancy {
  id: string;
  name: string;
  employer: HhEmployer;
  salary: HhSalary | null;
  area: HhArea;
  url: string;
  alternate_url: string;
  snippet?: {
    requirement?: string | null;
    responsibility?: string | null;
  };
  schedule?: HhNamedEntity;
  experience?: HhNamedEntity;
  employment?: HhNamedEntity;
  published_at: string;
}

// hh.ru vacancy detail (extended fields from /vacancies/:id)
export interface HhVacancyDetail extends HhVacancy {
  description: string;
  key_skills: HhNamedEntity[];
  professional_roles: HhNamedEntity[];
  languages: HhNamedEntity[];
  working_days: HhNamedEntity[];
  working_time_intervals: HhNamedEntity[];
  work_format: HhNamedEntity[];
  working_hours: HhNamedEntity[];
  work_schedule_by_days: HhNamedEntity[];
  accept_handicapped: boolean;
  accept_kids: boolean;
  accept_temporary: boolean;
  accept_incomplete_resumes: boolean;
  archived: boolean;
  address?: {
    city?: string;
    street?: string;
    building?: string;
    raw?: string;
    lat?: number;
    lng?: number;
  } | null;
  contacts?: {
    name?: string;
    email?: string;
    phones?: Array<{ city?: string; number?: string; comment?: string }>;
  } | null;
  employment_form?: HhNamedEntity;
  created_at: string;
  initial_created_at: string;
}

// hh.ru paginated response
export interface HhSearchResponse {
  items: HhVacancy[];
  found: number;
  pages: number;
  page: number;
  per_page: number;
}

// Create axios instance for hh.ru API
// Note: User-Agent header cannot be set in browsers (forbidden header)
const hhApiClient = axios.create({
  baseURL: HH_API_BASE_URL,
  params: {
    locale: HH_API_LOCALE,
  },
});

/**
 * Search vacancies on hh.ru API directly
 */
export const searchHhVacancies = async (
  params: HhSearchParams
): Promise<HhSearchResponse> => {
  // Filter out undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined)
  );

  const response = await hhApiClient.get<HhSearchResponse>('/vacancies', {
    params: cleanParams,
  });

  return response.data;
};

/**
 * Get vacancy details from hh.ru API
 */
export const getHhVacancy = async (id: string): Promise<HhVacancyDetail> => {
  const response = await hhApiClient.get<HhVacancyDetail>(`/vacancies/${id}`);
  return response.data;
};

/**
 * Get hh.ru dictionaries (for filter options)
 */
export const getHhDictionaries = async (): Promise<Record<string, unknown>> => {
  const response = await hhApiClient.get('/dictionaries');
  return response.data;
};
