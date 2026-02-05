import { memo } from 'react';
import { Grid, Box, Typography } from '@mui/material';
import type { VacancyListProps } from '@/types';
import VacancyCard from './VacancyCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import WorkOffIcon from '@mui/icons-material/WorkOff';

function VacancyList({
  vacancies,
  isLoading = false,
  error = null,
  onVacancyClick,
  onSave,
  showSaveButton = true,
}: VacancyListProps) {
  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Loading vacancies..." />;
  }

  // Error state
  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load vacancies"
        message={error.message || 'An unexpected error occurred'}
      />
    );
  }

  // Empty state
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

  // Render vacancy cards in a responsive grid
  return (
    <Grid container spacing={3}>
      {vacancies.map((vacancy) => (
        <Grid item key={vacancy._id} xs={12} sm={6} md={4}>
          <VacancyCard
            vacancy={vacancy}
            onClick={onVacancyClick}
            showSaveButton={showSaveButton}
            isSaved={(vacancy as any).isSaved}
            onSave={onSave}
          />
        </Grid>
      ))}
    </Grid>
  );
}

// Memoize to prevent unnecessary re-renders when parent re-renders
// Component only re-renders when props change (rerender-memo)
export default memo(VacancyList);
