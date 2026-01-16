// ============================================
// Leave Applications API
// ============================================

import { supabase } from '@/lib/supabase';
import type {
  LeaveApplication,
  CreateLeaveApplicationDto,
  LeaveStatus,
  LeaveType,
  PaginatedResponse,
} from '@/types/models';



// ============================================
// GET LEAVE APPLICATIONS
// ============================================

export const getLeaveApplications = async (params?: {
  page?: number;
  limit?: number;
  status?: LeaveStatus | LeaveStatus[];
  leave_type?: LeaveType;
  user_id?: string;
  // department_id?: String;
  // start_date?: String;
  // end_date?: String;
  // sort_by?: 'submitted_at' | 'start_date' | 'status';
  // sort_order?: 'asc' | 'desc';
}): Promise<PaginatedResponse<LeaveApplication>> => {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('leave_applications')
    .select('*', { count: 'exact' });

  if (params?.status) {
    if (Array.isArray(params.status)) {
      query = query.in('status', params.status);
    } else {
      query = query.eq('status', params.status);
    }
  }

  if (params?.leave_type) {
    query = query.eq('leave_type', params.leave_type);
  }

  if (params?.user_id) {
    query = query.eq('user_id', params.user_id);
  }

  query = query.order('submitted_at', { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / limit),
    },
  };
};

export const getLeaveApplication = async (id: string): Promise<LeaveApplication> => {
  const { data, error } = await supabase
    .from('leave_applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// CREATE LEAVE APPLICATION
// ============================================

export const createLeaveApplication = async (
  applicationData: CreateLeaveApplicationDto
): Promise<LeaveApplication> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get user profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('id, role, department_id')
    .eq('id', user.id)
    .single();

  if (!userProfile) throw new Error('User profile not found');

  // Calculate working days
  const { data: workingDays } = await supabase.rpc('calculate_working_days', {
    p_start_date: applicationData.start_date,
    p_end_date: applicationData.end_date,
  });

  // Determine workflow
  const { data: workflow } = await supabase.rpc('determine_approval_workflow', {
    p_user_id: user.id,
    p_user_role: userProfile.role,
  });

  const workflowData = workflow?.[0];

  // Create application
  const { data, error } = await supabase
    .from('leave_applications')
    .insert({
      user_id: user.id,
      leave_type: applicationData.leave_type,
      start_date: applicationData.start_date,
      end_date: applicationData.end_date,
      working_days: workingDays,
      reason: applicationData.reason,
      status: workflowData?.initial_status || 'pending_director',
      director_id: workflowData?.director_id,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// VALIDATE LEAVE APPLICATION
// ============================================

export const validateLeaveApplication = async (
  userId: string,
  leaveType: LeaveType,
  startDate: string,
  endDate: string
) => {
  const { data, error } = await supabase.rpc('validate_leave_application', {
    p_user_id: userId,
    p_leave_type: leaveType,
    p_start_date: startDate,
    p_end_date: endDate,
    p_exclude_application_id: null,
  });

  if (error) throw error;
  return data?.[0];
};

// ============================================
// APPROVE / REJECT
// ============================================

export const approveLeaveApplication = async (
  id: string,
  comments?: string
): Promise<LeaveApplication> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: application } = await supabase
    .from('leave_applications')
    .select('status')
    .eq('id', id)
    .single();

  if (!application) throw new Error('Application not found');

  let updateData: any = {};

  if (application.status === 'pending_director') {
    updateData = {
      status: 'pending_hr',
      director_approved_by: user.id,
      director_approved_at: new Date().toISOString(),
      director_comments: comments || null,
    };
  } else if (application.status === 'pending_hr') {
    updateData = {
      status: 'approved',
      hr_approved_by: user.id,
      hr_approved_at: new Date().toISOString(),
      hr_comments: comments || null,
    };
  }

  const { data, error } = await supabase
    .from('leave_applications')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const rejectLeaveApplication = async (
  id: string,
  comments: string
): Promise<LeaveApplication> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: application } = await supabase
    .from('leave_applications')
    .select('status')
    .eq('id', id)
    .single();

  if (!application) throw new Error('Application not found');

  const updateData: any = { status: 'rejected' };

  if (application.status === 'pending_director') {
    updateData.director_comments = comments;
  } else if (application.status === 'pending_hr') {
    updateData.hr_comments = comments;
  }

  const { data, error } = await supabase
    .from('leave_applications')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};