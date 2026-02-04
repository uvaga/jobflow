import { Box, Container, Typography, Paper } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export default function Register() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <PersonAddIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" component="h1">
              Create Account
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            Registration functionality will be implemented in Sprint 1
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
