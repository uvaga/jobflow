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
} from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import ScheduleIcon from '@mui/icons-material/Schedule';
import type { VacancyCardProps } from '@/types';

// Format salary display
function formatSalary(salary?: {
  from?: number;
  to?: number;
  currency: string;
  gross?: boolean;
}): string {
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
function formatDate(dateString: string): string {
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
}: VacancyCardProps) {
  // Use callback to avoid recreating function on each render (rerender-functional-setstate)
  const handleCardClick = useCallback(() => {
    if (onClick) {
      onClick(vacancy._id);
    }
  }, [onClick, vacancy._id]);

  const handleSaveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card click
      if (onSave) {
        onSave(vacancy._id);
      }
    },
    [onSave, vacancy._id],
  );

  const salaryText = formatSalary(vacancy.salary);
  const publishedText = formatDate(vacancy.publishedAt);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick
          ? {
              transform: 'translateY(-4px)',
              boxShadow: 4,
            }
          : {},
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header: Title and Save Button */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Typography variant="h6" component="h3" sx={{ flexGrow: 1, pr: 1 }}>
            {vacancy.name}
          </Typography>
          {showSaveButton && onSave && (
            <IconButton
              size="small"
              onClick={handleSaveClick}
              color={isSaved ? 'primary' : 'default'}
              aria-label={isSaved ? 'Remove from saved' : 'Save vacancy'}
            >
              {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
          )}
        </Box>

        {/* Employer */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          {vacancy.employer.logoUrls?.['90'] ? (
            <Avatar
              src={vacancy.employer.logoUrls['90']}
              alt={vacancy.employer.name}
              sx={{ width: 32, height: 32 }}
            >
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
              <Chip
                label="Verified"
                size="small"
                color="success"
                sx={{ height: 16, fontSize: '0.65rem' }}
              />
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
          {/* Location */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOnIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {vacancy.area.name}
            </Typography>
          </Box>

          {/* Experience */}
          {vacancy.experience && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WorkIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {vacancy.experience.name}
              </Typography>
            </Box>
          )}

          {/* Schedule */}
          {vacancy.schedule && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {vacancy.schedule.name}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Employment Type */}
        {vacancy.employment && (
          <Box sx={{ mt: 2 }}>
            <Chip
              label={vacancy.employment.name}
              size="small"
              variant="outlined"
            />
          </Box>
        )}
      </CardContent>

      {/* Footer */}
      <CardActions sx={{ px: 2, py: 1.5, bgcolor: 'grey.50' }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ flexGrow: 1 }}
        >
          Published {publishedText}
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

// Memoize component to prevent unnecessary re-renders (rerender-memo)
// Component only re-renders when props actually change
export default memo(VacancyCard);
