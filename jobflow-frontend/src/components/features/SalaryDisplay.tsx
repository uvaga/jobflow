import { Typography, Tooltip } from '@mui/material';
import type { TypographyProps } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { formatSalary } from '@/utils/vacancyHelpers';
import { useCurrencyMap } from '@/hooks/useHhApi';

interface SalaryData {
  from?: number | null;
  to?: number | null;
  currency: string;
  gross?: boolean;
}

interface SalaryDisplayProps {
  salary?: SalaryData | null;
  variant?: TypographyProps['variant'];
}

export default function SalaryDisplay({ salary, variant = 'h6' }: SalaryDisplayProps) {
  const currencyMap = useCurrencyMap();

  return (
    <Typography variant={variant} color="primary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {formatSalary(salary, currencyMap)}
      {salary?.gross !== undefined && (
        <Tooltip title={salary.gross ? 'Before taxes (gross)' : 'After taxes (net)'}>
          {salary.gross
            ? <ReceiptLongIcon fontSize="small" color="action" />
            : <AccountBalanceWalletIcon fontSize="small" color="action" />}
        </Tooltip>
      )}
    </Typography>
  );
}
