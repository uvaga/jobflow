import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Divider,
  Avatar,
  Stack,
  Chip,
  Link,
  Skeleton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VerifiedIcon from '@mui/icons-material/Verified';
import HomeWorkIcon from '@mui/icons-material/HomeWork';

import {
  useSavedVacancyDetail,
  useRefreshSavedVacancy,
  useRemoveVacancy,
  useUpdateSavedVacancyProgress,
} from '@/hooks/useVacancies';
import ProgressStatusChip from '@/components/features/ProgressStatusChip';
import { VacancyProgressStatus } from '@/types/vacancyProgress';
import type { Vacancy } from '@/types';

const statusOptions = Object.values(VacancyProgressStatus);

function formatSalary(salary: Vacancy['salary']): string {
  if (!salary) return 'Salary not specified';
  const { from, to, currency, gross } = salary;
  const grossLabel = gross ? ' (gross)' : ' (net)';
  if (from && to) return `${from.toLocaleString()} - ${to.toLocaleString()} ${currency}${grossLabel}`;
  if (from) return `From ${from.toLocaleString()} ${currency}${grossLabel}`;
  if (to) return `Up to ${to.toLocaleString()} ${currency}${grossLabel}`;
  return 'Salary not specified';
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DetailSkeleton() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Skeleton variant="text" width={100} height={40} sx={{ mb: 2 }} />
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Skeleton variant="text" width="60%" height={48} />
          <Skeleton variant="text" width="40%" height={32} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="30%" height={24} sx={{ mt: 2 }} />
        </Paper>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
        </Paper>
      </Box>
    </Container>
  );
}

