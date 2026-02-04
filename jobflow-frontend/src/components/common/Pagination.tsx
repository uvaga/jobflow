import { memo } from 'react';
import { Box, Pagination as MuiPagination, Typography } from '@mui/material';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  disabled?: boolean;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  disabled = false,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  // Calculate range of items being displayed
  const startItem =
    totalItems && itemsPerPage
      ? (currentPage - 1) * itemsPerPage + 1
      : undefined;
  const endItem =
    totalItems && itemsPerPage
      ? Math.min(currentPage * itemsPerPage, totalItems)
      : undefined;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
        py: 3,
      }}
    >
      {totalItems !== undefined &&
        startItem !== undefined &&
        endItem !== undefined && (
          <Typography variant="body2" color="text.secondary">
            Showing {startItem}-{endItem} of {totalItems} results
          </Typography>
        )}
      <MuiPagination
        count={totalPages}
        page={currentPage}
        onChange={(_, page) => onPageChange(page)}
        color="primary"
        disabled={disabled}
        showFirstButton
        showLastButton
      />
    </Box>
  );
}

// Memoize to prevent re-renders when parent updates
export default memo(Pagination);
