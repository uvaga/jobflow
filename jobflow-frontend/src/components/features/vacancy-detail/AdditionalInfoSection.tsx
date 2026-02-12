import { Paper, Typography, Divider, Stack, Box, Chip } from '@mui/material';

import type { NormalizedVacancy } from '@/utils/vacancyNormalizer';

interface AdditionalInfoSectionProps {
  vacancy: NormalizedVacancy;
}

export default function AdditionalInfoSection({ vacancy }: AdditionalInfoSectionProps) {
  const hasAcceptances =
    vacancy.acceptHandicapped ||
    vacancy.acceptKids ||
    vacancy.acceptTemporary ||
    vacancy.acceptIncompleteResumes;

  const hasContent =
    vacancy.professionalRoles.length > 0 ||
    vacancy.workScheduleByDays.length > 0 ||
    (vacancy.address && vacancy.address.raw) ||
    hasAcceptances;

  if (!hasContent) return null;

  return (
    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: 3 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Additional Information
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Stack spacing={2.5}>
        {vacancy.professionalRoles.length > 0 && (
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
              Professional Roles
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
              {vacancy.professionalRoles.map((r) => r.name).join(', ')}
            </Typography>
          </Box>
        )}

        {vacancy.workScheduleByDays.length > 0 && (
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
              Work Schedule
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
              {vacancy.workScheduleByDays.map((s) => s.name).join(', ')}
            </Typography>
          </Box>
        )}

        {vacancy.address && vacancy.address.raw && (
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
              Address
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
              {vacancy.address.raw}
            </Typography>
          </Box>
        )}

        {hasAcceptances && (
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
        )}
      </Stack>
    </Paper>
  );
}
