import { Alert, AlertTitle, Box, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface ErrorDisplayProps {
  message?: string;
  title?: string;
  onRetry?: () => void;
  variant?: 'error' | 'warning' | 'info';
}

export default function ErrorDisplay({
  message = 'An error occurred',
  title = 'Error',
  onRetry,
  variant = 'error',
}: ErrorDisplayProps) {
  return (
    <Box sx={{ py: 4 }}>
      <Alert
        severity={variant}
        icon={<ErrorOutlineIcon />}
        sx={{ alignItems: 'center' }}
      >
        <AlertTitle>{title}</AlertTitle>
        {message}
        {onRetry && (
          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" size="small" onClick={onRetry}>
              Try Again
            </Button>
          </Box>
        )}
      </Alert>
    </Box>
  );
}