export default function SavedVacancyDetail() {
  const { id: hhId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: entry, isPending, isError, error } = useSavedVacancyDetail(hhId);
  const refreshMutation = useRefreshSavedVacancy();
  const removeMutation = useRemoveVacancy();
  const updateProgressMutation = useUpdateSavedVacancyProgress();

  const handleBack = useCallback(() => {
    navigate('/vacancies');
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    if (hhId) refreshMutation.mutate(hhId);
  }, [hhId, refreshMutation]);

  const handleUnsave = useCallback(() => {
    if (hhId) {
      removeMutation.mutate(hhId, {
        onSuccess: () => navigate('/vacancies'),
      });
    }
  }, [hhId, removeMutation, navigate]);

  const handleStatusChange = useCallback((e: { target: { value: string } }) => {
    if (hhId && e.target.value) {
      updateProgressMutation.mutate({ hhId, status: e.target.value });
    }
  }, [hhId, updateProgressMutation]);

  if (isPending) return <DetailSkeleton />;

  if (isError) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
            Back to Saved
          </Button>
          <Alert severity="error">{error?.message || 'Failed to load vacancy details'}</Alert>
        </Box>
      </Container>
    );
  }

  if (!entry) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
            Back to Saved
          </Button>
          <Alert severity="warning">Saved vacancy not found</Alert>
        </Box>
      </Container>
    );
  }

  const vacancy = entry.vacancy;
  const progress = entry.progress;
  const currentStatus = progress.length > 0 ? progress[progress.length - 1].status : undefined;
  const savedDate = progress[0]?.statusSetDate;
  const logoUrl = vacancy.employer?.logoUrls?.['240'] || vacancy.employer?.logoUrls?.['90'];

  return (
    <Container maxWidth="lg">
      <title>{`${vacancy.name} - Saved Vacancy - JobFlow`}</title>
      <Box sx={{ py: 3 }}>
        {/* Back button */}
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Saved Vacancies
        </Button>

        {/* Header section */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 280 }}>
              {/* Current status */}
              {currentStatus && (
                <Box sx={{ mb: 2 }}>
                  <ProgressStatusChip status={currentStatus} size="medium" />
                </Box>
              )}

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
                    <Typography variant="h6">{vacancy.employer.name}</Typography>
                    {vacancy.employer.trusted && (
                      <VerifiedIcon color="primary" fontSize="small" titleAccess="Verified employer" />
                    )}
                    {vacancy.employer.accreditedItEmployer && (
                      <Chip label="IT Accredited" size="small" color="info" />
                    )}
                  </Box>
                  {vacancy.employer.alternateUrl && (
                    <Link
                      href={vacancy.employer.alternateUrl}
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
                {vacancy.workFormat?.map((format) => (
                  <Box key={format.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <HomeWorkIcon color="action" fontSize="small" />
                    <Typography variant="body1">{format.name}</Typography>
                  </Box>
                ))}
              </Stack>

              {/* Tags */}
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {vacancy.experience && (
                  <Chip icon={<WorkIcon />} label={vacancy.experience.name} variant="outlined" size="small" />
                )}
                {vacancy.employment && (
                  <Chip icon={<AccessTimeIcon />} label={vacancy.employment.name} variant="outlined" size="small" />
                )}
                {vacancy.schedule && (
                  <Chip icon={<ScheduleIcon />} label={vacancy.schedule.name} variant="outlined" size="small" />
                )}
                {vacancy.workingHours?.map((hours) => (
                  <Chip key={hours.id} label={hours.name} variant="outlined" size="small" />
                ))}
              </Stack>
            </Box>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 180 }}>
              {vacancy.alternateUrl && (
                <Button
                  variant="contained"
                  size="large"
                  href={vacancy.alternateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<OpenInNewIcon />}
                >
                  View on hh.ru
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={refreshMutation.isPending}
              >
                {refreshMutation.isPending ? 'Refreshing...' : 'Refresh from hh.ru'}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleUnsave}
                disabled={removeMutation.isPending}
              >
                {removeMutation.isPending ? 'Removing...' : 'Remove from Saved'}
              </Button>
            </Box>
          </Box>

          {/* Dates info */}
          <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {savedDate && (
              <Typography variant="body2" color="text.secondary">
                Saved: {formatDate(savedDate)}
              </Typography>
            )}
            {vacancy.updatedAt && (
              <Typography variant="body2" color="text.secondary">
                Last updated: {formatDate(vacancy.updatedAt)}
              </Typography>
            )}
            {vacancy.publishedAt && (
              <Typography variant="body2" color="text.secondary">
                Published: {formatDate(vacancy.publishedAt)}
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Progress Management */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Progress
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {/* Status selector */}
          <Box sx={{ mb: 3 }}>
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Update Status</InputLabel>
              <Select
                value=""
                label="Update Status"
                onChange={handleStatusChange}
                disabled={updateProgressMutation.isPending}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    <ProgressStatusChip status={status} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Progress history */}
          {progress.length > 0 && (
            <Stack spacing={1}>
              {[...progress].reverse().map((entry, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    pl: 2,
                    borderLeft: index === 0 ? '3px solid' : '3px solid',
                    borderColor: index === 0 ? 'primary.main' : 'grey.300',
                    py: 0.5,
                  }}
                >
                  <ProgressStatusChip status={entry.status} />
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(entry.statusSetDate)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>

        {/* Key Skills */}
        {vacancy.keySkills && vacancy.keySkills.length > 0 && (
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: 3 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Key Skills
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {vacancy.keySkills.map((skill) => (
                <Chip key={skill.name} label={skill.name} color="primary" variant="outlined" />
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
              '& p': { mb: 1.5, lineHeight: 1.8 },
              '& p:empty': { display: 'none' },
              '& strong, & b': { fontWeight: 600 },
              '& p > strong:only-child, & p > b:only-child': {
                display: 'block', fontSize: '1.125rem', fontWeight: 700,
                mt: 3, mb: 0.5, letterSpacing: '-0.01em',
              },
              '& ul, & ol': { pl: 4, mb: 2.5, mt: 1 },
              '& ol': { listStyleType: 'decimal' },
              '& li': {
                mb: 1, lineHeight: 1.75, pl: 0.5,
                '&::marker': { color: 'primary.main', fontWeight: 600 },
              },
              '& a': {
                color: 'primary.main', textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
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
            {vacancy.professionalRoles && vacancy.professionalRoles.length > 0 && (
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                  Professional Roles
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                  {vacancy.professionalRoles.map((r) => r.name).join(', ')}
                </Typography>
              </Box>
            )}
            {vacancy.workScheduleByDays && vacancy.workScheduleByDays.length > 0 && (
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                  Work Schedule
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                  {vacancy.workScheduleByDays.map((s) => s.name).join(', ')}
                </Typography>
              </Box>
            )}
            {vacancy.address && (vacancy.address as { raw?: string }).raw && (
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                  Address
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                  {(vacancy.address as { raw: string }).raw}
                </Typography>
              </Box>
            )}
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1, mb: 1 }}>
                This employer accepts
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {vacancy.acceptHandicapped && (
                  <Chip label="People with disabilities" size="small" color="success" variant="outlined" />
                )}
                {vacancy.acceptKids && (
                  <Chip label="Applicants from 14 years" size="small" color="success" variant="outlined" />
                )}
                {vacancy.acceptTemporary && (
                  <Chip label="Temporary workers" size="small" color="success" variant="outlined" />
                )}
                {vacancy.acceptIncompleteResumes && (
                  <Chip label="Incomplete resumes" size="small" color="success" variant="outlined" />
                )}
              </Stack>
            </Box>
          </Stack>
        </Paper>

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
              View on hh.ru
            </Button>
          )}
          <Button variant="outlined" size="large" onClick={handleBack}>
            Back to Saved Vacancies
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
