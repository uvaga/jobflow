import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

import { useDebounce } from '@/hooks/useDebounce';
import { useHhVacancySearch } from '@/hooks/useHhApi';
import { useSavedVacancies, useAddVacancy, useRemoveVacancy } from '@/hooks/useVacancies';
import { useAuthStore } from '@/store/authStore';
import type { HhSearchParams } from '@/services/hhApiService';

export default function Search() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Auth state - only logged-in users can save vacancies
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Local state
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<HhSearchParams>({ page: 0, per_page: 20 });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Debounce search text
  const debouncedSearchText = useDebounce(searchText, 500);

  // Build search params
  const searchParams = useMemo<HhSearchParams>(
    () => ({
      ...filters,
      text: debouncedSearchText || undefined,
    }),
    [filters, debouncedSearchText]
  );

  // Fetch vacancies from hh.ru API directly
  const { data, isLoading, error } = useHhVacancySearch(searchParams);

  // Fetch saved vacancies (for authenticated users only)
  const { data: savedVacancies } = useSavedVacancies(isAuthenticated);
  const addVacancyMutation = useAddVacancy();
  const removeVacancyMutation = useRemoveVacancy();

  // Set of saved vacancy IDs for O(1) lookup
  const savedVacancyIds = useMemo(() => {
    if (!savedVacancies) return new Set<string>();
    return new Set(savedVacancies.map((v) => v.hhId || v._id));
  }, [savedVacancies]);

  // Handlers
  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    setFilters((prev) => ({ ...prev, page: 0 }));
  }, []);

  const handleFilterChange = useCallback((newFilters: HhSearchParams) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 0 }));
    if (isMobile) setIsFilterDrawerOpen(false);
  }, [isMobile]);

  const handlePageChange = useCallback((page: number) => {
    // MUI Pagination is 1-indexed, hh.ru API is 0-indexed
    setFilters((prev) => ({ ...prev, page: page - 1 }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
          onSearch={handleSearchChange}
          placeholder="Search for jobs, companies, or keywords..."
          defaultValue={searchText}
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
