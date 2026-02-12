import { Box, Container, Paper, Skeleton } from '@mui/material';

export default function VacancyDetailSkeleton() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Skeleton variant="text" width={100} height={40} sx={{ mb: 2 }} />
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Skeleton variant="text" width="60%" height={48} />
          <Skeleton variant="text" width="40%" height={32} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="30%" height={24} sx={{ mt: 2 }} />
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Skeleton variant="rounded" width={80} height={32} />
            <Skeleton variant="rounded" width={100} height={32} />
            <Skeleton variant="rounded" width={90} height={32} />
          </Box>
        </Paper>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Skeleton variant="text" width="20%" height={32} />
          <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
        </Paper>
      </Box>
    </Container>
  );
}
