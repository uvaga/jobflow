import { useState, useCallback, useEffect, memo, useMemo, useRef } from 'react';
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
  useHhRegionsByCountryId,
  useHhCitiesByRegionId,
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

  // Local state for salary input (for instant feedback without re-renders)
  const [localSalary, setLocalSalary] = useState<number | undefined>(initialFilters.salary);

  // Track if user is actively typing (to prevent sync interference)
  const isTypingRef = useRef(false);

  // Track which accordions have been opened (for lazy-loading)
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());

  // Load dictionary data from HH.ru API (lazy-loaded on accordion open)
  const { data: dictionaries, isLoading: isDictLoading } = useHhDictionaries(
    expandedAccordions.has('salary') ||
    expandedAccordions.has('experience') ||
    expandedAccordions.has('schedule') ||
    expandedAccordions.has('employment')
  );
  const { data: countries, isLoading: isCountriesLoading } = useHhCountries(
    expandedAccordions.has('country')
  );
  const { data: professionalRoles, isLoading: isProfRolesLoading } = useHhProfessionalRoles(
    expandedAccordions.has('professionalRole')
  );
  const { data: industries, isLoading: isIndustriesLoading } = useHhIndustries(
    expandedAccordions.has('industry')
  );

  // Cascading location data (loaded based on user selections)
  const { data: regions, isLoading: isRegionsLoading } = useHhRegionsByCountryId(
    selectedCountry,
    !!selectedCountry // Only load when country is selected
  );
  const { data: cities, isLoading: isCitiesLoading } = useHhCitiesByRegionId(
    selectedRegion,
    !!selectedRegion // Only load when region is selected
  );

  // Dynamic options from dictionaries (replaces hardcoded constants)
  const experienceOptions = dictionaries?.experience || [];
  const scheduleOptions = dictionaries?.schedule || [];
  const employmentOptions = dictionaries?.employment || [];
  const currencyOptions = dictionaries?.currency || [];

  // Sync internal state when external filters change (e.g., back-navigation restoring URL params)
  // Use ref to track previous initialFilters to avoid comparing with current filters
  const prevInitialFiltersRef = useRef(initialFilters);

  useEffect(() => {
    // Check if initialFilters actually changed (not just a re-render with same values)
    const prev = prevInitialFiltersRef.current;
    const isDifferent =
      prev.area !== initialFilters.area ||
      prev.industry !== initialFilters.industry ||
      prev.professional_role !== initialFilters.professional_role ||
      prev.salary !== initialFilters.salary ||
      prev.experience !== initialFilters.experience ||
      prev.schedule !== initialFilters.schedule ||
      prev.employment !== initialFilters.employment ||
      prev.only_with_salary !== initialFilters.only_with_salary ||
      prev.currency !== initialFilters.currency ||
      prev.page !== initialFilters.page ||
      prev.per_page !== initialFilters.per_page;

    // Only sync if initialFilters actually changed from external source (e.g., browser back/forward)
    if (isDifferent) {
      setFilters(initialFilters);
      // Only sync localSalary if not actively typing (prevents interference with user input)
      if (!isTypingRef.current) {
        setLocalSalary(initialFilters.salary);
      }
      // Update ref to track current initialFilters
      prevInitialFiltersRef.current = initialFilters;
    }
  }, [initialFilters]);

  // Count active filters (memoized to avoid recalculation on every render)
  const activeFilterCount = useMemo(() => {
    return [
      filters.area,
      filters.industry,
      filters.professional_role,
      filters.salary,
      filters.currency,
      filters.experience,
      filters.schedule,
      filters.employment,
      filters.only_with_salary,
    ].filter(Boolean).length;
  }, [filters]);

  const handleFilterChange = useCallback(
    (field: keyof HhSearchParams, value: string | number | boolean | undefined) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Debounce salary input to avoid re-renders on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFilterChange('salary', localSalary);
      isTypingRef.current = false; // Mark typing complete after debounce
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [localSalary, handleFilterChange]);

  const handleApplyFilters = useCallback(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleClearFilters = useCallback(() => {
    // Explicitly set all filter fields to undefined to clear them
    const cleared: HhSearchParams = {
      page: 0,
      per_page: 20,
      area: undefined,
      industry: undefined,
      professional_role: undefined,
      salary: undefined,
      currency: undefined,
      experience: undefined,
      schedule: undefined,
      employment: undefined,
      only_with_salary: undefined,
    };
    setFilters(cleared);
    setSelectedCountry('');
    setSelectedRegion('');
    setLocalSalary(undefined);
    onFilterChange(cleared);
  }, [onFilterChange]);

  // Track accordion expansion for lazy-loading
  const handleAccordionChange = useCallback(
    (accordionName: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      if (isExpanded) {
        setExpandedAccordions((prev) => new Set(prev).add(accordionName));
      }
    },
    []
  );

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
        <Accordion onChange={handleAccordionChange('country')}>
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
                  const countryId = e.target.value;
                  setSelectedCountry(countryId);
                  setSelectedRegion(''); // Reset region (cascade)
                  // Set area to country ID (or undefined if "Any" selected)
                  handleFilterChange('area', countryId || undefined);
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
        <Accordion disabled={!selectedCountry} onChange={handleAccordionChange('region')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Region</Typography>
            {selectedRegion && <Chip label="1" size="small" sx={{ ml: 1 }} />}
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth disabled={!selectedCountry || isRegionsLoading}>
              <InputLabel>Select Region</InputLabel>
              <Select
                value={selectedRegion}
                label="Select Region"
                onChange={(e) => {
                  const regionId = e.target.value;
                  setSelectedRegion(regionId);

                  // If region selected, use its ID
                  // If "Any" selected (empty string), fall back to country ID
                  const areaId = regionId || selectedCountry;
                  handleFilterChange('area', areaId || undefined);
                }}
                startAdornment={
                  isRegionsLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null
                }
              >
                <MenuItem value="">
                  <em>Any</em>
                </MenuItem>
                {regions?.map((region) => (
                  <MenuItem key={region.id} value={region.id}>
                    {region.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        {/* City */}
        <Accordion disabled={!selectedRegion} onChange={handleAccordionChange('city')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>City</Typography>
            {filters.area && <Chip label="1" size="small" sx={{ ml: 1 }} />}
          </AccordionSummary>
          <AccordionDetails>
            <Autocomplete
              disabled={!selectedRegion}
              loading={isRegionsLoading || isCitiesLoading}
              options={cities || []}
              getOptionLabel={(option) => option.name}
              value={cities?.find((c) => c.id === filters.area) || null}
              onChange={(_, value) => {
                // If city selected, use its ID
                // If cleared (null), fall back to region ID
                const areaId = value?.id || selectedRegion;
                handleFilterChange('area', areaId || undefined);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select City"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        {isCitiesLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              noOptionsText="No cities available"
              filterOptions={(options, state) => {
                // Limit to first 100 results for performance
                if (!state.inputValue) return options.slice(0, 100);
                const filtered = options.filter((option) =>
                  option.name.toLowerCase().includes(state.inputValue.toLowerCase())
                );
                return filtered.slice(0, 100);
              }}
            />
          </AccordionDetails>
        </Accordion>

        {/* Industry */}
        <Accordion onChange={handleAccordionChange('industry')}>
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
              filterOptions={(options, state) => {
                // Limit to first 100 results for performance
                const filtered = options.filter((option) =>
                  option.name.toLowerCase().includes(state.inputValue.toLowerCase())
                );
                return filtered.slice(0, 100);
              }}
            />
          </AccordionDetails>
        </Accordion>

        {/* Professional Role */}
        <Accordion onChange={handleAccordionChange('professionalRole')}>
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
              filterOptions={(options, state) => {
                // Limit to first 100 results for performance
                const filtered = options.filter((option) =>
                  option.name.toLowerCase().includes(state.inputValue.toLowerCase())
                );
                return filtered.slice(0, 100);
              }}
            />
          </AccordionDetails>
        </Accordion>

        {/* Salary */}
        <Accordion onChange={handleAccordionChange('salary')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Salary</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <TextField
                fullWidth
                type="number"
                label="Minimum Salary"
                value={localSalary || ''}
                onChange={(e) => {
                  isTypingRef.current = true;
                  setLocalSalary(e.target.value ? Number(e.target.value) : undefined);
                }}
                InputProps={{ inputProps: { min: 0, step: 10000 } }}
              />

              <FormControl fullWidth disabled={isDictLoading}>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={filters.currency || ''}
                  label="Currency"
                  onChange={(e) =>
                    handleFilterChange('currency', e.target.value || undefined)
                  }
                  startAdornment={
                    isDictLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null
                  }
                >
                  <MenuItem value="">
                    <em>Any</em>
                  </MenuItem>
                  {currencyOptions.map((option) => (
                    <MenuItem key={option.code} value={option.code}>
                      {option.name} ({option.abbr})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

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
        <Accordion onChange={handleAccordionChange('experience')}>
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
        <Accordion onChange={handleAccordionChange('schedule')}>
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
        <Accordion onChange={handleAccordionChange('employment')}>
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

// Custom comparison function to prevent re-renders when filters haven't actually changed
const arePropsEqual = (
  prevProps: FilterPanelProps,
  nextProps: FilterPanelProps
): boolean => {
  // Compare onFilterChange by reference
  if (prevProps.onFilterChange !== nextProps.onFilterChange) {
    return false;
  }

  // Deep compare initialFilters
  const prevFilters = prevProps.initialFilters || {};
  const nextFilters = nextProps.initialFilters || {};

  // Compare each filter property
  return (
    prevFilters.area === nextFilters.area &&
    prevFilters.industry === nextFilters.industry &&
    prevFilters.professional_role === nextFilters.professional_role &&
    prevFilters.salary === nextFilters.salary &&
    prevFilters.currency === nextFilters.currency &&
    prevFilters.experience === nextFilters.experience &&
    prevFilters.schedule === nextFilters.schedule &&
    prevFilters.employment === nextFilters.employment &&
    prevFilters.only_with_salary === nextFilters.only_with_salary &&
    prevFilters.page === nextFilters.page &&
    prevFilters.per_page === nextFilters.per_page
  );
};

export default memo(FilterPanel, arePropsEqual);
