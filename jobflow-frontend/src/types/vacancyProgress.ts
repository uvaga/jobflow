export enum VacancyProgressStatus {
  SAVED = 'saved',
  APPLIED = 'applied',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEW_COMPLETED = 'interview_completed',
  REJECTED = 'rejected',
  OFFER_RECEIVED = 'offer_received',
  OFFER_ACCEPTED = 'offer_accepted',
  WITHDRAWN = 'withdrawn',
}

export interface VacancyProgress {
  _id: string;
  userId: string;
  vacancyId: string;
  status: VacancyProgressStatus;
  notes?: string;
  appliedAt?: string;
  interviewDate?: string;
  tags: string[];
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVacancyProgressDto {
  vacancyId: string;
  status?: VacancyProgressStatus;
  notes?: string;
  appliedAt?: string;
  interviewDate?: string;
  tags?: string[];
  priority?: number;
}

export interface UpdateVacancyProgressDto {
  status?: VacancyProgressStatus;
  notes?: string;
  appliedAt?: string;
  interviewDate?: string;
  tags?: string[];
  priority?: number;
}

export interface VacancyProgressFilters {
  status?: VacancyProgressStatus;
  priority?: number;
  tags?: string[];
}

export interface VacancyProgressStatistics {
  totalApplications: number;
  byStatus: Record<VacancyProgressStatus, number>;
  recentActivity: VacancyProgress[];
}
