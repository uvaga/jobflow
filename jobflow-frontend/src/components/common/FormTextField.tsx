import { memo } from 'react';
import { useField } from 'formik';
import TextField from '@mui/material/TextField';
import type { TextFieldProps } from '@mui/material/TextField';

type FormTextFieldProps = {
  name: string;
  label: string;
  disabled?: boolean;
} & Omit<TextFieldProps, 'name' | 'value' | 'onChange' | 'onBlur' | 'error' | 'helperText'>;

function FormTextField({ name, label, disabled, ...rest }: FormTextFieldProps) {
  const [field, meta] = useField(name);
  const showError = meta.touched && Boolean(meta.error);

  return (
    <TextField
      {...field}
      {...rest}
      fullWidth
      label={label}
      margin="normal"
      error={showError}
      helperText={showError ? meta.error : undefined}
      disabled={disabled}
    />
  );
}

export default memo(FormTextField);
