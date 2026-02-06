import { useState, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuthStore } from '@/store/authStore';
import { register } from '@/services/authService';
import FormTextField from '@/components/common/FormTextField';

const registerSchema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  firstName: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .required('First name is required'),
  lastName: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .required('Last name is required'),
});

const initialValues = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
};

interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export default function Register() {
  const navigate = useNavigate();
  const loginUser = useAuthStore((state) => state.login);
  const [error, setError] = useState<string>('');

  const handleSubmit = useCallback(async (values: RegisterFormValues) => {
    try {
      setError('');
      const { confirmPassword, ...registerData } = values;
      const response = await register(registerData);
      loginUser(response.accessToken, response.refreshToken, {
        _id: response.user._id,
        email: response.user.email,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        savedVacancies: [],
      });
      navigate('/', { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(errorMessage);
    }
  }, [loginUser, navigate]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <PersonAddIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" component="h1">
              Create Account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Formik
            initialValues={initialValues}
            validationSchema={registerSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormTextField name="firstName" label="First Name" disabled={isSubmitting} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormTextField name="lastName" label="Last Name" disabled={isSubmitting} />
                  </Grid>
                </Grid>

                <FormTextField name="email" label="Email Address" type="email" disabled={isSubmitting} />
                <FormTextField name="password" label="Password" type="password" disabled={isSubmitting} />
                <FormTextField name="confirmPassword" label="Confirm Password" type="password" disabled={isSubmitting} />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Sign Up'}
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2">
                    Already have an account?{' '}
                    <Link component={RouterLink} to="/login" underline="hover">
                      Sign In
                    </Link>
                  </Typography>
                </Box>
              </Form>
            )}
          </Formik>
        </Paper>
      </Box>
    </Container>
  );
}
