import { useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { useHhVacancy } from '@/hooks/useHhApi';
import { useSavedVacancies, useAddVacancy, useRemoveVacancy } from '@/hooks/useVacancies';
import { useAuthStore } from '@/store/authStore';
import { normalizeFromHhApi } from '@/utils/vacancyNormalizer';
import { formatDate } from '@/utils/vacancyHelpers';
import {
  VacancyDetailSkeleton,
  VacancyHeaderInfo,
  KeySkillsSection,
  DescriptionSection,
  AdditionalInfoSection,
  ContactsSection,
} from '@/components/features/vacancy-detail';

export default function VacancyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: rawVacancy, isPending, isError, error } = useHhVacancy(id);

  const { data: savedData } = useSavedVacancies(undefined, isAuthenticated);
  const addVacancyMutation = useAddVacancy();
  const removeVacancyMutation = useRemoveVacancy();

  const isSaved = useMemo(() => {
    if (!savedData?.items || !id) return false;
    return savedData.items.some((entry) => entry.vacancy?.hhId === id);
  }, [savedData, id]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleSaveToggle = useCallback(() => {
    if (!id) return;
    if (isSaved) {
      removeVacancyMutation.mutate(id);
    } else {
      addVacancyMutation.mutate(id);
    }
  }, [id, isSaved, addVacancyMutation, removeVacancyMutation]);

  if (isPending) {
    return <VacancyDetailSkeleton />;
  }

  if (isError) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
            Back
          </Button>
          <Alert severity="error" sx={{ mt: 2 }}>
            {error?.message || 'Failed to load vacancy details'}
          </Alert>
        </Box>
      </Container>
    );
  }

  if (!rawVacancy) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
            Back
          </Button>
          <Alert severity="warning">Vacancy not found</Alert>
        </Box>
      </Container>
    );
  }

  const vacancy = normalizeFromHhApi(rawVacancy);

  return (
    <Container maxWidth="lg">
      <title>{`${vacancy.name} vacancy in ${vacancy.employer.name} - JobFlow`}</title>
      <Box sx={{ py: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Search
        </Button>

        {/* Header section */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <VacancyHeaderInfo vacancy={vacancy} />

            {/* Action buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 160 }}>
              {vacancy.alternateUrl && (
                <Button
                  variant="contained"
                  size="large"
                  href={vacancy.alternateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<OpenInNewIcon />}
                >
                  Apply for this job
                </Button>
              )}
              {isAuthenticated && (
                <Tooltip title={isSaved ? 'Remove from saved vacancies' : 'Save vacancy to track it'}>
                  <Button
                    variant={isSaved ? 'contained' : 'outlined'}
                    color={isSaved ? 'primary' : 'inherit'}
                    startIcon={isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                    onClick={handleSaveToggle}
                    disabled={addVacancyMutation.isPending || removeVacancyMutation.isPending}
                  >
                    {isSaved ? 'Saved' : 'Save'}
                  </Button>
                </Tooltip>
              )}
            </Box>
          </Box>

          {vacancy.publishedAt && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Published: {formatDate(vacancy.publishedAt)}
            </Typography>
          )}
        </Paper>

        <KeySkillsSection skills={vacancy.keySkills} />
        <DescriptionSection description={vacancy.description} />
        <AdditionalInfoSection vacancy={vacancy} />
        <ContactsSection contacts={vacancy.contacts} />

        {/* Bottom actions */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
          {vacancy.alternateUrl && (
            <Button
              variant="contained"
              size="large"
              href={vacancy.alternateUrl}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNewIcon />}
            >
              Apply for this job
            </Button>
          )}
          <Button variant="outlined" size="large" onClick={handleBack}>
            Back to Search
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
