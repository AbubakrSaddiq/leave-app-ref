// ============================================
// Profile Management Hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import {
  getCurrentUserProfile,
  updateUserProfile,
  changePassword,
  uploadAvatar,
  deleteAvatar,
  type UpdateProfileParams,
  type ChangePasswordParams,
} from '@/api/profile.api';

// ============================================
// QUERY HOOKS
// ============================================

export const useCurrentProfile = () => {
  return useQuery({
    queryKey: ['current-profile'],
    queryFn: getCurrentUserProfile,
    staleTime: 60000,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (params: UpdateProfileParams) => updateUserProfile(params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['current-profile'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });
};

export const useChangePassword = () => {
  const toast = useToast();

  return useMutation({
    mutationFn: (params: ChangePasswordParams) => changePassword(params),
    onSuccess: () => {
      toast({
        title: 'Password Changed',
        description: 'Your password has been changed successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Password Change Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (avatarUrl) => {
      queryClient.invalidateQueries({ queryKey: ['current-profile'] });

      toast({
        title: 'Avatar Uploaded',
        description: 'Your profile picture has been updated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });
};

export const useDeleteAvatar = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (avatarUrl: string) => deleteAvatar(avatarUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-profile'] });

      toast({
        title: 'Avatar Removed',
        description: 'Your profile picture has been removed.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });
};