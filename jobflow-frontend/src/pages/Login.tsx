import { useState, useCallback } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
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
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuthStore } from '@/store/authStore';
import { login } from '@/services/authService';
import FormTextField from '@/components/common/FormTextField';

const loginSchema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

const initialValues = { email: '', password: '' };

interface LoginFormValues {
  email: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginUser = useAuthStore((state) => state.login);
  const [error, setError] = useState<string>('');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = useCallback(async (values: LoginFormValues) => {
    try {
      setError('');
      const response = await login(values);
      loginUser(response.accessToken, response.refreshToken, {
        _id: response.user._id,
        email: response.user.email,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        savedVacancies: [],
      });
      navigate(from, { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
    }
  }, [loginUser, navigate, from]);

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
            <LockOutlinedIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" component="h1">
              Sign In
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Formik
            initialValues={initialValues}
            validationSchema={loginSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form>
                <FormTextField name="email" label="Email Address" type="email" disabled={isSubmitting} />
                <FormTextField name="password" label="Password" type="password" disabled={isSubmitting} />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Sign In'}
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2">
                    Don't have an account?{' '}
                    <Link component={RouterLink} to="/register" underline="hover">
                      Sign Up
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
