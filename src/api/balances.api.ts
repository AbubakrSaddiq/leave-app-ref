// ============================================
// Leave Balances API
// ============================================

import { supabase } from '@/lib/supabase';
import type { LeaveBalance, LeaveType } from '@/types/models';

// ============================================
// GET BALANCES
// ============================================

export const getMyLeaveBalances = async (year?: number) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const targetYear = year || new Date().getFullYear();

  const { data, error } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('user_id', user.id)
    .eq('year', targetYear)
    .order('leave_type');

  if (error) throw error;

  const summary = {
    total_allocated: data.reduce((sum, b) => sum + Number(b.allocated_days), 0),
    total_used: data.reduce((sum, b) => sum + Number(b.used_days), 0),
    total_available: data.reduce((sum, b) => sum + Number(b.available_days), 0),
  };

  return { year: targetYear, balances: data, summary };
};

export const getUserLeaveBalances = async (userId: string, year?: number) => {
  const targetYear = year || new Date().getFullYear();

  const { data, error } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('user_id', userId)
    .eq('year', targetYear)
    .order('leave_type');

  if (error) throw error;

  const summary = {
    total_allocated: data.reduce((sum, b) => sum + Number(b.allocated_days), 0),
    total_used: data.reduce((sum, b) => sum + Number(b.used_days), 0),
    total_available: data.reduce((sum, b) => sum + Number(b.available_days), 0),
  };

  return { year: targetYear, balances: data, summary };
};

export const getLeaveBalanceByType = async (
  userId: string,
  leaveType: LeaveType,
  year?: number
): Promise<LeaveBalance | null> => {
  const targetYear = year || new Date().getFullYear();

  const { data, error } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('user_id', userId)
    .eq('leave_type', leaveType)
    .eq('year', targetYear)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
};

// ============================================
// ALLOCATE LEAVE (Admin Functions)
// ============================================

// FIX: removed p_hire_date — column does not exist in this schema
export const allocateLeaveForUser = async (userId: string, year: number): Promise<void> => {
  const { error } = await supabase.rpc('allocate_leave_for_user', {
    p_user_id: userId,
    p_year: year,
  });

  if (error) throw error;
};

export const allocateLeaveForAllUsers = async (year?: number) => {
  const targetYear = year || new Date().getFullYear();

  const { data, error } = await supabase.rpc('allocate_leave_for_all_users', {
    p_year: targetYear,
  });

  if (error) throw error;
  return data[0];
};

// ============================================
// ADJUST BALANCE (Admin)
// ============================================

export const adjustLeaveBalance = async (
  userId: string,
  leaveType: LeaveType,
  year: number,
  allocatedDays: number,
  reason: string
): Promise<LeaveBalance> => {
  const { data, error } = await supabase
    .from('leave_balances')
    .update({
      allocated_days: allocatedDays,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('leave_type', leaveType)
    .eq('year', year)
    .select()
    .single();

  if (error) throw error;
  return data;
};
// // ============================================

// // Leave Balances API
// // ============================================

// import { supabase } from '@/lib/supabase';
// import type { LeaveBalance, LeaveType } from '@/types/models';

// // ============================================
// // GET BALANCES
// // ============================================

// export const getMyLeaveBalances = async (year?: number) => {
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();
//   if (!user) throw new Error('Not authenticated');

//   const targetYear = year || new Date().getFullYear();

//   const { data, error } = await supabase
//     .from('leave_balances')
//     .select('*')
//     .eq('user_id', user.id)
//     .eq('year', targetYear)
//     .order('leave_type');

//   if (error) throw error;

//   const summary = {
//     total_allocated: data.reduce((sum, b) => sum + Number(b.allocated_days), 0),
//     total_used: data.reduce((sum, b) => sum + Number(b.used_days), 0),
//     total_available: data.reduce((sum, b) => sum + Number(b.available_days), 0),
//   };

//   return { year: targetYear, balances: data, summary };
// };

// export const getUserLeaveBalances = async (userId: string, year?: number) => {
//   const targetYear = year || new Date().getFullYear();

//   const { data, error } = await supabase
//     .from('leave_balances')
//     .select('*')
//     .eq('user_id', userId)
//     .eq('year', targetYear)
//     .order('leave_type');

//   if (error) throw error;

//   const summary = {
//     total_allocated: data.reduce((sum, b) => sum + Number(b.allocated_days), 0),
//     total_used: data.reduce((sum, b) => sum + Number(b.used_days), 0),
//     total_available: data.reduce((sum, b) => sum + Number(b.available_days), 0),
//   };

//   return { year: targetYear, balances: data, summary };
// };

// export const getLeaveBalanceByType = async (
//   userId: string,
//   leaveType: LeaveType,
//   year?: number
// ): Promise<LeaveBalance | null> => {
//   const targetYear = year || new Date().getFullYear();

//   const { data, error } = await supabase
//     .from('leave_balances')
//     .select('*')
//     .eq('user_id', userId)
//     .eq('leave_type', leaveType)
//     .eq('year', targetYear)
//     .single();

//   if (error) {
//     if (error.code === 'PGRST116') return null;
//     throw error;
//   }

//   return data;
// };

// // ============================================
// // ALLOCATE LEAVE (Admin Functions)
// // ============================================

// export const allocateLeaveForUser = async (userId: string, year: number): Promise<void> => {
//   const { error } = await supabase.rpc('allocate_leave_for_user', {
//     p_user_id: userId,
//     p_year: year,
//     p_hire_date: null,
//   });

//   if (error) throw error;
// };

// export const allocateLeaveForAllUsers = async (year?: number) => {
//   const targetYear = year || new Date().getFullYear();

//   const { data, error } = await supabase.rpc('allocate_leave_for_all_users', {
//     p_year: targetYear,
//   });

//   if (error) throw error;
//   return data[0];
// };

// // ============================================
// // ADJUST BALANCE (Admin)
// // ============================================

// export const adjustLeaveBalance = async (
//   userId: string,
//   leaveType: LeaveType,
//   year: number,
//   allocatedDays: number,
//   reason: string
// ): Promise<LeaveBalance> => {
//   const { data, error } = await supabase
//     .from('leave_balances')
//     .update({
//       allocated_days: allocatedDays,
//       updated_at: new Date().toISOString(),
//     })
//     .eq('user_id', userId)
//     .eq('leave_type', leaveType)
//     .eq('year', year)
//     .select()
//     .single();

//   if (error) throw error;
//   return data;
// };