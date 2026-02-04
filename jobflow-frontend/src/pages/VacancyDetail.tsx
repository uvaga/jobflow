import { Box, Container, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

export default function VacancyDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Vacancy Details
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Showing vacancy ID: {id}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          This page will be implemented in Sprint 3
        </Typography>
      </Box>
    </Container>
  );
}
