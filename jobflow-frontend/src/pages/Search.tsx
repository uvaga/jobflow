import { Box, Container, Typography } from '@mui/material';

export default function Search() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Search Vacancies
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Search functionality will be implemented in Sprint 2
        </Typography>
      </Box>
    </Container>
  );
}
