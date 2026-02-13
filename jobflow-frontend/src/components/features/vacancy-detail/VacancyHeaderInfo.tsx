import {
  Box,
  Typography,
  Avatar,
  Stack,
  Chip,
  Link,
  Tooltip,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VerifiedIcon from '@mui/icons-material/Verified';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import SalaryDisplay from '@/components/features/SalaryDisplay';
import type { NormalizedVacancy } from '@/utils/vacancyNormalizer';

interface VacancyHeaderInfoProps {
  vacancy: NormalizedVacancy;
}

export default function VacancyHeaderInfo({ vacancy }: VacancyHeaderInfoProps) {
  return (
    <Box sx={{ flex: 1, minWidth: 280 }}>
      {/* Title */}
      <Typography variant="h4" component="h1" gutterBottom>
        {vacancy.name}
      </Typography>

      {/* Employer */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        {vacancy.employer.logoUrl ? (
          <Avatar src={vacancy.employer.logoUrl} alt={vacancy.employer.name} sx={{ width: 56, height: 56 }}>
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
      <SalaryDisplay salary={vacancy.salary} variant="h5" />

      {/* Location & Work format */}
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <Tooltip title="Location">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationOnIcon color="action" fontSize="small" />
            <Typography variant="body1">{vacancy.area.name}</Typography>
          </Box>
        </Tooltip>
        {vacancy.workFormat?.map((format) => (
          <Tooltip key={format.id} title="Work format">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <HomeWorkIcon color="action" fontSize="small" />
              <Typography variant="body1">{format.name}</Typography>
            </Box>
          </Tooltip>
        ))}
      </Stack>

      {/* Tags */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {vacancy.experience && (
          <Tooltip title="Experience">
            <Chip
              icon={<WorkIcon />}
              label={vacancy.experience.name}
              variant="outlined"
              size="small"
            />
          </Tooltip>
        )}
        {vacancy.employment && (
          <Tooltip title="Employment type">
            <Chip
              icon={<AccessTimeIcon />}
              label={vacancy.employment.name}
              variant="outlined"
              size="small"
            />
          </Tooltip>
        )}
        {vacancy.schedule && (
          <Tooltip title="Schedule">
            <Chip
              icon={<ScheduleIcon />}
              label={vacancy.schedule.name}
              variant="outlined"
              size="small"
            />
          </Tooltip>
        )}
        {vacancy.workingHours?.map((hours) => (
          <Chip key={hours.id} label={hours.name} variant="outlined" size="small" />
        ))}
      </Stack>
    </Box>
  );
}
