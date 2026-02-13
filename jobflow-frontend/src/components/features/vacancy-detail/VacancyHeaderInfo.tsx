import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Chip,
  Tooltip,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VerifiedIcon from '@mui/icons-material/Verified';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
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
        <RouterLink to={`/employer/${vacancy.employer.id}`} style={{ textDecoration: 'none' }}>
          {vacancy.employer.logoUrl ? (
            <Avatar src={vacancy.employer.logoUrl} alt={vacancy.employer.name} sx={{ width: 56, height: 56 }}>
              <BusinessIcon />
            </Avatar>
          ) : (
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.light' }}>
              <BusinessIcon />
            </Avatar>
          )}
        </RouterLink>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h6"
              component={RouterLink}
              to={`/employer/${vacancy.employer.id}`}
              sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
            >
              {vacancy.employer.name}
            </Typography>
            {vacancy.employer.trusted && (
              <VerifiedIcon color="primary" fontSize="small" titleAccess="Verified employer" />
            )}
            {vacancy.employer.accreditedItEmployer && (
              <Chip label="IT Accredited" size="small" color="info" />
            )}
          </Box>
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
          <Tooltip key={hours.id} title="Working hours">
            <Chip
              icon={<HourglassBottomIcon />}
              label={hours.name}
              variant="outlined"
              size="small"
            />
          </Tooltip>
        ))}
        {vacancy.workScheduleByDays?.map((schedule) => (
          <Tooltip key={schedule.id} title="Work schedule by days">
            <Chip
              icon={<CalendarTodayIcon />}
              label={schedule.name}
              variant="outlined"
              size="small"
            />
          </Tooltip>
        ))}
      </Stack>
    </Box>
  );
}
