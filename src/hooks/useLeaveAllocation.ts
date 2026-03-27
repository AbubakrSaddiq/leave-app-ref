// ============================================
// Leave Allocation Hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import {
  getAllStaffLeaveBalances,
  updateAllocatedDays,
  rerunAllocationForUser,
  rerunAllocationForAllUsers,
  type UpdateAllocatedDaysParams,
} from '@/api/leaveAllocation.api';

// ============================================
// QUERY HOOKS
// ============================================

export const useAllStaffLeaveBalances = (year: number) => {
  return useQuery({
    queryKey: ['admin-staff-leave-balances', year],
    queryFn: () => getAllStaffLeaveBalances(year),
    staleTime: 30_000,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

export const useUpdateAllocatedDays = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (params: UpdateAllocatedDaysParams) => updateAllocatedDays(params),
    onSuccess: (_, variables) => {
      // Invalidate admin table + individual user balances
      queryClient.invalidateQueries({ queryKey: ['admin-staff-leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['my-leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['user-leave-balances'] });

      toast({
        title: 'Allocation updated',
        description: 'Leave allocation has been saved.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });
};

export const useRerunAllocationForUser = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ userId, year }: { userId: string; year: number }) =>
      rerunAllocationForUser(userId, year),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff-leave-balances', variables.year] });
      queryClient.invalidateQueries({ queryKey: ['user-leave-balances', variables.userId] });

      toast({
        title: 'Allocation re-run',
        description: 'Leave balances have been recalculated for this staff member.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Re-run failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });
};

export const useRerunAllocationForAll = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (year: number) => rerunAllocationForAllUsers(year),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff-leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['my-leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['user-leave-balances'] });

      toast({
        title: 'Bulk allocation complete',
        description: `Leave balances recalculated for ${data.user_count} staff members (${data.year}).`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Bulk re-run failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });
};