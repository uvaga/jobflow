import { useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  Avatar,
  Chip,
  Stack,
  Divider,
  Skeleton,
  Link,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LanguageIcon from '@mui/icons-material/Language';
import WorkIcon from '@mui/icons-material/Work';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VerifiedIcon from '@mui/icons-material/Verified';

import { useEmployer } from '@/hooks/useEmployer';

function EmployerDetailSkeleton() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Skeleton variant="text" width={100} height={40} sx={{ mb: 2 }} />
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
            <Skeleton variant="rounded" width={100} height={100} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="40%" height={40} />
              <Skeleton variant="text" width="20%" height={24} />
              <Skeleton variant="text" width="30%" height={24} />
            </Box>
          </Box>
        </Paper>
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Skeleton variant="text" width="20%" height={32} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={200} />
        </Paper>
      </Box>
    </Container>
  );
}

export default function EmployerDetail() {
  const { employerId } = useParams<{ employerId: string }>();
  const navigate = useNavigate();

  const { data: employer, isPending, isError, error } = useEmployer(employerId);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  if (isPending) {
    return <EmployerDetailSkeleton />;
  }

  if (isError) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
            Back
          </Button>
          <Alert severity="error" sx={{ mt: 2 }}>
            {error?.message || 'Failed to load employer details'}
          </Alert>
        </Box>
      </Container>
    );
  }

  if (!employer) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
            Back
          </Button>
          <Alert severity="warning">Employer not found</Alert>
        </Box>
      </Container>
    );
  }

  const logoUrl = employer.logo_urls?.['240'] || employer.logo_urls?.['90'] || employer.logo_urls?.original;

  return (
    <Container maxWidth="lg">
      <title>{`${employer.name} - Employer - JobFlow`}</title>
      <Box sx={{ py: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back
        </Button>

        {/* Header section */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {logoUrl ? (
              <Avatar
                src={logoUrl}
                alt={employer.name}
                variant="rounded"
                sx={{ width: 100, height: 100 }}
              >
                <BusinessIcon sx={{ fontSize: 48 }} />
              </Avatar>
            ) : (
              <Avatar
                variant="rounded"
                sx={{ width: 100, height: 100, bgcolor: 'primary.light' }}
              >
                <BusinessIcon sx={{ fontSize: 48 }} />
              </Avatar>
            )}

            <Box sx={{ flex: 1, minWidth: 280 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h4" component="h1">
                  {employer.name}
                </Typography>
                {employer.trusted && (
                  <VerifiedIcon color="primary" titleAccess="Verified employer" />
                )}
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                {employer.accredited_it_employer && (
                  <Chip label="IT Accredited" size="small" color="info" />
                )}
                {employer.type && (
                  <Chip label={employer.type} size="small" variant="outlined" />
                )}
                {employer.open_vacancies > 0 && (
                  <Chip
                    icon={<WorkIcon />}
                    label={`${employer.open_vacancies} open ${employer.open_vacancies === 1 ? 'vacancy' : 'vacancies'}`}
                    size="small"
                    variant="outlined"
                    color="primary"
                    component={RouterLink}
                    to={`/search?employer_id=${employer.id}`}
                    clickable
                  />
                )}
              </Stack>

              <Stack spacing={1}>
                {employer.area && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOnIcon color="action" fontSize="small" />
                    <Typography variant="body1">{employer.area.name}</Typography>
                  </Box>
                )}
                {employer.site_url && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LanguageIcon color="action" fontSize="small" />
                    <Link
                      href={employer.site_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      {employer.site_url} <OpenInNewIcon fontSize="inherit" />
                    </Link>
                  </Box>
                )}
              </Stack>
            </Box>
          </Box>
        </Paper>

        {/* Industries */}
        {employer.industries && employer.industries.length > 0 && (
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Industries
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {employer.industries.map((industry) => (
                <Chip key={industry.id} label={industry.name} variant="outlined" />
              ))}
            </Stack>
          </Paper>
        )}

        {/* Description */}
        {employer.description && (
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              About the Company
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box
              sx={{
                '& img': { maxWidth: '100%', height: 'auto' },
                '& a': { color: 'primary.main' },
              }}
              dangerouslySetInnerHTML={{ __html: employer.description }}
            />
          </Paper>
        )}

        {/* Bottom actions */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
          <Button variant="outlined" size="large" onClick={handleBack}>
            Back
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
