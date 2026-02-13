// ============================================
// Leave Applications API - COMPLETE FIXED
// ============================================
import { supabase } from '@/lib/supabase';
import type { LeaveApplication, LeaveType, LeaveStatus } from '@/types/models';

// ============================================
// TYPES
// ============================================

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

interface LeaveValidationResult {
  is_valid: boolean;
  working_days: number;
  validations: {
    sufficient_balance: {
      valid: boolean;
      available_days: number;
      required_days: number;
      message?: string;
    };
    no_overlap: {
      valid: boolean;
      conflicting_application_id?: string;
      message?: string;
    };
    minimum_notice: {
      valid: boolean;
      required_days: number;
      provided_days: number;
      message?: string;
    };
  };
  warnings?: string[];
}

// ============================================
// GET LEAVE APPLICATIONS
// ============================================

export async function getLeaveApplications(params?: {
  page?: number;
  limit?: number;
  status?: LeaveStatus | LeaveStatus[];
  leave_type?: LeaveType | LeaveType[];
  user_id?: string;
  department_id?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: 'submitted_at' | 'start_date' | 'status';
  sort_order?: 'asc' | 'desc';
}): Promise<PaginatedResponse<LeaveApplication>> {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      leave_type,
      user_id,
      department_id,
      start_date,
      end_date,
      sort_by = 'submitted_at',
      sort_order = 'desc',
    } = params || {};

    
    console.log('Fetching leave applications with params:', params);

    // Build query - FETCH USER DATA WITH DEPARTMENT
    let query = supabase
      .from('leave_applications')
      .select(
        `
        *,
        user:users!leave_applications_user_id_fkey (
          id,
          full_name,
          email,
          role,
          department:departments!users_department_id_fkey (
            id,
            name,
            code
          )
        )
        `,
        { count: 'exact' }
      );

    // Apply filters
    if (status) {
      if (Array.isArray(status)) {
        query = query.in('status', status);
      } else {
        query = query.eq('status', status);
      }
    }

    if (leave_type) {
      if (Array.isArray(leave_type)) {
        query = query.in('leave_type', leave_type);
      } else {
        query = query.eq('leave_type', leave_type);
      }
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (start_date) {
      query = query.gte('start_date', start_date);
    }

    if (end_date) {
      query = query.lte('end_date', end_date);
    }

    // Sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching leave applications:', error);
      throw error;
    }

    console.log('Fetched leave applications:', data);
    console.log('First application user data:', data?.[0]?.user);

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    };
  } catch (error: any) {
    console.error('Error in getLeaveApplications:', error);
    throw new Error(error.message || 'Failed to fetch leave applications');
  }
}

// ============================================
// GET SINGLE LEAVE APPLICATION (RENAMED)
// ============================================

export async function getLeaveApplication(id: string): Promise<LeaveApplication> {
  console.log('Fetching leave application by ID:', id);

  const { data, error } = await supabase
    .from('leave_applications')
    .select(
      `
      *,
      user:users!leave_applications_user_id_fkey (
        id,
        full_name,
        email,
        role,
        department:departments!users_department_id_fkey (
          id,
          name,
          code
        )
      )
      `
    )
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching leave application:', error);
    throw error;
  }

  console.log('Fetched leave application:', data);
  console.log('User data:', data?.user);

  return data;
}

// Alias for backward compatibility
export const getLeaveApplicationById = getLeaveApplication;

// ============================================
// CREATE LEAVE APPLICATION
// ============================================

export async function createLeaveApplication(params: {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  working_days: number;
  reason: string;
  study_program?: 'bsc' | 'msc' | 'phd';
}): Promise<LeaveApplication> {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

      // Validate study leave has program
    if (params.leave_type === 'study' && !params.study_program) {
      throw new Error('Study program is required for study leave');
    }
    
    // 1. Get user role to determine the starting status
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    // 2. Map status to your DB Enum (pending_director or pending_hr)
    let initialStatus: 'pending_director' | 'pending_hr' = 'pending_director';
    if (userProfile?.role === 'director') {
      initialStatus = 'pending_hr';
    }

        // Build insert data
    const insertData: any = {
      user_id: authUser.id,
      leave_type: params.leave_type,
      start_date: params.start_date,
      end_date: params.end_date,
      working_days: params.working_days,
      reason: params.reason,
      status: initialStatus,
      submitted_at: new Date().toISOString(),
    };

      // Add study_program for study leave
    if (params.leave_type === 'study' && params.study_program) {
      insertData.study_program = params.study_program;
    }

    // 3. Perform the Insert with the literal selection string
      const { data, error } = await supabase
      .from('leave_applications')
      .insert([insertData])
      .select(`
        *,
        user:users!leave_applications_user_id_fkey (
          id,
          full_name,
          email,
          role,
          department:departments!users_department_id_fkey (
            id,
            name,
            code
          )
        )
      `)
      .single();

    if (error) {
      console.error('Database Error:', error);
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Create Application Error:', error.message);
    throw new Error(error.message || 'Failed to create leave application');
  }
}

