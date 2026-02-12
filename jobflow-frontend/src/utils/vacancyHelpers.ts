/**
 * Shared vacancy formatting utilities used across detail pages and components.
 */

interface SalaryLike {
  from?: number | null;
  to?: number | null;
  currency: string;
  gross?: boolean;
}

export function formatSalary(salary?: SalaryLike | null): string {
  if (!salary) return 'Salary not specified';

  const { from, to, currency, gross } = salary;
  const grossLabel = gross ? ' (gross)' : ' (net)';

  if (from && to) {
    return `${from.toLocaleString()} - ${to.toLocaleString()} ${currency}${grossLabel}`;
  }
  if (from) {
    return `From ${from.toLocaleString()} ${currency}${grossLabel}`;
  }
  if (to) {
    return `Up to ${to.toLocaleString()} ${currency}${grossLabel}`;
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
