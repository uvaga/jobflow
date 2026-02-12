import { useSnackbar } from 'notistack';

type VariantType = 'success' | 'error' | 'warning' | 'info' | 'default';

export function useToast() {
  const { enqueueSnackbar } = useSnackbar();

  const show = (message: string, variant: VariantType, duration?: number) => {
    enqueueSnackbar(message, {
      variant,
      autoHideDuration: duration,
    });
  };

  return {
    showSuccess: (message: string) => show(message, 'success', 3000),
    showError: (message: string) => show(message, 'error', 5000),
    showInfo: (message: string) => show(message, 'info', 3000),
    showWarning: (message: string) => show(message, 'warning', 4000),
  };
}
