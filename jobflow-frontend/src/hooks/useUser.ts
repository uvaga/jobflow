import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  getProfile,
  updateProfile,
  changePassword,
  type UpdateUserDto,
  type ChangePasswordDto,
} from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

// Query keys for user-related queries
export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
};

/**
 * Hook to fetch current user profile
 * @param enabled - Whether the query should run (default: only when authenticated)
 */
export function useProfile(enabled?: boolean) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<User, Error>({
    queryKey: userKeys.profile(),
    queryFn: getProfile,
    enabled: enabled !== undefined ? enabled : isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update user profile
 * Automatically updates auth store and invalidates profile cache
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);
  const { enqueueSnackbar } = useSnackbar();

  return useMutation<User, Error, UpdateUserDto>({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      // Update auth store with new user data
      updateUser({
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
      });
      // Invalidate and refetch profile
      void queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
    },
    onError: () => {
      enqueueSnackbar('Failed to update profile', { variant: 'error' });
    },
  });
}

/**
 * Hook to change user password
 * Requires current password for verification
 */
export function useChangePassword() {
  const { enqueueSnackbar } = useSnackbar();

  return useMutation<{ message: string }, Error, ChangePasswordDto>({
    mutationFn: changePassword,
    onSuccess: () => {
      enqueueSnackbar('Password changed successfully', { variant: 'success' });
    },
  });
}