// ============================================
// VALIDATE LEAVE APPLICATION
// ============================================

export async function validateLeaveApplication(params: {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
}): Promise<LeaveValidationResult> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const year = new Date(params.start_date).getFullYear();

    const { data, error } = await supabase.rpc('validate_leave_application', {
      p_user_id: user.id,
      p_leave_type: params.leave_type,
      p_start_date: params.start_date,
      p_end_date: params.end_date,
    });

    if (error) throw error;

    return data as LeaveValidationResult;
  } catch (error: any) {
    console.error('Error validating leave application:', error);
    throw new Error(error.message || 'Validation failed');
  }
}

// ============================================
// APPROVE LEAVE APPLICATION
// ============================================

export async function approveLeaveApplication(
  id: string,
  comments?: string
): Promise<LeaveApplication> {
  try {
    console.log('Approving leave application:', id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    // Get current application
    const { data: application, error: fetchError } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    let updateData: any = {};

    // Determine what to update based on current status
    if (application.status === 'pending_director') {
      updateData = {
        director_approved_by: user.id,
        director_approved_at: new Date().toISOString(),
        director_comments: comments || null,
        status: 'pending_hr',
      };
    } else if (application.status === 'pending_hr') {
      updateData = {
        hr_approved_by: user.id,
        hr_approved_at: new Date().toISOString(),
        hr_comments: comments || null,
        status: 'approved',
      };
    } else {
      throw new Error('Application cannot be approved in current status');
    }

    const { data, error } = await supabase
      .from('leave_applications')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
        user:users!leave_applications_user_id_fkey (
          id,
          full_name,
          email,
          role,
          department:departments!users_department_id_fkey (
            id,
            name,
            code
          )
        )
        `
      )
      .single();

    if (error) {
      console.error('Error approving leave application:', error);
      throw error;
    }

    console.log('Leave application approved:', data);
    return data;
  } catch (error: any) {
    console.error('Error in approveLeaveApplication:', error);
    throw new Error(error.message || 'Failed to approve leave application');
  }
}

// ============================================
// REJECT/UPDATE LEAVE APPLICATION
// ============================================

// export async function rejectLeaveApplication(
//   id: string,
//   comments: string
// ): Promise<LeaveApplication> {
//   try {
//     console.log('Rejecting leave application:', id);

//     const {
//       data: { user },
//     } = await supabase.auth.getUser();

//     if (!user) {
//       throw new Error('Not authenticated');
//     }

//     // Get current application
//     const { data: application, error: fetchError } = await supabase
//       .from('leave_applications')
//       .select('*')
//       .eq('id', id)
//       .single();

//     if (fetchError) throw fetchError;

//     let updateData: any = {
//       status: 'rejected' as LeaveStatus,
//     };

//     // Add comments based on who is rejecting
//     if (application.status === 'pending_director') {
//       updateData.director_approved_by = user.id;
//       updateData.director_approved_at = new Date().toISOString();
//       updateData.director_comments = comments;
//     } else if (application.status === 'pending_hr') {
//       updateData.hr_approved_by = user.id;
//       updateData.hr_approved_at = new Date().toISOString();
//       updateData.hr_comments = comments;
//     }

//     const { data, error } = await supabase
//       .from('leave_applications')
//       .update(updateData)
//       .eq('id', id)
//       .select(
//         `
//         *,
//         user:users!leave_applications_user_id_fkey (
//           id,
//           full_name,
//           email,
//           role,
//           department:departments!users_department_id_fkey (
//             id,
//             name,
//             code
//           )
//         )
//         `
//       )
//       .single();

//     if (error) {
//       console.error('Error rejecting leave application:', error);
//       throw error;
//     }

//     console.log('Leave application rejected:', data);
//     return data;
//   } catch (error: any) {
//     console.error('Error in rejectLeaveApplication:', error);
//     throw new Error(error.message || 'Failed to reject leave application');
//   }
// }

export async function updateLeaveStatus(
  id: string,
  status: 'approved' | 'rejected' | 'pending_hr',
  comments: string
): Promise<LeaveApplication> {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    // 1. Fetch user role to know which comment column to fill
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    const isDirector = profile?.role === 'director';
    const isHR = profile?.role === 'hr' || profile?.role === 'admin';

    // 2. Prepare the update payload based on the schema columns
    const now = new Date().toISOString();
    let updateData: any = { 
      status, 
      updated_at: now 
    };

    if (isDirector) {
      updateData.director_comments = comments;
      updateData.director_approved_by = authUser.id;
      updateData.director_approved_at = now;
    } else if (isHR) {
      updateData.hr_comments = comments;
      updateData.hr_approved_by = authUser.id;
      updateData.hr_approved_at = now;
    }

    // 3. Execute the update
    const { data, error } = await supabase
      .from('leave_applications')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        user:users!leave_applications_user_id_fkey (
          id, full_name, email, role,
          department:departments!users_department_id_fkey (id, name, code)
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Update Status Error:', error.message);
    throw new Error(error.message || 'Failed to update leave status');
  }
}