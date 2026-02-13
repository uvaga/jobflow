import axios from 'axios';

const HH_API_BASE_URL = 'https://api.hh.ru';
const HH_API_LOCALE = import.meta.env.VITE_HH_API_LOCALE || 'EN';

// hh.ru API search parameters
export interface HhSearchParams {
  text?: string;
  area?: string;
  industry?: string;
  salary?: number;
  currency?: string;
  only_with_salary?: boolean;
  experience?: string;
  employment?: string;
  schedule?: string;
  professional_role?: string;
  employer_id?: string;
  page?: number;
  per_page?: number;
}

// Common types
interface HhNamedEntity {
  id: string;
  name: string;
}

// HH.ru Dictionaries Response
export interface HhDictionaries {
  employment: HhNamedEntity[];
  schedule: HhNamedEntity[];
  experience: HhNamedEntity[];
  currency: Array<{
    code: string;
    abbr: string;
    name: string;
    rate: number;
    default?: boolean;
    in_use?: boolean;
  }>;
  gender?: HhNamedEntity[];
  education_level?: HhNamedEntity[];
  language_level?: HhNamedEntity[];
  relocation_type?: HhNamedEntity[];
  business_trip_readiness?: HhNamedEntity[];
  driver_license_types?: Array<{ id: string }>;
  travel_time?: HhNamedEntity[];
  preferred_contact_type?: HhNamedEntity[];
  resume_access_type?: HhNamedEntity[];
  [key: string]: unknown; // Allow other dictionary fields
}

// HH.ru Area (hierarchical structure: countries → regions → cities)
export interface HhAreaDetail {
  id: string;
  name: string;
  parent_id?: string;
  areas?: HhAreaDetail[]; // nested children
  lat?: number;
  lng?: number;
  name_prepositional?: string; // e.g., "в Москве" (Russian locale)
  utc_offset?: string; // e.g., "+03:00"
}

// HH.ru Professional Roles (from /professional_roles endpoint)
export interface HhProfessionalRole {
  id: string;
  name: string;
  accept_incomplete_resumes?: boolean;
  is_default?: boolean;
}

export interface HhProfessionalRoleCategory {
  id: string;
  name: string;
  roles: HhProfessionalRole[];
}

export interface HhProfessionalRolesResponse {
  categories: HhProfessionalRoleCategory[];
}

// HH.ru Industry (hierarchical structure: categories → industries)
export interface HhIndustryItem {
  id: string;
  name: string;
}

export interface HhIndustryCategory {
  id: string;
  name: string;
  industries: HhIndustryItem[];
}

export type HhIndustriesResponse = HhIndustryCategory[];

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
export const getHhDictionaries = async (): Promise<HhDictionaries> => {
  const response = await hhApiClient.get<HhDictionaries>('/dictionaries');
  return response.data;
};

/**
 * Get list of countries from hh.ru API
 * Lightweight endpoint returning only country names and IDs
 */
export const getHhCountries = async (): Promise<HhAreaDetail[]> => {
  const response = await hhApiClient.get<HhAreaDetail[]>('/areas/countries');
  return response.data;
};

/**
 * Get specific area by ID
 * Returns area with its children
 */
export const getHhAreaById = async (id: string): Promise<HhAreaDetail> => {
  const response = await hhApiClient.get<HhAreaDetail>(`/areas/${id}`);
  return response.data;
};

/**
 * Get professional roles from hh.ru API (categories with roles)
 * Used for professional role filtering in vacancy search
 */
export const getHhProfessionalRoles = async (): Promise<HhProfessionalRolesResponse> => {
  const response = await hhApiClient.get<HhProfessionalRolesResponse>('/professional_roles');
  return response.data;
};

/**
 * Get industries from hh.ru API (categories with nested industries)
 * Used for industry filtering in vacancy search
 */
export const getHhIndustries = async (): Promise<HhIndustriesResponse> => {
  const response = await hhApiClient.get<HhIndustriesResponse>('/industries');
  return response.data;
};

/**
 * Flatten all professional roles into a single array with unique roles
 * Useful for displaying all roles in a single dropdown
 * Deduplicates roles by ID (some roles appear in multiple categories)
 */
export const flattenProfessionalRoles = (
  response: HhProfessionalRolesResponse
): HhProfessionalRole[] => {
  const rolesMap = new Map<string, HhProfessionalRole>();

  response.categories.forEach((category) => {
    category.roles.forEach((role) => {
      if (!rolesMap.has(role.id)) {
        rolesMap.set(role.id, role);
      }
    });
  });

  // Convert Map values to array and sort by name for better UX
  return Array.from(rolesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Flatten all industries into a single array with unique industries
 * Useful for displaying all industries in a single dropdown
 * Deduplicates industries by ID and sorts alphabetically for better UX
 */
export const flattenIndustries = (
  response: HhIndustriesResponse
): HhIndustryItem[] => {
  const industriesMap = new Map<string, HhIndustryItem>();

  response.forEach((category) => {
    // Add parent category as an industry option
    industriesMap.set(category.id, { id: category.id, name: category.name });

    // Add nested sub-industries
    category.industries.forEach((industry) => {
      if (!industriesMap.has(industry.id)) {
        industriesMap.set(industry.id, industry);
      }
    });
  });

  return Array.from(industriesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};
