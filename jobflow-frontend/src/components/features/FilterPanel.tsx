import { useState, useCallback, useEffect, memo } from 'react';
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
  Autocomplete,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import type { HhSearchParams } from '@/services/hhApiService';
import {
  useHhDictionaries,
  useHhCountries,
  useRegionsByCountry,
  useCitiesByRegion,
  useHhProfessionalRoles,
  useHhIndustries,
} from '@/hooks/useHhApi';

interface FilterPanelProps {
  onFilterChange: (filters: HhSearchParams) => void;
  initialFilters?: HhSearchParams;
}

function FilterPanel({
  onFilterChange,
  initialFilters = {},
}: FilterPanelProps) {
  const [filters, setFilters] = useState<HhSearchParams>(initialFilters);

  // Local state for cascading filters (location only)
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  // Load dictionary data from HH.ru API
  const { data: dictionaries, isLoading: isDictLoading } = useHhDictionaries();
  const { data: countries, isLoading: isCountriesLoading } = useHhCountries();
  const { data: professionalRoles, isLoading: isProfRolesLoading } = useHhProfessionalRoles();
  const { data: industries, isLoading: isIndustriesLoading } = useHhIndustries();

  // Filtered data based on selections (cascading filters for location)
  const regions = useRegionsByCountry(selectedCountry);
  const cities = useCitiesByRegion(selectedRegion);

  // Dynamic options from dictionaries (replaces hardcoded constants)
  const experienceOptions = dictionaries?.experience || [];
  const scheduleOptions = dictionaries?.schedule || [];
  const employmentOptions = dictionaries?.employment || [];

  // Sync internal state when external filters change (e.g., back-navigation restoring URL params)
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Count active filters
  const activeFilterCount = [
    filters.area,
    filters.industry,
    filters.professional_role,
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
    setSelectedCountry('');
    setSelectedRegion('');
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
        {/* Country */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Country</Typography>
            {selectedCountry && <Chip label="1" size="small" sx={{ ml: 1 }} />}
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth disabled={isCountriesLoading}>
              <InputLabel>Select Country</InputLabel>
              <Select
                value={selectedCountry}
                label="Select Country"
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setSelectedRegion(''); // Reset region
                  handleFilterChange('area', undefined); // Clear area filter
                }}
                startAdornment={
                  isCountriesLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null
                }
              >
                <MenuItem value="">
                  <em>Any</em>
                </MenuItem>
                {countries?.map((country) => (
                  <MenuItem key={country.id} value={country.id}>
                    {country.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        {/* Region */}
        <Accordion disabled={!selectedCountry}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Region</Typography>
            {selectedRegion && <Chip label="1" size="small" sx={{ ml: 1 }} />}
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth disabled={!selectedCountry}>
              <InputLabel>Select Region</InputLabel>
              <Select
                value={selectedRegion}
                label="Select Region"
                onChange={(e) => {
                  const regionId = e.target.value;
                  setSelectedRegion(regionId);

                  // Check if selected region has cities
                  const selectedRegionData = regions.find(r => r.id === regionId);
                  const hasCities = selectedRegionData?.areas && selectedRegionData.areas.length > 0;

                  // If no cities, use region ID as area (e.g., Minsk is both region and city)
                  // Otherwise, clear area and wait for city selection
                  handleFilterChange('area', hasCities ? undefined : regionId);
                }}
              >
                <MenuItem value="">
                  <em>Any</em>
                </MenuItem>
                {regions.map((region) => (
                  <MenuItem key={region.id} value={region.id}>
                    {region.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        {/* City */}
        <Accordion disabled={!selectedRegion}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>City</Typography>
            {filters.area && <Chip label="1" size="small" sx={{ ml: 1 }} />}
          </AccordionSummary>
          <AccordionDetails>
            <Autocomplete
              disabled={!selectedRegion}
              options={cities}
              getOptionLabel={(option) => option.name}
              value={cities.find((c) => c.id === filters.area) || null}
              onChange={(_, value) => {
                handleFilterChange('area', value?.id);
              }}
              renderInput={(params) => <TextField {...params} label="Select City" />}
              noOptionsText="No cities available"
            />
          </AccordionDetails>
        </Accordion>

        {/* Industry */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Industry</Typography>
            {filters.industry && <Chip label="1" size="small" sx={{ ml: 1 }} />}
          </AccordionSummary>
          <AccordionDetails>
            <Autocomplete
              disabled={isIndustriesLoading}
              options={industries || []}
              getOptionLabel={(option) => option.name}
              value={
                industries?.find((ind) => ind.id === filters.industry) || null
              }
              onChange={(_, value) => {
                handleFilterChange('industry', value?.id || undefined);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Industry"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        {isIndustriesLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              noOptionsText="No industries available"
            />
          </AccordionDetails>
        </Accordion>

        {/* Professional Role */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Professional Role</Typography>
            {filters.professional_role && <Chip label="1" size="small" sx={{ ml: 1 }} />}
          </AccordionSummary>
          <AccordionDetails>
            <Autocomplete
              disabled={isProfRolesLoading}
              options={professionalRoles || []}
              getOptionLabel={(option) => option.name}
              value={
                professionalRoles?.find((role) => role.id === filters.professional_role) || null
              }
              onChange={(_, value) => {
                handleFilterChange('professional_role', value?.id || undefined);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Professional Role"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        {isProfRolesLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              noOptionsText="No roles available"
            />
          </AccordionDetails>
        </Accordion>

        {/* Salary */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Salary</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
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

              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.only_with_salary || false}
                    onChange={(e) =>
                      handleFilterChange('only_with_salary', e.target.checked || undefined)
                    }
                  />
                }
                label="Only show vacancies with salary specified"
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Experience */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Experience</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth disabled={isDictLoading}>
              <InputLabel>Experience Level</InputLabel>
              <Select
                value={filters.experience || ''}
                label="Experience Level"
                onChange={(e) =>
                  handleFilterChange('experience', e.target.value || undefined)
                }
                startAdornment={
                  isDictLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null
                }
              >
                <MenuItem value="">
                  <em>Any</em>
                </MenuItem>
                {experienceOptions.map((option) => (
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
            <FormControl fullWidth disabled={isDictLoading}>
              <InputLabel>Work Schedule</InputLabel>
              <Select
                value={filters.schedule || ''}
                label="Work Schedule"
                onChange={(e) =>
                  handleFilterChange('schedule', e.target.value || undefined)
                }
                startAdornment={
                  isDictLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null
                }
              >
                <MenuItem value="">
                  <em>Any</em>
                </MenuItem>
                {scheduleOptions.map((option) => (
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
            <FormControl fullWidth disabled={isDictLoading}>
              <InputLabel>Employment</InputLabel>
              <Select
                value={filters.employment || ''}
                label="Employment"
                onChange={(e) =>
                  handleFilterChange('employment', e.target.value || undefined)
                }
                startAdornment={
                  isDictLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null
                }
              >
                <MenuItem value="">
                  <em>Any</em>
                </MenuItem>
                {employmentOptions.map((option) => (
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

export default memo(FilterPanel);
