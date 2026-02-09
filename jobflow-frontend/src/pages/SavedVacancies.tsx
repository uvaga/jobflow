import { Box, Container, Typography } from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';

export default function SavedVacancies() {
  return (
    <Container maxWidth="lg">
      <title>Saved Vacancies - JobFlow</title>
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <BookmarkIcon color="primary" />
          <Typography variant="h4" component="h1">
            Saved Vacancies
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Your saved job vacancies will appear here (Sprint 3)
        </Typography>
      </Box>
    </Container>
  );
}
