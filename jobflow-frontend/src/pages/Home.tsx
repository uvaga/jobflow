import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';

export default function Home() {
  return (
    <Container maxWidth="lg">
      <title>JobFlow - Find Your Dream Job</title>
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          py: 8,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
          Find Your Dream Job
        </Typography>
        <Typography
          variant="h5"
          color="text.secondary"
          paragraph
          sx={{ mb: 4, maxWidth: 600 }}
        >
          Search thousands of job vacancies from hh.ru and track your
          applications all in one place
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            component={RouterLink}
            to="/search"
            variant="contained"
            size="large"
            startIcon={<SearchIcon />}
          >
            Start Searching
          </Button>
          <Button
            component={RouterLink}
            to="/register"
            variant="outlined"
            size="large"
          >
            Sign Up Free
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
