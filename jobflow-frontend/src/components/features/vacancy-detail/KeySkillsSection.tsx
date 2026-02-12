import { Paper, Typography, Stack, Chip } from '@mui/material';

interface KeySkillsSectionProps {
  skills: { name: string }[];
}

export default function KeySkillsSection({ skills }: KeySkillsSectionProps) {
  if (skills.length === 0) return null;

  return (
    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: 3 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Key Skills
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {skills.map((skill) => (
          <Chip
            key={skill.name}
            label={skill.name}
            color="primary"
            variant="outlined"
          />
        ))}
      </Stack>
    </Paper>
  );
}
