import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Skeleton,
  Alert,
} from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import VacancyCard from '@/components/features/VacancyCard';
import Pagination from '@/components/common/Pagination';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useSavedVacancies, useRemoveVacancy } from '@/hooks/useVacancies';
import { VacancyProgressStatus } from '@/types/vacancyProgress';
import type { SavedVacanciesParams } from '@/services/vacancyService';

const ITEMS_PER_PAGE = 20;

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: VacancyProgressStatus.SAVED, label: 'Saved' },
  { value: VacancyProgressStatus.APPLIED, label: 'Applied' },
  { value: VacancyProgressStatus.INTERVIEW_SCHEDULED, label: 'Interview Scheduled' },
  { value: VacancyProgressStatus.INTERVIEW_COMPLETED, label: 'Interview Completed' },
  { value: VacancyProgressStatus.REJECTED, label: 'Rejected' },
  { value: VacancyProgressStatus.OFFER_RECEIVED, label: 'Offer Received' },
  { value: VacancyProgressStatus.OFFER_ACCEPTED, label: 'Offer Accepted' },
  { value: VacancyProgressStatus.WITHDRAWN, label: 'Withdrawn' },
];

const sortOptions = [
  { value: 'savedDate-desc', label: 'Newest First' },
  { value: 'savedDate-asc', label: 'Oldest First' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
];

function parseSearchParams(searchParams: URLSearchParams): SavedVacanciesParams {
  const status = searchParams.get('status') || undefined;
  const sortBy = (searchParams.get('sortBy') as 'savedDate' | 'name') || 'savedDate';
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
  const page = parseInt(searchParams.get('page') || '0', 10);

  return { status, sortBy, sortOrder, page, limit: ITEMS_PER_PAGE };
}

export default function SavedVacancies() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseSearchParams(searchParams), [searchParams]);
  const removeVacancyMutation = useRemoveVacancy();
  const [vacancyToRemove, setVacancyToRemove] = useState<string | null>(null);

  const { data, isLoading, error } = useSavedVacancies(params);

  const currentSort = `${params.sortBy}-${params.sortOrder}`;

  const handleStatusChange = useCallback((e: { target: { value: string } }) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value) {
      newParams.set('status', e.target.value);
    } else {
      newParams.delete('status');
    }
    newParams.set('page', '0');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleSortChange = useCallback((e: { target: { value: string } }) => {
    const [sortBy, sortOrder] = e.target.value.split('-');
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sortBy', sortBy);
    newParams.set('sortOrder', sortOrder);
    newParams.set('page', '0');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handlePageChange = useCallback((page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(page - 1)); // Convert 1-indexed to 0-indexed
    setSearchParams(newParams, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, setSearchParams]);

  const handleVacancyClick = useCallback((vacancyId: string) => {
    navigate(`/vacancies/${vacancyId}`);
  }, [navigate]);

  const handleUnsave = useCallback((hhId: string) => {
    setVacancyToRemove(hhId);
  }, []);

  const handleConfirmRemove = useCallback(() => {
    if (vacancyToRemove) {
      removeVacancyMutation.mutate(vacancyToRemove, {
        onSettled: () => setVacancyToRemove(null),
      });
    }
  }, [vacancyToRemove, removeVacancyMutation]);

  const handleCancelRemove = useCallback(() => {
    setVacancyToRemove(null);
  }, []);

  return (
    <Container maxWidth="lg">
      <title>Saved Vacancies - JobFlow</title>
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <BookmarkIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            Saved Vacancies
          </Typography>
          {data && (
            <Typography variant="body1" color="text.secondary">
              ({data.total} total)
            </Typography>
          )}
        </Box>

        {/* Filter controls */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={params.status || ''}
                label="Status"
                onChange={handleStatusChange}
              >
                {statusOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={currentSort}
                label="Sort By"
                onChange={handleSortChange}
              >
                {sortOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Loading state */}
        {isLoading && (
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1 }} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Error state */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error.message || 'Failed to load saved vacancies'}
          </Alert>
        )}

        {/* Empty state */}
        {data && data.items.length === 0 && (
          <Paper elevation={1} sx={{ p: 6, textAlign: 'center' }}>
            <BookmarkIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No saved vacancies yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {params.status
                ? 'No vacancies match the selected status filter. Try clearing the filter.'
                : 'Save vacancies from the search page to track them here.'}
            </Typography>
          </Paper>
        )}

        {/* Vacancy list */}
        {data && data.items.length > 0 && (
          <>
            <Grid container spacing={2}>
              {data.items.map((entry) => {
                const vacancy = entry.vacancy;
                const currentStatus = entry.progress.length > 0
                  ? entry.progress[entry.progress.length - 1].status
                  : undefined;
                const savedDateStr = entry.progress[0]?.statusSetDate;

                return (
                  <Grid key={vacancy.hhId || vacancy._id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <VacancyCard
                      vacancy={vacancy}
                      hhId={vacancy.hhId}
                      onClick={handleVacancyClick}
                      showSaveButton={true}
                      isSaved={true}
                      onSave={handleUnsave}
                      progressStatus={currentStatus}
                      savedDate={savedDateStr}
                    />
                  </Grid>
                );
              })}
            </Grid>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  page={(params.page || 0) + 1}
                  totalPages={data.totalPages}
                  onChange={handlePageChange}
                />
              </Box>
            )}
          </>
        )}
      </Box>

      <ConfirmDialog
        open={vacancyToRemove !== null}
        title="Remove Vacancy"
        message="Are you sure you want to remove this vacancy from your saved list? This action cannot be undone."
        confirmText="Remove"
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
        loading={removeVacancyMutation.isPending}
      />
    </Container>
  );
}
