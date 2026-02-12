import { useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  Button,
  Divider,
  Avatar,
  Stack,
  Link,
  Skeleton,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VerifiedIcon from '@mui/icons-material/Verified';
import HomeWorkIcon from '@mui/icons-material/HomeWork';

import { useHhVacancy } from '@/hooks/useHhApi';
import { useSavedVacancies, useAddVacancy, useRemoveVacancy } from '@/hooks/useVacancies';
import { useAuthStore } from '@/store/authStore';
import type { HhVacancyDetail } from '@/services/hhApiService';

// Format salary display
function formatSalary(salary: HhVacancyDetail['salary']): string {
  if (!salary) return 'Salary not specified';

  const { from, to, currency, gross } = salary;
  const grossLabel = gross ? ' (gross)' : ' (net)';

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
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Loading skeleton component
function VacancyDetailSkeleton() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Skeleton variant="text" width={100} height={40} sx={{ mb: 2 }} />
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Skeleton variant="text" width="60%" height={48} />
          <Skeleton variant="text" width="40%" height={32} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="30%" height={24} sx={{ mt: 2 }} />
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Skeleton variant="rounded" width={80} height={32} />
            <Skeleton variant="rounded" width={100} height={32} />
            <Skeleton variant="rounded" width={90} height={32} />
          </Box>
        </Paper>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Skeleton variant="text" width="20%" height={32} />
          <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
        </Paper>
      </Box>
    </Container>
  );
}

