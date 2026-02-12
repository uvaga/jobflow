import { Paper, Typography, Divider, Box, Link } from '@mui/material';

import type { NormalizedVacancy } from '@/utils/vacancyNormalizer';

interface ContactsSectionProps {
  contacts: NormalizedVacancy['contacts'];
}

export default function ContactsSection({ contacts }: ContactsSectionProps) {
  if (!contacts) return null;

  return (
    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: 3 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Contacts
      </Typography>
      <Divider sx={{ mb: 3 }} />
      {contacts.name && (
        <Typography variant="body1">
          <strong>Contact person:</strong> {contacts.name}
        </Typography>
      )}
      {contacts.email && (
        <Typography variant="body1">
          <strong>Email:</strong>{' '}
          <Link href={`mailto:${contacts.email}`}>
            {contacts.email}
          </Link>
        </Typography>
      )}
      {contacts.phones && contacts.phones.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body1">
            <strong>Phone:</strong>
          </Typography>
          {contacts.phones.map((phone, index) => (
            <Typography key={index} variant="body1" sx={{ ml: 2 }}>
              {phone.city && `+${phone.city} `}{phone.number}
              {phone.comment && ` (${phone.comment})`}
            </Typography>
          ))}
        </Box>
      )}
    </Paper>
  );
}
