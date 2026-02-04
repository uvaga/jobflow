import { Box, Container, Typography, Link } from '@mui/material';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="xl">
        <Typography variant="body2" color="text.secondary" align="center">
          {'© '}
          {new Date().getFullYear()}
          {' JobFlow - Job Search Application. Powered by '}
          <Link color="inherit" href="https://hh.ru" target="_blank" rel="noopener">
            hh.ru API
          </Link>
        </Typography>
      </Container>
    </Box>
  );
}
