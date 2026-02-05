import { useState } from 'react';
import { Container, Typography, Box, Divider } from '@mui/material';
import {
  LoadingSpinner,
  ErrorDisplay,
  SearchBar,
  Pagination,
  EmptyState,
} from '@/components/common';
import { VacancyCard, FilterPanel } from '@/components/features';
import WorkOffIcon from '@mui/icons-material/WorkOff';
import type { Vacancy } from '@/types';

// Mock data outside component to avoid re-creating on each render
const mockVacancy: Vacancy = {
  _id: '1',
  hhId: '12345',
  name: 'Senior React Developer',
  employer: {
    id: 'emp1',
    name: 'Tech Corporation',
    url: 'https://techcorp.example.com',
    logoUrls: {
      '90': 'https://placehold.co/90x90/1976d2/white?text=TC',
    },
    trusted: true,
  },
  salary: {
    from: 150000,
    to: 200000,
    currency: 'RUB',
    gross: false,
  },
  area: {
    id: '1',
    name: 'Moscow',
    url: 'https://hh.ru',
  },
  url: 'https://hh.ru/vacancy/12345',
  description: 'Great opportunity for experienced React developer',
  schedule: { id: 'remote', name: 'Remote' },
  experience: { id: 'between3And6', name: '3-6 years' },
  employment: { id: 'full', name: 'Full-time' },
  publishedAt: '2026-02-04T12:00:00.000Z',
  cacheExpiresAt: '2026-02-11T12:00:00.000Z',
  createdAt: '2026-02-04T12:00:00.000Z',
  updatedAt: '2026-02-04T12:00:00.000Z',
};

export default function ComponentTest() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Component Test Page
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        This page demonstrates all implemented components
      </Typography>

      <Box sx={{ my: 4 }}>
        <Typography variant="h5" gutterBottom>
          1. LoadingSpinner
        </Typography>
        <LoadingSpinner message="Loading vacancies..." />
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ my: 4 }}>
        <Typography variant="h5" gutterBottom>
          2. ErrorDisplay
        </Typography>
        <ErrorDisplay
          title="Failed to load data"
          message="Connection error occurred. Please try again."
          onRetry={() => alert('Retry clicked!')}
        />
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ my: 4 }}>
        <Typography variant="h5" gutterBottom>
          3. SearchBar
        </Typography>
        <SearchBar
          onSearch={(query) => {
            setSearchQuery(query);
            alert(`Search submitted: "${query}"`);
          }}
          placeholder="Search vacancies..."
        />
        {searchQuery && (
          <Typography sx={{ mt: 1 }} color="primary">
            Current search: <strong>{searchQuery}</strong>
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ my: 4 }}>
        <Typography variant="h5" gutterBottom>
          4. Pagination
        </Typography>
        <Pagination
          currentPage={currentPage}
          totalPages={10}
          onPageChange={(page) => {
            setCurrentPage(page);
            alert(`Navigated to page ${page}`);
          }}
          totalItems={100}
          itemsPerPage={10}
        />
        <Typography sx={{ mt: 1 }}>Current page: {currentPage}</Typography>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ my: 4 }}>
        <Typography variant="h5" gutterBottom>
          5. EmptyState
        </Typography>
        <EmptyState
          icon={<WorkOffIcon sx={{ fontSize: 64 }} />}
          title="No vacancies found"
          description="Try adjusting your search filters to find more results"
          action={{
            label: 'Clear Filters',
            onClick: () => alert('Clear filters clicked!'),
          }}
        />
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ my: 4 }}>
        <Typography variant="h5" gutterBottom>
          6. VacancyCard
        </Typography>
        <Box sx={{ maxWidth: 400 }}>
          <VacancyCard
            vacancy={mockVacancy}
            onClick={(id) => alert(`Clicked vacancy: ${id}`)}
            onSave={(id) => alert(`Save vacancy: ${id}`)}
            showSaveButton={true}
            isSaved={false}
          />
        </Box>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ my: 4 }}>
        <Typography variant="h5" gutterBottom>
          7. FilterPanel
        </Typography>
        <Box sx={{ maxWidth: 400 }}>
          <FilterPanel
            onFilterChange={(filters) => {
              console.log('Filters changed:', filters);
              alert(`Filters applied: ${JSON.stringify(filters, null, 2)}`);
            }}
            initialFilters={{}}
          />
        </Box>
      </Box>
    </Container>
  );
}
