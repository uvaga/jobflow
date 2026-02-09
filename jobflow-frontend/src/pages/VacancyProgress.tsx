import { Box, Container, Typography } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';

export default function VacancyProgress() {
  return (
    <Container maxWidth="lg">
      <title>My Applications - JobFlow</title>
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <AssignmentIcon color="primary" />
          <Typography variant="h4" component="h1">
            My Applications
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Track your job application progress here (Sprint 4)
        </Typography>
      </Box>
    </Container>
  );
}
