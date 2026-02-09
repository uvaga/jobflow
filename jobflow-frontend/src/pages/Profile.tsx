import { Box, Container, Typography } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function Profile() {
  return (
    <Container maxWidth="md">
      <title>My Profile - JobFlow</title>
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <AccountCircleIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h4" component="h1">
            My Profile
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          User profile management will be implemented in Sprint 5
        </Typography>
      </Box>
    </Container>
  );
}
