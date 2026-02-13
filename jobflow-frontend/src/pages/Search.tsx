import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
  Fab,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';

import SearchBar from '@/components/common/SearchBar';
import FilterPanel from '@/components/features/FilterPanel';
import VacancyList from '@/components/features/VacancyList';
import Pagination from '@/components/common/Pagination';
import LoadingSpinner from '@/components/common/LoadingSpinner';

import { useHhVacancySearch } from '@/hooks/useHhApi';
import { useSavedVacancies, useAddVacancy, useRemoveVacancy } from '@/hooks/useVacancies';
import { useAuthStore } from '@/store/authStore';
import type { HhSearchParams } from '@/services/hhApiService';

// Parse URL search params into filters object
function parseFiltersFromUrl(sp: URLSearchParams): HhSearchParams {
  return {
    page: sp.has('page') ? Number(sp.get('page')) : 0,
    per_page: sp.has('per_page') ? Number(sp.get('per_page')) : 20,
    area: sp.get('area') || undefined,
    industry: sp.get('industry') || undefined,
    professional_role: sp.get('professional_role') || undefined,
    salary: sp.has('salary') ? Number(sp.get('salary')) : undefined,
    experience: sp.get('experience') || undefined,
    schedule: sp.get('schedule') || undefined,
    employment: sp.get('employment') || undefined,
    only_with_salary: sp.get('only_with_salary') === 'true' || undefined,
    currency: sp.get('currency') || undefined,
  };
}

// Build URL search params from state (omit defaults/empty values)
function buildUrlParams(text: string, filters: HhSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  if (text) params.set('text', text);
  if (filters.area) params.set('area', filters.area);
  if (filters.industry) params.set('industry', filters.industry);
  if (filters.professional_role) params.set('professional_role', filters.professional_role);
  if (filters.salary) params.set('salary', String(filters.salary));
  if (filters.experience) params.set('experience', filters.experience);
  if (filters.schedule) params.set('schedule', filters.schedule);
  if (filters.employment) params.set('employment', filters.employment);
  if (filters.only_with_salary) params.set('only_with_salary', 'true');
  if (filters.currency) params.set('currency', filters.currency);
  if (filters.page && filters.page > 0) params.set('page', String(filters.page));
  if (filters.per_page && filters.per_page !== 20) params.set('per_page', String(filters.per_page));
  return params;
}

