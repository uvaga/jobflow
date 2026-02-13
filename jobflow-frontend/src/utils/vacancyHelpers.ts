/**
 * Shared vacancy formatting utilities used across detail pages and components.
 */

interface SalaryLike {
  from?: number | null;
  to?: number | null;
  currency: string;
  gross?: boolean;
}

export function formatSalary(salary?: SalaryLike | null, currencyMap?: Record<string, string>): string {
  if (!salary) return 'Salary not specified';

  const { from, to, currency } = salary;
  const currencyLabel = currencyMap?.[currency] ?? currency;

  if (from && to) {
    return `${from.toLocaleString()} - ${to.toLocaleString()} ${currencyLabel}`;
  }
  if (from) {
    return `From ${from.toLocaleString()} ${currencyLabel}`;
  }
  if (to) {
    return `Up to ${to.toLocaleString()} ${currencyLabel}`;
  }
  return 'Salary not specified';
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
