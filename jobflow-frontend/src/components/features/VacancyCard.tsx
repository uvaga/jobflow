import { memo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Divider,
  Avatar,
  Tooltip,
} from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ProgressStatusChip from './ProgressStatusChip';

// Vacancy type that supports both hh.ru API and MongoDB formats
interface VacancyCardVacancy {
  id?: string;
  _id?: string;
  name: string;
  employer: {
    id: string;
    name: string;
    url?: string;
    logo_urls?: Record<string, string> | null;
    logoUrls?: Record<string, string>;
    trusted: boolean;
  };
  salary?: {
    from?: number | null;
    to?: number | null;
    currency: string;
    gross?: boolean;
  } | null;
  area: {
    id: string;
    name: string;
    url: string;
  };
  url: string;
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
  published_at?: string;
  publishedAt?: string;
  isSaved?: boolean;
}

interface VacancyCardProps {
  vacancy: VacancyCardVacancy;
  onClick?: (vacancyId: string) => void;
  showSaveButton?: boolean;
  isSaved?: boolean;
  onSave?: (vacancyId: string) => void;
  progressStatus?: string;
  savedDate?: string;
  /** Use hhId for navigation instead of vacancy id/hhId */
  hhId?: string;
}

// Format salary display
function formatSalary(salary?: VacancyCardVacancy['salary']): string {
  if (!salary) return 'Salary not specified';

  const { from, to, currency, gross } = salary;
  const grossLabel = gross ? ' (gross)' : '';

  if (from && to) {
    return `${from.toLocaleString()} - ${to.toLocaleString()} ${currency}${grossLabel}`;
  }
  if (from) {
    return `From ${from.toLocaleString()} ${currency}${grossLabel}`;
  }
  if (to) {
    return `Up to ${to.toLocaleString()} ${currency}${grossLabel}`;
  }
  return 'Salary not specified';
}

// Format date display
function formatDate(dateString?: string): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function VacancyCard({
  vacancy,
  onClick,
  showSaveButton = true,
  isSaved = false,
  onSave,
  progressStatus,
  savedDate,
  hhId,
}: VacancyCardProps) {
  // Support both id and _id, prefer hhId prop for navigation
  const vacancyId = hhId || vacancy.id || vacancy._id || '';

  // Support both published_at and publishedAt
  const publishedDate = vacancy.published_at || vacancy.publishedAt;

  // Support both logo_urls and logoUrls
  const logoUrl = vacancy.employer.logo_urls?.['90'] || vacancy.employer.logoUrls?.['90'];

  const handleCardClick = useCallback(() => {
    if (onClick) onClick(vacancyId);
  }, [onClick, vacancyId]);

  const handleSaveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onSave) onSave(vacancyId);
    },
    [onSave, vacancyId]
  );

  const salaryText = formatSalary(vacancy.salary);
  const publishedText = formatDate(publishedDate);
  const savedState = vacancy.isSaved ?? isSaved;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? { transform: 'translateY(-4px)', boxShadow: 4 } : {},
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Progress Status */}
        {progressStatus && (
          <Box sx={{ mb: 1 }}>
            <ProgressStatusChip status={progressStatus} />
          </Box>
        )}

        {/* Header: Title and Save Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h3" sx={{ flexGrow: 1, pr: 1 }}>
            {vacancy.name}
          </Typography>
          {showSaveButton && onSave && (
            <Tooltip title={savedState ? 'Remove from saved vacancies' : 'Save vacancy to track it'}>
              <IconButton
                size="small"
                onClick={handleSaveClick}
                color={savedState ? 'primary' : 'default'}
                aria-label={savedState ? 'Remove from saved' : 'Save vacancy'}
              >
                {savedState ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Employer */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          {logoUrl ? (
            <Avatar src={logoUrl} alt={vacancy.employer.name} sx={{ width: 32, height: 32 }}>
              <BusinessIcon />
            </Avatar>
          ) : (
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
              <BusinessIcon fontSize="small" />
            </Avatar>
          )}
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {vacancy.employer.name}
            </Typography>
            {vacancy.employer.trusted && (
              <Chip label="Verified" size="small" color="success" sx={{ height: 16, fontSize: '0.65rem' }} />
            )}
          </Box>
        </Box>

        {/* Salary */}
        <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
          {salaryText}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {/* Details */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Tooltip title="Location">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {vacancy.area.name}
              </Typography>
            </Box>
          </Tooltip>

          {vacancy.experience && (
            <Tooltip title="Experience">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {vacancy.experience.name}
                </Typography>
              </Box>
            </Tooltip>
          )}

          {vacancy.schedule && (
            <Tooltip title="Schedule">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {vacancy.schedule.name}
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Box>

        {vacancy.employment && (
          <Box sx={{ mt: 2 }}>
            <Chip label={vacancy.employment.name} size="small" variant="outlined" />
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, py: 1.5, bgcolor: 'grey.50' }}>
        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
          {savedDate ? `Saved ${formatDate(savedDate)}` : publishedText && `Published ${publishedText}`}
        </Typography>
        {onClick && (
          <Button size="small" variant="text">
            View Details
          </Button>
        )}
      </CardActions>
    </Card>
  );
}

export default memo(VacancyCard);