export default function Search() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  // Auth state - only logged-in users can save vacancies
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Derive filters from URL (single source of truth)
  const filters = useMemo(() => parseFiltersFromUrl(searchParams), [searchParams]);

  // Get search text from URL
  const searchText = searchParams.get('text') || '';
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Build search params for API call (only search if > 2 characters)
  const apiSearchParams = useMemo<HhSearchParams>(
    () => ({
      ...filters,
      text: searchText && searchText.length > 2 ? searchText : undefined,
    }),
    [filters, searchText]
  );

  // Only fetch if search text is empty or has more than 2 characters
  const shouldSearch = !searchText || searchText.length > 2;

  // Fetch vacancies from hh.ru API directly
  const { data, isLoading, isFetching, error } = useHhVacancySearch(apiSearchParams, shouldSearch);

  // Fetch saved vacancies (for authenticated users only)
  const { data: savedData } = useSavedVacancies(undefined, isAuthenticated);
  const addVacancyMutation = useAddVacancy();
  const removeVacancyMutation = useRemoveVacancy();

  // Set of saved vacancy hhIds for O(1) lookup
  const savedVacancyIds = useMemo(() => {
    if (!savedData?.items) return new Set<string>();
    return new Set(savedData.items.map((entry) => entry.vacancy?.hhId).filter(Boolean) as string[]);
  }, [savedData]);

  // Handlers
  const handleSearchChange = useCallback((text: string) => {
    // Update URL directly (SearchBar handles debouncing)
    const newFilters = { ...filters, page: 0 };
    setSearchParams(buildUrlParams(text, newFilters), { replace: true });
  }, [filters, setSearchParams]);

  const handleFilterChange = useCallback((newFilters: HhSearchParams) => {
    // Use functional update to avoid including filters in dependencies
    setSearchParams((prev) => {
      const currentFilters = parseFiltersFromUrl(prev);
      const merged = { ...currentFilters, ...newFilters, page: 0 };
      const currentText = prev.get('text') || '';
      return buildUrlParams(currentText, merged);
    }, { replace: true });
    if (isMobile) setIsFilterDrawerOpen(false);
  }, [setSearchParams, isMobile]);

  const handlePageChange = useCallback((page: number) => {
    // MUI Pagination is 1-indexed, hh.ru API is 0-indexed
    const newFilters = { ...filters, page: page - 1 };
    setSearchParams(buildUrlParams(searchText, newFilters), { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters, searchText, setSearchParams]);

  const handleVacancyClick = useCallback((vacancyId: string) => {
    navigate(`/vacancy/${vacancyId}`);
  }, [navigate]);

  const handleSaveToggle = useCallback((vacancyId: string) => {
    if (savedVacancyIds.has(vacancyId)) {
      removeVacancyMutation.mutate(vacancyId);
    } else {
      addVacancyMutation.mutate(vacancyId);
    }
  }, [savedVacancyIds, addVacancyMutation, removeVacancyMutation]);

  // Extract data from hh.ru response
  const vacancies = data?.items || [];
  const totalPages = data?.pages || 0;
  const currentPage = (data?.page || 0) + 1; // Convert to 1-indexed for UI
  const totalItems = data?.found || 0;
  const itemsPerPage = data?.per_page || 20;

  // Add isSaved flag to vacancies
  const vacanciesWithSaveState = useMemo(
    () => vacancies.map((vacancy) => ({
      ...vacancy,
      _id: vacancy.id, // Add _id for compatibility
      isSaved: savedVacancyIds.has(vacancy.id),
    })),
    [vacancies, savedVacancyIds]
  );

  return (
    <Box sx={{ py: 3, px: { xs: 2, sm: 3, md: 4 } }}>
      <title>Search Vacancies - JobFlow</title>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Search Vacancies
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find your next opportunity
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <SearchBar
          value={searchText}
          onChange={handleSearchChange}
          placeholder="Search for jobs, companies, or keywords..."
          disabled={isLoading}
        />
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Filter Panel - Desktop */}
        {!isMobile && (
          <Grid size={{ xs: 12, md: 3 }}>
            <Box sx={{ position: 'sticky', top: 16 }}>
              <FilterPanel
                onFilterChange={handleFilterChange}
                initialFilters={filters}
              />
            </Box>
          </Grid>
        )}

        {/* Vacancy List */}
        <Grid size={{ xs: 12, md: isMobile ? 12 : 9 }}>
          {/* Show refreshing indicator during background fetches */}
          {isFetching && !isLoading && (
            <Box sx={{ mb: 2 }}>
              <LoadingSpinner
                size={16}
                message="Updating results..."
                inline
              />
            </Box>
          )}

          <VacancyList
            vacancies={vacanciesWithSaveState}
            isLoading={isLoading}
            error={error}
            onVacancyClick={handleVacancyClick}
            onSave={handleSaveToggle}
            showSaveButton={isAuthenticated}
          />

          {/* Pagination */}
          {!isLoading && !error && vacancies.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.min(totalPages, 100)} // hh.ru limits to 100 pages
              onPageChange={handlePageChange}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              disabled={isLoading}
            />
          )}
        </Grid>
      </Grid>

      {/* Filter Drawer - Mobile */}
      {isMobile && (
        <>
          <Fab
            color="primary"
            aria-label="filters"
            onClick={() => setIsFilterDrawerOpen(true)}
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
          >
            <FilterListIcon />
          </Fab>

          <Drawer
            anchor="right"
            open={isFilterDrawerOpen}
            onClose={() => setIsFilterDrawerOpen(false)}
            sx={{ '& .MuiDrawer-paper': { width: '80%', maxWidth: 360 } }}
          >
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Filters</Typography>
                <IconButton onClick={() => setIsFilterDrawerOpen(false)} aria-label="close">
                  <CloseIcon />
                </IconButton>
              </Box>
              <FilterPanel
                onFilterChange={handleFilterChange}
                initialFilters={filters}
              />
            </Box>
          </Drawer>
        </>
      )}
    </Box>
  );
}
