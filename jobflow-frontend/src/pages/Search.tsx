import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
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

// Components (bundle-barrel-imports: direct imports, not barrel files)
import SearchBar from '@/components/common/SearchBar';
import FilterPanel from '@/components/features/FilterPanel';
import VacancyList from '@/components/features/VacancyList';
import Pagination from '@/components/common/Pagination';

// Hooks and services
import { useDebounce } from '@/hooks/useDebounce';
import { useVacancySearch, useSavedVacancies, useAddVacancy, useRemoveVacancy } from '@/hooks/useVacancies';
import type { VacancySearchParams } from '@/services/vacancyService';
import type { Vacancy } from '@/types';

export default function Search() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Local state
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<VacancySearchParams>({ page: 1, limit: 20 });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Debounce search text to reduce API calls while typing (useDebounce pattern)
  const debouncedSearchText = useDebounce(searchText, 500);

  // Memoize search params to prevent unnecessary re-renders (rerender-dependencies: primitive deps)
  const searchParams = useMemo<VacancySearchParams>(
    () => ({
      ...filters,
      query: debouncedSearchText || undefined,
    }),
    [filters, debouncedSearchText]
  );

  // Fetch vacancies with React Query (client-swr-dedup: automatic deduplication)
  const { data, isLoading, error } = useVacancySearch(searchParams);

  // Fetch saved vacancies to determine save state
  const { data: savedVacancies } = useSavedVacancies();

  // Mutations for save/unsave
  const addVacancyMutation = useAddVacancy();
  const removeVacancyMutation = useRemoveVacancy();

  // Create a Set for O(1) lookup of saved vacancy IDs (js-set-map-lookups)
  const savedVacancyIds = useMemo(() => {
    if (!savedVacancies) return new Set<string>();
    return new Set(savedVacancies.map((v) => v._id));
  }, [savedVacancies]);

  // Handler for search input change
  // rerender-functional-setstate: stable callback with functional update
  const handleSearchChange = useCallback((query: string) => {
    setSearchText(query);
    // Reset to page 1 when search text changes
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Handler for filter changes
  const handleFilterChange = useCallback((newFilters: VacancySearchParams) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to page 1 when filters change
    }));
    // Close drawer on mobile after applying filters
    if (isMobile) {
      setIsFilterDrawerOpen(false);
    }
  }, [isMobile]);

  // Handler for pagination
  const handlePageChange = useCallback((page: number) => {
    // rerender-functional-setstate: use functional update
    setFilters((prev) => ({ ...prev, page }));

    // Scroll to top when page changes for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handler for vacancy card click - navigate to details
  const handleVacancyClick = useCallback(
    (vacancyId: string) => {
      navigate(`/vacancy/${vacancyId}`);
    },
    [navigate]
  );

  // Handler for save/unsave vacancy with optimistic updates
  const handleSaveToggle = useCallback(
    (vacancyId: string) => {
      const isSaved = savedVacancyIds.has(vacancyId);

      if (isSaved) {
        removeVacancyMutation.mutate(vacancyId);
      } else {
        addVacancyMutation.mutate(vacancyId);
      }
    },
    [savedVacancyIds, addVacancyMutation, removeVacancyMutation]
  );

  // Drawer toggle handlers
  const openFilterDrawer = useCallback(() => setIsFilterDrawerOpen(true), []);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);

  // Extract vacancies array from paginated response
  const vacancies = data?.data || [];
  const totalPages = data?.totalPages || 0;
  const currentPage = data?.page || 1;
  const totalItems = data?.total || 0;
  const itemsPerPage = data?.limit || 20;

  // Enhance vacancies with isSaved flag
  // js-cache-property-access: cache savedVacancyIds lookup
  const vacanciesWithSaveState = useMemo(
    () =>
      vacancies.map((vacancy) => ({
        ...vacancy,
        isSaved: savedVacancyIds.has(vacancy._id),
      })),
    [vacancies, savedVacancyIds]
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
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
          <Grid item xs={12} md={3}>
            <Box sx={{ position: 'sticky', top: 16 }}>
              <FilterPanel
                onFilterChange={handleFilterChange}
                initialFilters={filters}
              />
            </Box>
          </Grid>
        )}

        {/* Vacancy List */}
        <Grid item xs={12} md={isMobile ? 12 : 9}>
          <VacancyList
            vacancies={vacanciesWithSaveState as Vacancy[]}
            isLoading={isLoading}
            error={error}
            onVacancyClick={handleVacancyClick}
            onSave={handleSaveToggle}
            showSaveButton={true}
          />

          {/* Pagination */}
          {!isLoading && !error && vacancies.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
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
          {/* Floating Action Button to open filters */}
          <Fab
            color="primary"
            aria-label="filters"
            onClick={openFilterDrawer}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
            }}
          >
            <FilterListIcon />
          </Fab>

          {/* Drawer for filters */}
          <Drawer
            anchor="right"
            open={isFilterDrawerOpen}
            onClose={closeFilterDrawer}
            sx={{
              '& .MuiDrawer-paper': {
                width: '80%',
                maxWidth: 360,
              },
            }}
          >
            <Box sx={{ p: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Filters</Typography>
                <IconButton onClick={closeFilterDrawer} aria-label="close">
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
    </Container>
  );
}
