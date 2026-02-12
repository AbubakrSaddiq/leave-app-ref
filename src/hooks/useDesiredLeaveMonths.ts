// ============================================
// Desired Leave Months Hooks - FIXED CACHING
// ============================================

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import {
  getMyDesiredMonths,
  hasSubmittedDesiredMonths,
  submitDesiredMonths,
  validateLeaveDatesInDesiredMonths,
  getAllDesiredMonths,
  getUsersWithoutDesiredMonths,
} from '@/api/desiredLeaveMonths.api';
import { supabase } from '@/lib/supabase';
import type { SubmitDesiredMonthsDto } from '@/types/desiredLeaveMonths';

// ============================================
// QUERY HOOKS - FIXED CACHING
// ============================================

/**
 * Get current user's desired months
 * FIXED: Include user in query key to prevent cache sharing between users
 */
export const useMyDesiredMonths = () => {
  const [userId, setUserId] = React.useState<string | null>(null);

  // Get current user ID
  React.useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  return useQuery({
    queryKey: ['my-desired-months', userId], // FIXED: Include userId in key
    queryFn: getMyDesiredMonths,
    staleTime: 300000, // 5 minutes - this rarely changes
    enabled: !!userId, // Only run when we have userId
  });
};

/**
 * Check if user has submitted desired months
 * FIXED: Include user in query key
 */
export const useHasSubmittedDesiredMonths = () => {
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  return useQuery({
    queryKey: ['has-submitted-desired-months', userId], // FIXED: Include userId
    queryFn: hasSubmittedDesiredMonths,
    staleTime: 300000,
    enabled: !!userId,
  });
};

/**
 * Get all desired months (Admin/HR)
 */
export const useAllDesiredMonths = () => {
  return useQuery({
    queryKey: ['all-desired-months'],
    queryFn: getAllDesiredMonths,
    staleTime: 60000,
  });
};

/**
 * Get users without desired months (Admin/HR)
 */
export const useUsersWithoutDesiredMonths = () => {
  return useQuery({
    queryKey: ['users-without-desired-months'],
    queryFn: getUsersWithoutDesiredMonths,
    staleTime: 60000,
  });
};

/**
 * Validate leave dates against desired months
 */
export const useValidateLeaveDates = (
  startDate: string,
  endDate: string,
  enabled: boolean = false
) => {
  return useQuery({
    queryKey: ['validate-leave-dates', startDate, endDate],
    queryFn: () => validateLeaveDatesInDesiredMonths(startDate, endDate),
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 0, // Always fresh
    retry: 1,
  });
};

// ============================================
// MUTATION HOOKS - FIXED CACHE INVALIDATION
// ============================================

/**
 * Submit desired months
 * FIXED: Better cache invalidation to prevent cross-user cache pollution
 */
export const useSubmitDesiredMonths = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: SubmitDesiredMonthsDto) => submitDesiredMonths(data),
    onSuccess: async () => {
      // Get current user to invalidate specific cache
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Invalidate specific user queries
        queryClient.invalidateQueries({ 
          queryKey: ['my-desired-months', user.id] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['has-submitted-desired-months', user.id] 
        });
        
        // Also remove any cached data for this user
        queryClient.removeQueries({ 
          queryKey: ['my-desired-months', user.id],
          exact: true 
        });
        queryClient.removeQueries({ 
          queryKey: ['has-submitted-desired-months', user.id],
          exact: true 
        });
      }
      
      // Invalidate all related queries (for safety and admin views)
      queryClient.invalidateQueries({ queryKey: ['my-desired-months'] });
      queryClient.invalidateQueries({ queryKey: ['has-submitted-desired-months'] });
      queryClient.invalidateQueries({ queryKey: ['current-profile'] });
      queryClient.invalidateQueries({ queryKey: ['all-desired-months'] });
      queryClient.invalidateQueries({ queryKey: ['users-without-desired-months'] });

      // Force refetch on next mount
      queryClient.resetQueries({ 
        queryKey: ['my-desired-months'],
        exact: false 
      });

      toast({
        title: 'Desired Months Submitted',
        description:
          'Your preferred leave months have been saved. You can now apply for annual leave.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Submission Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });
};