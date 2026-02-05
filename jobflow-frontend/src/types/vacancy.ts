export interface Vacancy {
  _id: string;
  hhId: string;
  name: string;
  employer: {
    id: string;
    name: string;
    url?: string;
    logoUrls?: Record<string, string>;
    trusted: boolean;
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
  publishedAt: string;
  cacheExpiresAt: string;
  createdAt: string;
  updatedAt: string;
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
