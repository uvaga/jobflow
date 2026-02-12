import { Paper, Typography, Divider, Box } from '@mui/material';

interface DescriptionSectionProps {
  description: string;
}

export default function DescriptionSection({ description }: DescriptionSectionProps) {
  return (
    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: 3 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Job Description
      </Typography>
      <Divider sx={{ mb: 3 }} />
      <Box
        sx={{
          fontSize: '0.975rem',
          lineHeight: 1.8,
          color: 'text.primary',
          '& p': {
            mb: 1.5,
            lineHeight: 1.8,
          },
          '& p:empty': {
            display: 'none',
          },
          '& strong, & b': {
            fontWeight: 600,
          },
          '& p > strong:only-child, & p > b:only-child': {
            display: 'block',
            fontSize: '1.125rem',
            fontWeight: 700,
            mt: 3,
            mb: 0.5,
            letterSpacing: '-0.01em',
          },
          '& ul, & ol': {
            pl: 4,
            mb: 2.5,
            mt: 1,
          },
          '& ol': {
            listStyleType: 'decimal',
          },
          '& li': {
            mb: 1,
            lineHeight: 1.75,
            pl: 0.5,
            '&::marker': {
              color: 'primary.main',
              fontWeight: 600,
            },
          },
          '& a': {
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
        }}
        dangerouslySetInnerHTML={{ __html: description }}
      />
    </Paper>
  );
}
