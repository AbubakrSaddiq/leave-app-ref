// ============================================
// Analytics API
// ============================================

import { supabase } from '@/lib/supabase';
import type { LeaveType, LeaveStatus } from '@/types/models';

// ============================================
// TYPES
// ============================================

export interface DashboardAnalytics {
  summary: {
    total_applications: number;
    pending_applications: number;
    approved_applications: number;
    rejected_applications: number;
    average_approval_time_hours: number;
  };
  by_leave_type: Array<{
    leave_type: LeaveType;
    count: number;
    total_days: number;
  }>;
  by_status: Array<{
    status: LeaveStatus;
    count: number;
  }>;
  by_department: Array<{
    department_id: string;
    department_name: string;
    total_applications: number;
    utilization_percentage: number;
  }>;
  monthly_trend: Array<{
    month: string;
    applications: number;
    days_taken: number;
  }>;
}

export interface LeaveUtilization {
  year: number;
  by_user: Array<{
    user_id: string;
    user_name: string;
    department: string;
    by_leave_type: Array<{
      leave_type: LeaveType;
      allocated: number;
      used: number;
      pending: number;
      available: number;
      utilization_percentage: number;
    }>;
    total_utilization_percentage: number;
  }>;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get dashboard analytics
 */
export async function getDashboardAnalytics(params?: {
  start_date?: string;
  end_date?: string;
  department_id?: string;
}): Promise<DashboardAnalytics> {
  try {
    const { start_date, end_date, department_id } = params || {};

    // Build query
    let query = supabase
      .from('leave_applications')
      .select(`
        *,
        user:users(full_name, department_id, department:departments(name))
      `);

    if (start_date) {
      query = query.gte('submitted_at', start_date);
    }
    if (end_date) {
      query = query.lte('submitted_at', end_date);
    }
    if (department_id) {
      query = query.eq('user.department_id', department_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate summary statistics
    const summary = {
      total_applications: data.length,
      pending_applications: data.filter(
        (app: any) => app.status === 'pending_director' || app.status === 'pending_hr'
      ).length,
      approved_applications: data.filter((app: any) => app.status === 'approved').length,
      rejected_applications: data.filter((app: any) => app.status === 'rejected').length,
      average_approval_time_hours: calculateAverageApprovalTime(data),
    };

    // Group by leave type
    const by_leave_type = groupByLeaveType(data);

    // Group by status
    const by_status = groupByStatus(data);

    // Group by department (if admin/HR)
    const by_department = await groupByDepartment(data);

    // Monthly trend
    const monthly_trend = calculateMonthlyTrend(data);

    return {
      summary,
      by_leave_type,
      by_status,
      by_department,
      monthly_trend,
    };
  } catch (error: any) {
    console.error('Error fetching dashboard analytics:', error);
    throw new Error(error.message || 'Failed to fetch analytics');
  }
}

/**
 * Get leave utilization report
 */
export async function getLeaveUtilization(params?: {
  year?: number;
  department_id?: string;
}): Promise<LeaveUtilization> {
  try {
    const year = params?.year || new Date().getFullYear();
    const { department_id } = params || {};

    // Get all users with their balances
    let query = supabase
      .from('users')
      .select(`
        id,
        full_name,
        department:departments(name),
        leave_balances(
          leave_type,
          allocated_days,
          used_days,
          pending_days,
          available_days
        )
      `)
      .eq('is_active', true)
      .eq('leave_balances.year', year);

    if (department_id) {
      query = query.eq('department_id', department_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform data
    const by_user = data.map((user: any) => {
      const balances = user.leave_balances || [];
      
      const by_leave_type = balances.map((balance: any) => ({
        leave_type: balance.leave_type,
        allocated: balance.allocated_days,
        used: balance.used_days,
        pending: balance.pending_days,
        available: balance.available_days,
        utilization_percentage:
          balance.allocated_days > 0
            ? Math.round((balance.used_days / balance.allocated_days) * 100)
            : 0,
      }));

      const total_allocated = balances.reduce(
        (sum: number, b: any) => sum + b.allocated_days,
        0
      );
      const total_used = balances.reduce((sum: number, b: any) => sum + b.used_days, 0);
      const total_utilization_percentage =
        total_allocated > 0 ? Math.round((total_used / total_allocated) * 100) : 0;

      return {
        user_id: user.id,
        user_name: user.full_name,
        department: user.department?.name || 'N/A',
        by_leave_type,
        total_utilization_percentage,
      };
    });

    return {
      year,
      by_user,
    };
  } catch (error: any) {
    console.error('Error fetching leave utilization:', error);
    throw new Error(error.message || 'Failed to fetch utilization data');
  }
}

/**
 * Export analytics to CSV
 */
export function exportAnalyticsToCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0] || {});
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => JSON.stringify(row[header] || '')).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateAverageApprovalTime(applications: any[]): number {
  const approvedApps = applications.filter((app) => app.status === 'approved');

  if (approvedApps.length === 0) return 0;

  const totalHours = approvedApps.reduce((sum, app) => {
    const submitted = new Date(app.submitted_at);
    const approved = new Date(app.hr_approved_at || app.director_approved_at);
    const hours = (approved.getTime() - submitted.getTime()) / (1000 * 60 * 60);
    return sum + hours;
  }, 0);

  return Math.round(totalHours / approvedApps.length);
}

function groupByLeaveType(applications: any[]) {
  const grouped: Record<string, { count: number; total_days: number }> = {};

  applications.forEach((app) => {
    if (!grouped[app.leave_type]) {
      grouped[app.leave_type] = { count: 0, total_days: 0 };
    }
    grouped[app.leave_type].count++;
    grouped[app.leave_type].total_days += app.working_days || 0;
  });

  return Object.entries(grouped).map(([leave_type, stats]) => ({
    leave_type: leave_type as LeaveType,
    count: stats.count,
    total_days: Math.round(stats.total_days * 10) / 10,
  }));
}

function groupByStatus(applications: any[]) {
  const grouped: Record<string, number> = {};

  applications.forEach((app) => {
    grouped[app.status] = (grouped[app.status] || 0) + 1;
  });

  return Object.entries(grouped).map(([status, count]) => ({
    status: status as LeaveStatus,
    count,
  }));
}

async function groupByDepartment(applications: any[]) {
  try {
    // Get department info
    const { data: departments } = await supabase
      .from('departments')
      .select('id, name');

    const grouped: Record<
      string,
      { name: string; count: number; total_days: number }
    > = {};

    applications.forEach((app) => {
      const deptId = app.user?.department_id;
      if (!deptId) return;

      if (!grouped[deptId]) {
        const dept = departments?.find((d) => d.id === deptId);
        grouped[deptId] = {
          name: dept?.name || 'Unknown',
          count: 0,
          total_days: 0,
        };
      }
      grouped[deptId].count++;
      if (app.status === 'approved') {
        grouped[deptId].total_days += app.working_days || 0;
      }
    });

    return Object.entries(grouped).map(([id, stats]) => ({
      department_id: id,
      department_name: stats.name,
      total_applications: stats.count,
      utilization_percentage: 0, // TODO: Calculate based on total allocated days
    }));
  } catch (error) {
    console.error('Error grouping by department:', error);
    return [];
  }
}

function calculateMonthlyTrend(applications: any[]) {
  const grouped: Record<string, { applications: number; days_taken: number }> = {};

  applications.forEach((app) => {
    const month = new Date(app.submitted_at).toISOString().substring(0, 7); // YYYY-MM

    if (!grouped[month]) {
      grouped[month] = { applications: 0, days_taken: 0 };
    }
    grouped[month].applications++;
    if (app.status === 'approved') {
      grouped[month].days_taken += app.working_days || 0;
    }
  });

  return Object.entries(grouped)
    .map(([month, stats]) => ({
      month,
      applications: stats.applications,
      days_taken: Math.round(stats.days_taken * 10) / 10,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}