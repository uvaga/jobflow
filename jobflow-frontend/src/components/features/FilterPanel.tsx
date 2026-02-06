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
import type { HhSearchParams } from '@/services/hhApiService';

interface FilterPanelProps {
  onFilterChange: (filters: HhSearchParams) => void;
  initialFilters?: HhSearchParams;
}

// hh.ru experience options (from /dictionaries)
const EXPERIENCE_OPTIONS = [
  { id: 'noExperience', name: 'No experience' },
  { id: 'between1And3', name: '1-3 years' },
  { id: 'between3And6', name: '3-6 years' },
  { id: 'moreThan6', name: 'More than 6 years' },
];

// hh.ru schedule options (from /dictionaries)
const SCHEDULE_OPTIONS = [
  { id: 'fullDay', name: 'Full-time' },
  { id: 'shift', name: 'Shift work' },
  { id: 'flexible', name: 'Flexible schedule' },
  { id: 'remote', name: 'Remote' },
];

// hh.ru employment options (from /dictionaries)
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
  const [filters, setFilters] = useState<HhSearchParams>(initialFilters);

  // Count active filters
  const activeFilterCount = [
    filters.salary,
    filters.experience,
    filters.schedule,
    filters.employment,
    filters.only_with_salary,
  ].filter(Boolean).length;

  const handleFilterChange = useCallback(
    (field: keyof HhSearchParams, value: string | number | boolean | undefined) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleApplyFilters = useCallback(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleClearFilters = useCallback(() => {
    const cleared: HhSearchParams = { page: 0, per_page: 20 };
    setFilters(cleared);
    onFilterChange(cleared);
  }, [onFilterChange]);

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon color="primary" />
          <Typography variant="h6">Filters</Typography>
          {activeFilterCount > 0 && (
            <Chip label={activeFilterCount} size="small" color="primary" />
          )}
        </Box>
        {activeFilterCount > 0 && (
          <Button size="small" startIcon={<ClearIcon />} onClick={handleClearFilters}>
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
              value={filters.salary || ''}
              onChange={(e) =>
                handleFilterChange('salary', e.target.value ? Number(e.target.value) : undefined)
              }
              InputProps={{ inputProps: { min: 0, step: 10000 } }}
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
                value={filters.experience || ''}
                label="Experience Level"
                onChange={(e) =>
                  handleFilterChange('experience', e.target.value || undefined)
                }
              >
                <MenuItem value=""><em>Any</em></MenuItem>
                {EXPERIENCE_OPTIONS.map((option) => (
                  <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
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
                value={filters.schedule || ''}
                label="Work Schedule"
                onChange={(e) =>
                  handleFilterChange('schedule', e.target.value || undefined)
                }
              >
                <MenuItem value=""><em>Any</em></MenuItem>
                {SCHEDULE_OPTIONS.map((option) => (
                  <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
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
                value={filters.employment || ''}
                label="Employment"
                onChange={(e) =>
                  handleFilterChange('employment', e.target.value || undefined)
                }
              >
                <MenuItem value=""><em>Any</em></MenuItem>
                {EMPLOYMENT_OPTIONS.map((option) => (
                  <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
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
