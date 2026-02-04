import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  login,
  register,
  logout,
  type LoginDto,
  type RegisterDto,
} from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

/**
 * Hook for user login
 * Automatically updates auth store and redirects on success
 */
export function useLogin() {
  const navigate = useNavigate();
  const authLogin = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: (data: LoginDto) => login(data),
    onSuccess: (response) => {
      authLogin(response.accessToken, {
        _id: response.user._id,
        email: response.user.email,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        savedVacancies: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      void navigate('/search');
    },
    onError: (error: Error) => {
      console.error('Login failed:', error.message);
    },
  });
}

/**
 * Hook for user registration
 * Automatically updates auth store and redirects on success
 */
export function useRegister() {
  const navigate = useNavigate();
  const authLogin = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: (data: RegisterDto) => register(data),
    onSuccess: (response) => {
      authLogin(response.accessToken, {
        _id: response.user._id,
        email: response.user.email,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        savedVacancies: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      void navigate('/search');
    },
    onError: (error: Error) => {
      console.error('Registration failed:', error.message);
    },
  });
}

/**
 * Hook for user logout
 * Clears auth store and redirects to login
 */
export function useLogout() {
  const navigate = useNavigate();
  const authLogout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      authLogout();
      void queryClient.clear(); // Clear all cached data
      void navigate('/login');
    },
    onError: () => {
      // Even if API call fails, logout locally
      authLogout();
      void queryClient.clear();
      void navigate('/login');
    },
  });
}
