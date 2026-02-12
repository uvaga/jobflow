import { useMemo, useCallback } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useProfile, useUpdateProfile, useChangePassword } from '@/hooks/useUser';
import FormTextField from '@/components/common/FormTextField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import type { AxiosError } from 'axios';

const profileSchema = Yup.object({
  firstName: Yup.string().min(2, 'Must be at least 2 characters').required('First name is required'),
  lastName: Yup.string().min(2, 'Must be at least 2 characters').required('Last name is required'),
});

const passwordSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .min(8, 'Must be at least 8 characters')
    .matches(/[a-z]/, 'Must contain a lowercase letter')
    .matches(/[A-Z]/, 'Must contain an uppercase letter')
    .matches(/\d/, 'Must contain a number')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your new password'),
});

const passwordInitialValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Profile() {
  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  const profileInitialValues = useMemo(
    () => ({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
    }),
    [profile?.firstName, profile?.lastName],
  );

  const handleProfileSubmit = useCallback(
    async (values: { firstName: string; lastName: string }) => {
      await updateProfile.mutateAsync(values);
    },
    [updateProfile],
  );

  const handlePasswordSubmit = useCallback(
    async (values: PasswordFormValues, { resetForm, setFieldError }: { resetForm: () => void; setFieldError: (field: string, message: string) => void }) => {
      try {
        await changePasswordMutation.mutateAsync({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        resetForm();
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        if (axiosError.response?.status === 401) {
          setFieldError('currentPassword', 'Current password is incorrect');
        }
      }
    },
    [changePasswordMutation],
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <ErrorDisplay message="Failed to load profile" />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <title>My Profile - JobFlow</title>
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <AccountCircleIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h4" component="h1">
            My Profile
          </Typography>
        </Box>

        {/* Profile Information Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Profile Information
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Email
            </Typography>
            <Typography variant="body1">{profile?.email}</Typography>
          </Box>

          <Formik
            initialValues={profileInitialValues}
            validationSchema={profileSchema}
            onSubmit={handleProfileSubmit}
            enableReinitialize
          >
            {({ isSubmitting, dirty }) => (
              <Form>
                <FormTextField name="firstName" label="First Name" disabled={isSubmitting} />
                <FormTextField name="lastName" label="Last Name" disabled={isSubmitting} />

                <Button
                  type="submit"
                  variant="contained"
                  sx={{ mt: 2 }}
                  disabled={isSubmitting || !dirty}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </Form>
            )}
          </Formik>
        </Paper>

        {/* Change Password Section */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LockOutlinedIcon color="action" />
            <Typography variant="h6">Change Password</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <Formik
            initialValues={passwordInitialValues}
            validationSchema={passwordSchema}
            onSubmit={handlePasswordSubmit}
          >
            {({ isSubmitting }) => (
              <Form>
                <FormTextField
                  name="currentPassword"
                  label="Current Password"
                  type="password"
                  disabled={isSubmitting}
                />
                <FormTextField
                  name="newPassword"
                  label="New Password"
                  type="password"
                  disabled={isSubmitting}
                />

                <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
                  Password must be at least 8 characters with uppercase, lowercase, and a number.
                </Alert>

                <FormTextField
                  name="confirmPassword"
                  label="Confirm New Password"
                  type="password"
                  disabled={isSubmitting}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Change Password'}
                </Button>
              </Form>
            )}
          </Formik>
        </Paper>
      </Box>
    </Container>
  );
}