export default function VacancyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Auth state
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Fetch vacancy details with caching
  const { data: vacancy, isPending, isError, error } = useHhVacancy(id);

  // Saved vacancies state
  const { data: savedData } = useSavedVacancies(undefined, isAuthenticated);
  const addVacancyMutation = useAddVacancy();
  const removeVacancyMutation = useRemoveVacancy();

  // Check if vacancy is saved
  const isSaved = useMemo(() => {
    if (!savedData?.items || !id) return false;
    return savedData.items.some((entry) => entry.vacancy?.hhId === id);
  }, [savedData, id]);

  // Handlers
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

  // Loading state
  if (isPending) {
    return <VacancyDetailSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            Back
          </Button>
          <Alert severity="error" sx={{ mt: 2 }}>
            {error?.message || 'Failed to load vacancy details'}
          </Alert>
        </Box>
      </Container>
    );
  }

  // No data state
  if (!vacancy) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            Back
          </Button>
          <Alert severity="warning">Vacancy not found</Alert>
        </Box>
      </Container>
    );
  }

  const logoUrl = vacancy.employer.logo_urls?.['240'] || vacancy.employer.logo_urls?.['90'];

  return (
    <Container maxWidth="lg">
      <title>{`${vacancy.name} vacancy in ${vacancy.employer.name} - JobFlow`}</title>
      <Box sx={{ py: 3 }}>
        {/* Back button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Search
        </Button>

        {/* Header section */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 280 }}>
              {/* Title */}
              <Typography variant="h4" component="h1" gutterBottom>
                {vacancy.name}
              </Typography>

              {/* Employer */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {logoUrl ? (
                  <Avatar src={logoUrl} alt={vacancy.employer.name} sx={{ width: 56, height: 56 }}>
                    <BusinessIcon />
                  </Avatar>
                ) : (
                  <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.light' }}>
                    <BusinessIcon />
                  </Avatar>
                )}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">
                      {vacancy.employer.name}
                    </Typography>
                    {vacancy.employer.trusted && (
                      <VerifiedIcon color="primary" fontSize="small" titleAccess="Verified employer" />
                    )}
                    {vacancy.employer.accredited_it_employer && (
                      <Chip label="IT Accredited" size="small" color="info" />
                    )}
                  </Box>
                  {vacancy.employer.alternate_url && (
                    <Link
                      href={vacancy.employer.alternate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      View company <OpenInNewIcon fontSize="small" />
                    </Link>
                  )}
                </Box>
              </Box>

              {/* Salary */}
              <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
                {formatSalary(vacancy.salary)}
              </Typography>

              {/* Location & Work format */}
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOnIcon color="action" fontSize="small" />
                  <Typography variant="body1">{vacancy.area.name}</Typography>
                </Box>
                {vacancy.work_format?.map((format) => (
                  <Box key={format.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <HomeWorkIcon color="action" fontSize="small" />
                    <Typography variant="body1">{format.name}</Typography>
                  </Box>
                ))}
              </Stack>

              {/* Tags */}
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {vacancy.experience && (
                  <Chip
                    icon={<WorkIcon />}
                    label={vacancy.experience.name}
                    variant="outlined"
                    size="small"
                  />
                )}
                {vacancy.employment && (
                  <Chip
                    icon={<AccessTimeIcon />}
                    label={vacancy.employment.name}
                    variant="outlined"
                    size="small"
                  />
                )}
                {vacancy.schedule && (
                  <Chip
                    icon={<ScheduleIcon />}
                    label={vacancy.schedule.name}
                    variant="outlined"
                    size="small"
                  />
                )}
                {vacancy.working_hours?.map((hours) => (
                  <Chip key={hours.id} label={hours.name} variant="outlined" size="small" />
                ))}
              </Stack>
            </Box>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 160 }}>
              <Button
                variant="contained"
                size="large"
                href={vacancy.alternate_url}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<OpenInNewIcon />}
              >
                Apply on hh.ru
              </Button>
              {isAuthenticated && (
                <Button
                  variant={isSaved ? 'contained' : 'outlined'}
                  color={isSaved ? 'primary' : 'inherit'}
                  startIcon={isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  onClick={handleSaveToggle}
                  disabled={addVacancyMutation.isPending || removeVacancyMutation.isPending}
                >
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
              )}
            </Box>
          </Box>

          {/* Published date */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Published: {formatDate(vacancy.published_at)}
          </Typography>
        </Paper>

        {/* Key Skills */}
        {vacancy.key_skills && vacancy.key_skills.length > 0 && (
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: 3 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Key Skills
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {vacancy.key_skills.map((skill) => (
                <Chip
                  key={skill.name}
                  label={skill.name}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Stack>
          </Paper>
        )}

        {/* Description */}
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: 3 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Job Description
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Box
            sx={{
              fontSize: '0.975rem',
              lineHeight: 1.8,
              color: 'text.primary',
              '& p': {
                mb: 1.5,
                lineHeight: 1.8,
              },
              '& p:empty': {
                display: 'none',
              },
              '& strong, & b': {
                fontWeight: 600,
              },
              '& p > strong:only-child, & p > b:only-child': {
                display: 'block',
                fontSize: '1.125rem',
                fontWeight: 700,
                mt: 3,
                mb: 0.5,
                letterSpacing: '-0.01em',
              },
              '& ul, & ol': {
                pl: 4,
                mb: 2.5,
                mt: 1,
              },
              '& ol': {
                listStyleType: 'decimal',
              },
              '& li': {
                mb: 1,
                lineHeight: 1.75,
                pl: 0.5,
                '&::marker': {
                  color: 'primary.main',
                  fontWeight: 600,
                },
              },
              '& a': {
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              },
            }}
            dangerouslySetInnerHTML={{ __html: vacancy.description }}
          />
        </Paper>

        {/* Additional Info */}
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: 3 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Additional Information
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Stack spacing={2.5}>
            {/* Professional roles */}
            {vacancy.professional_roles && vacancy.professional_roles.length > 0 && (
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                  Professional Roles
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                  {vacancy.professional_roles.map((r) => r.name).join(', ')}
                </Typography>
              </Box>
            )}

            {/* Work schedule */}
            {vacancy.work_schedule_by_days && vacancy.work_schedule_by_days.length > 0 && (
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                  Work Schedule
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                  {vacancy.work_schedule_by_days.map((s) => s.name).join(', ')}
                </Typography>
              </Box>
            )}

            {/* Address */}
            {vacancy.address && vacancy.address.raw && (
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                  Address
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7 }}>{vacancy.address.raw}</Typography>
              </Box>
            )}

            {/* Acceptances */}
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1, mb: 1 }}>
                This employer accepts
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {vacancy.accept_handicapped && (
                  <Chip label="People with disabilities" size="small" color="success" variant="outlined" />
                )}
                {vacancy.accept_kids && (
                  <Chip label="Applicants from 14 years" size="small" color="success" variant="outlined" />
                )}
                {vacancy.accept_temporary && (
                  <Chip label="Temporary workers" size="small" color="success" variant="outlined" />
                )}
                {vacancy.accept_incomplete_resumes && (
                  <Chip label="Incomplete resumes" size="small" color="success" variant="outlined" />
                )}
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* Contacts */}
        {vacancy.contacts && (
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: 3 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Contacts
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {vacancy.contacts.name && (
              <Typography variant="body1">
                <strong>Contact person:</strong> {vacancy.contacts.name}
              </Typography>
            )}
            {vacancy.contacts.email && (
              <Typography variant="body1">
                <strong>Email:</strong>{' '}
                <Link href={`mailto:${vacancy.contacts.email}`}>
                  {vacancy.contacts.email}
                </Link>
              </Typography>
            )}
            {vacancy.contacts.phones && vacancy.contacts.phones.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body1">
                  <strong>Phone:</strong>
                </Typography>
                {vacancy.contacts.phones.map((phone, index) => (
                  <Typography key={index} variant="body1" sx={{ ml: 2 }}>
                    {phone.city && `+${phone.city} `}{phone.number}
                    {phone.comment && ` (${phone.comment})`}
                  </Typography>
                ))}
              </Box>
            )}
          </Paper>
        )}

        {/* Bottom actions */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            href={vacancy.alternate_url}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<OpenInNewIcon />}
          >
            Apply on hh.ru
          </Button>
          <Button variant="outlined" size="large" onClick={handleBack}>
            Back to Search
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
