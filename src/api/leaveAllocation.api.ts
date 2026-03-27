// ============================================
// Leave Allocation API
// ============================================

import { supabase } from '@/lib/supabase';
import type { LeaveType } from '@/types/models';

// ============================================
// TYPES
// ============================================

export interface StaffLeaveBalance {
  user_id: string;
  full_name: string;
  email: string;
  department_name: string | null;
  department_code: string | null;
  designation_name: string | null;
  is_active: boolean;
  balances: BalanceRow[];
}

export interface BalanceRow {
  id: string;
  leave_type: LeaveType;
  allocated_days: number;
  used_days: number;
  pending_days: number;
  available_days: number;
  year: number;
}

export interface UpdateAllocatedDaysParams {
  balance_id: string;
  allocated_days: number;
}

// ============================================
// GET ALL STAFF BALANCES (Admin/HR)
// ============================================

export async function getAllStaffLeaveBalances(year: number): Promise<StaffLeaveBalance[]> {
  // Fetch all active users with their balances for the given year
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      email,
      is_active,
      department:departments!users_department_id_fkey(name, code),
      designation:designations(name)
    `)
    .eq('is_active', true)
    .order('full_name');

  if (usersError) throw usersError;

  if (!users || users.length === 0) return [];

  // Fetch all balances for the year in one query
  const userIds = users.map((u: any) => u.id);

  const { data: balances, error: balancesError } = await supabase
    .from('leave_balances')
    .select('*')
    .in('user_id', userIds)
    .eq('year', year)
    .order('leave_type');

  if (balancesError) throw balancesError;

  // Map balances onto users
  return users.map((user: any) => {
    const userBalances = (balances || []).filter(
      (b: any) => b.user_id === user.id
    );

    return {
      user_id: user.id,
      full_name: user.full_name,
      email: user.email,
      is_active: user.is_active,
      department_name: user.department?.name ?? null,
      department_code: user.department?.code ?? null,
      designation_name: user.designation?.name ?? null,
      balances: userBalances.map((b: any) => ({
        id: b.id,
        leave_type: b.leave_type as LeaveType,
        allocated_days: Number(b.allocated_days),
        used_days: Number(b.used_days),
        pending_days: Number(b.pending_days),
        available_days: Number(b.available_days),
        year: b.year,
      })),
    };
  });
}

// ============================================
// UPDATE ALLOCATED DAYS
// ============================================

export async function updateAllocatedDays({
  balance_id,
  allocated_days,
}: UpdateAllocatedDaysParams): Promise<BalanceRow> {
  if (allocated_days < 0) throw new Error('Allocated days cannot be negative');

  const { data, error } = await supabase
    .from('leave_balances')
    .update({
      allocated_days,
      // Recalculate available_days = allocated - used - pending
      // This is done via a DB trigger or we do it here:
      updated_at: new Date().toISOString(),
    })
    .eq('id', balance_id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    leave_type: data.leave_type as LeaveType,
    allocated_days: Number(data.allocated_days),
    used_days: Number(data.used_days),
    pending_days: Number(data.pending_days),
    available_days: Number(data.available_days),
    year: data.year,
  };
}

// ============================================
// RE-RUN ALLOCATION FOR A SINGLE USER
// ============================================

export async function rerunAllocationForUser(
  userId: string,
  year: number
): Promise<void> {
  const { error } = await supabase.rpc('allocate_leave_for_user', {
    p_user_id: userId,
    p_year: year,
  });

  if (error) throw error;
}

// ============================================
// RE-RUN ALLOCATION FOR ALL USERS
// ============================================

export async function rerunAllocationForAllUsers(
  year: number
): Promise<{ user_count: number; year: number }> {
  const { data, error } = await supabase.rpc('allocate_leave_for_all_users', {
    p_year: year,
  });

  if (error) throw error;

  const result = Array.isArray(data) ? data[0] : data;
  return { user_count: result?.user_count ?? 0, year: result?.year ?? year };
}