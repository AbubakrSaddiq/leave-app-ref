// ============================================
// Reports API - Fetch approved leave applications
// ============================================

import { supabase } from '@/lib/supabase';
import type { LeaveApplication } from '@/types/models';

export interface LeaveReportFilters {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  userId?: string;
  leaveType?: string;
}

export interface LeaveReportData extends LeaveApplication {
  // Fields already included from base type
  // Adding explicit typing for nested relations
  user: {
    full_name: string;
    email: string;
    department?: {
      name: string;
      code: string;
    };
    designation?: {
      name: string;
      code: string;
    };
  };
}

/**
 * Get all approved leave applications for reporting
 */
export async function getApprovedLeaveReports(
  filters?: LeaveReportFilters
): Promise<LeaveReportData[]> {
  try {
    let query = supabase
      .from('leave_applications')
      .select(`
        *,
        user:users!leave_applications_user_id_fkey (
          full_name,
          email,
          department:departments!users_department_id_fkey (
            name,
            code
          ),
          designation:designations (
            name,
            code
          )
        )
      `)
      .eq('status', 'approved')
      .order('start_date', { ascending: false });

    // Apply filters
    if (filters?.startDate) {
      query = query.gte('start_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('end_date', filters.endDate);
    }
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.leaveType) {
      query = query.eq('leave_type', filters.leaveType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data as LeaveReportData[];
  } catch (error: any) {
    console.error('Error fetching leave reports:', error);
    throw new Error(error.message || 'Failed to fetch leave reports');
  }
}