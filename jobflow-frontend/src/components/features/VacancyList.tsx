import { memo } from 'react';
import { Grid, Box, Typography } from '@mui/material';
import VacancyCard from './VacancyCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import WorkOffIcon from '@mui/icons-material/WorkOff';

// Generic vacancy type for the list
interface VacancyItem {
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
  schedule?: { id: string; name: string };
  experience?: { id: string; name: string };
  employment?: { id: string; name: string };
  published_at?: string;
  publishedAt?: string;
  isSaved?: boolean;
}

interface VacancyListProps {
  vacancies: VacancyItem[];
  isLoading?: boolean;
  error?: Error | null;
  onVacancyClick?: (vacancyId: string) => void;
  onSave?: (vacancyId: string) => void;
  showSaveButton?: boolean;
}

function VacancyList({
  vacancies,
  isLoading = false,
  error = null,
  onVacancyClick,
  onSave,
  showSaveButton = true,
}: VacancyListProps) {
  if (isLoading) {
    return <LoadingSpinner message="Loading vacancies..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load vacancies"
        message={error.message || 'An unexpected error occurred'}
      />
    );
  }

  if (!vacancies || vacancies.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          gap: 2,
        }}
      >
        <WorkOffIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
        <Typography variant="h6" color="text.secondary">
          No vacancies found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try adjusting your search filters
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {vacancies.map((vacancy) => (
        <Grid key={vacancy.id || vacancy._id} size={{ xs: 12, sm: 6, md: 4 }}>
          <VacancyCard
            vacancy={vacancy}
            onClick={onVacancyClick}
            showSaveButton={showSaveButton}
            isSaved={vacancy.isSaved}
            onSave={onSave}
          />
        </Grid>
      ))}
    </Grid>
  );
}

export default memo(VacancyList);
