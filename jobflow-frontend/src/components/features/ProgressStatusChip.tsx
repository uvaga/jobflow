import { Chip } from '@mui/material';
import { VacancyProgressStatus } from '@/types/vacancyProgress';

const statusConfig: Record<VacancyProgressStatus, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
  [VacancyProgressStatus.SAVED]: { label: 'Saved', color: 'default' },
  [VacancyProgressStatus.APPLIED]: { label: 'Applied', color: 'primary' },
  [VacancyProgressStatus.INTERVIEW_SCHEDULED]: { label: 'Interview Scheduled', color: 'warning' },
  [VacancyProgressStatus.INTERVIEW_COMPLETED]: { label: 'Interview Completed', color: 'info' },
  [VacancyProgressStatus.REJECTED]: { label: 'Rejected', color: 'error' },
  [VacancyProgressStatus.OFFER_RECEIVED]: { label: 'Offer Received', color: 'success' },
  [VacancyProgressStatus.OFFER_ACCEPTED]: { label: 'Offer Accepted', color: 'success' },
  [VacancyProgressStatus.WITHDRAWN]: { label: 'Withdrawn', color: 'default' },
};

interface ProgressStatusChipProps {
  status: VacancyProgressStatus | string;
  size?: 'small' | 'medium';
}

export default function ProgressStatusChip({ status, size = 'small' }: ProgressStatusChipProps) {
  const config = statusConfig[status as VacancyProgressStatus] || { label: status, color: 'default' as const };

  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      variant="filled"
    />
  );
}
