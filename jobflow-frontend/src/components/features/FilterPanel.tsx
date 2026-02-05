import { useState, useCallback } from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import type {VacancySearchParams} from '@/services/vacancyService';

interface FilterPanelProps {
  onFilterChange: (filters: VacancySearchParams) => void;
  initialFilters?: VacancySearchParams;
}

// Mock data - will be replaced with API data in Sprint 2
const EXPERIENCE_OPTIONS = [
  { id: 'noExperience', name: 'No experience' },
  { id: 'between1And3', name: '1-3 years' },
  { id: 'between3And6', name: '3-6 years' },
  { id: 'moreThan6', name: 'More than 6 years' },
];

const SCHEDULE_OPTIONS = [
  { id: 'fullDay', name: 'Full-time' },
  { id: 'shift', name: 'Shift work' },
  { id: 'flexible', name: 'Flexible schedule' },
  { id: 'remote', name: 'Remote' },
];

const EMPLOYMENT_OPTIONS = [
  { id: 'full', name: 'Full employment' },
  { id: 'part', name: 'Part-time' },
  { id: 'project', name: 'Project work' },
  { id: 'volunteer', name: 'Volunteering' },
  { id: 'probation', name: 'Probation' },
];

export default function FilterPanel({
  onFilterChange,
  initialFilters = {},
}: FilterPanelProps) {
  const [filters, setFilters] = useState<VacancySearchParams>(initialFilters);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Count active filters
  const countActiveFilters = useCallback(
    (filterObj: VacancySearchParams): number => {
      let count = 0;
      if (filterObj.salaryFrom) count++;
      if (filterObj.experienceId) count++;
      if (filterObj.scheduleId) count++;
      if (filterObj.employmentId) count++;
      if (filterObj.areaId) count++;
      return count;
    },
    [],
  );

  const handleFilterChange = useCallback(
    (field: keyof VacancySearchParams, value: string | number | undefined) => {
      setFilters((prev) => {
        const updated = { ...prev, [field]: value };
        setActiveFilterCount(countActiveFilters(updated));
        return updated;
      });
    },
    [countActiveFilters],
  );

  const handleApplyFilters = useCallback(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleClearFilters = useCallback(() => {
    const cleared: VacancySearchParams = {};
    setFilters(cleared);
    setActiveFilterCount(0);
    onFilterChange(cleared);
  }, [onFilterChange]);

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon color="primary" />
          <Typography variant="h6">Filters</Typography>
          {activeFilterCount > 0 && (
            <Chip label={activeFilterCount} size="small" color="primary" />
          )}
        </Box>
        {activeFilterCount > 0 && (
          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
          >
            Clear All
          </Button>
        )}
      </Box>

      <Stack spacing={2}>
        {/* Salary */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Salary</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              fullWidth
              type="number"
              label="Minimum Salary"
              value={filters.salaryFrom || ''}
              onChange={(e) =>
                handleFilterChange(
                  'salaryFrom',
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              InputProps={{ inputProps: { min: 0, step: 1000 } }}
            />
          </AccordionDetails>
        </Accordion>

        {/* Experience */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Experience</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth>
              <InputLabel>Experience Level</InputLabel>
              <Select
                value={filters.experienceId || ''}
                label="Experience Level"
                onChange={(e) =>
                  handleFilterChange(
                    'experienceId',
                    e.target.value || undefined,
                  )
                }
              >
                <MenuItem value="">
                  <em>Any</em>
                </MenuItem>
                {EXPERIENCE_OPTIONS.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        {/* Schedule */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Schedule</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth>
              <InputLabel>Work Schedule</InputLabel>
              <Select
                value={filters.scheduleId || ''}
                label="Work Schedule"
                onChange={(e) =>
                  handleFilterChange('scheduleId', e.target.value || undefined)
                }
              >
                <MenuItem value="">
                  <em>Any</em>
                </MenuItem>
                {SCHEDULE_OPTIONS.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        {/* Employment Type */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Employment Type</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth>
              <InputLabel>Employment</InputLabel>
              <Select
                value={filters.employmentId || ''}
                label="Employment"
                onChange={(e) =>
                  handleFilterChange(
                    'employmentId',
                    e.target.value || undefined,
                  )
                }
              >
                <MenuItem value="">
                  <em>Any</em>
                </MenuItem>
                {EMPLOYMENT_OPTIONS.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        {/* Apply Button */}
        <Button variant="contained" fullWidth onClick={handleApplyFilters}>
          Apply Filters
        </Button>
      </Stack>
    </Paper>
  );
}
