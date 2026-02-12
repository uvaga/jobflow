import { VacancyProgressStatus } from './vacancyProgress';

export interface Vacancy {
  _id: string;
  hhId: string;
  name: string;
  employer: {
    id: string;
    name: string;
    url?: string;
    logoUrls?: Record<string, string>;
    alternateUrl?: string;
    trusted: boolean;
    accreditedItEmployer?: boolean;
  };
  salary?: {
    from?: number;
    to?: number;
    currency: string;
    gross?: boolean;
  };
  area: {
    id: string;
    name: string;
    url: string;
  };
  url: string;
  alternateUrl?: string;
  description: string;
  schedule?: {
    id: string;
    name: string;
  };
  experience?: {
    id: string;
    name: string;
  };
  employment?: {
    id: string;
    name: string;
  };
  keySkills?: { name: string }[];
  professionalRoles?: { id: string; name: string }[];
  address?: Record<string, unknown>;
  contacts?: Record<string, unknown>;
  workFormat?: { id: string; name: string }[];
  workingHours?: { id: string; name: string }[];
  workScheduleByDays?: { id: string; name: string }[];
  acceptHandicapped?: boolean;
  acceptKids?: boolean;
  acceptTemporary?: boolean;
  acceptIncompleteResumes?: boolean;
  publishedAt: string;
  cacheExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressEntry {
  status: VacancyProgressStatus;
  statusSetDate: string;
}

export interface SavedVacancyEntry {
  vacancy: Vacancy;
  progress: ProgressEntry[];
}

export interface SavedVacanciesResponse {
  items: SavedVacancyEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VacancyListProps {
  vacancies: Vacancy[];
  isLoading?: boolean;
  error?: Error | null;
  onVacancyClick?: (vacancyId: string) => void;
  onSave?: (vacancyId: string) => void;
  showSaveButton?: boolean;
}

export interface VacancyCardProps {
  vacancy: Vacancy;
  onClick?: (vacancyId: string) => void;
  showSaveButton?: boolean;
  isSaved?: boolean;
  onSave?: (vacancyId: string) => void;
}
