/**
 * Normalizes vacancy data from both hh.ru API (snake_case) and MongoDB (camelCase)
 * into a common interface for shared vacancy detail components.
 */

import type { Vacancy } from '@/types';
import type { HhVacancyDetail } from '@/services/hhApiService';

interface NamedEntity {
  id: string;
  name: string;
}

export interface NormalizedVacancy {
  name: string;
  employer: {
    id: string;
    name: string;
    url?: string;
    logoUrl?: string;
    alternateUrl?: string;
    trusted: boolean;
    accreditedItEmployer?: boolean;
  };
  salary?: {
    from?: number | null;
    to?: number | null;
    currency: string;
    gross?: boolean;
  } | null;
  area: { id: string; name: string; url: string };
  alternateUrl?: string;
  description: string;
  schedule?: NamedEntity;
  experience?: NamedEntity;
  employment?: NamedEntity;
  keySkills: { name: string }[];
  professionalRoles: NamedEntity[];
  workFormat: NamedEntity[];
  workingHours: NamedEntity[];
  workScheduleByDays: NamedEntity[];
  acceptHandicapped: boolean;
  acceptKids: boolean;
  acceptTemporary: boolean;
  acceptIncompleteResumes: boolean;
  publishedAt?: string;
  address?: {
    city?: string;
    street?: string;
    building?: string;
    raw?: string;
  } | null;
  contacts?: {
    name?: string;
    email?: string;
    phones?: Array<{ city?: string; number?: string; comment?: string }>;
  } | null;
}

function getLogoUrl(logoUrls?: Record<string, string> | null): string | undefined {
  if (!logoUrls) return undefined;
  return logoUrls['240'] || logoUrls['90'];
}

/** Normalize from hh.ru API snake_case format */
export function normalizeFromHhApi(v: HhVacancyDetail): NormalizedVacancy {
  return {
    name: v.name,
    employer: {
      id: v.employer.id,
      name: v.employer.name,
      url: v.employer.url,
      logoUrl: getLogoUrl(v.employer.logo_urls),
      alternateUrl: v.employer.alternate_url,
      trusted: v.employer.trusted,
      accreditedItEmployer: v.employer.accredited_it_employer,
    },
    salary: v.salary,
    area: v.area,
    alternateUrl: v.alternate_url,
    description: v.description,
    schedule: v.schedule,
    experience: v.experience,
    employment: v.employment,
    keySkills: v.key_skills || [],
    professionalRoles: v.professional_roles || [],
    workFormat: v.work_format || [],
    workingHours: v.working_hours || [],
    workScheduleByDays: v.work_schedule_by_days || [],
    acceptHandicapped: v.accept_handicapped ?? false,
    acceptKids: v.accept_kids ?? false,
    acceptTemporary: v.accept_temporary ?? false,
    acceptIncompleteResumes: v.accept_incomplete_resumes ?? false,
    publishedAt: v.published_at,
    address: v.address,
    contacts: v.contacts,
  };
}

/** Normalize from MongoDB camelCase format */
export function normalizeFromDb(v: Vacancy): NormalizedVacancy {
  return {
    name: v.name,
    employer: {
      id: v.employer.id,
      name: v.employer.name,
      url: v.employer.url,
      logoUrl: getLogoUrl(v.employer.logoUrls),
      alternateUrl: v.employer.alternateUrl,
      trusted: v.employer.trusted,
      accreditedItEmployer: v.employer.accreditedItEmployer,
    },
    salary: v.salary,
    area: v.area,
    alternateUrl: v.alternateUrl,
    description: v.description,
    schedule: v.schedule,
    experience: v.experience,
    employment: v.employment,
    keySkills: v.keySkills || [],
    professionalRoles: v.professionalRoles || [],
    workFormat: v.workFormat || [],
    workingHours: v.workingHours || [],
    workScheduleByDays: v.workScheduleByDays || [],
    acceptHandicapped: v.acceptHandicapped ?? false,
    acceptKids: v.acceptKids ?? false,
    acceptTemporary: v.acceptTemporary ?? false,
    acceptIncompleteResumes: v.acceptIncompleteResumes ?? false,
    publishedAt: v.publishedAt,
    address: v.address as NormalizedVacancy['address'],
    contacts: v.contacts as NormalizedVacancy['contacts'],
  };
}
