// ============================================
// Desired Leave Months API (2 MONTHS ONLY)
// ============================================

import { supabase } from '@/lib/supabase';
import type { 
  DesiredLeaveMonth, 
  SubmitDesiredMonthsDto,
  DesiredMonthsValidationResult 
} from '@/types/desiredLeaveMonths';

// ============================================
// GET DESIRED MONTHS
// ============================================

/**
 * Get current user's desired leave months
 */
export async function getMyDesiredMonths(): Promise<DesiredLeaveMonth | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('desired_leave_months')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // If no record found, return null (not an error)
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching desired months:', error);
    throw new Error(error.message || 'Failed to fetch desired months');
  }
}

/**
 * Get desired months for a specific user (Admin/HR only)
 */
export async function getUserDesiredMonths(userId: string): Promise<DesiredLeaveMonth | null> {
  try {
    const { data, error } = await supabase
      .from('desired_leave_months')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching user desired months:', error);
    throw new Error(error.message || 'Failed to fetch user desired months');
  }
}

/**
 * Check if current user has submitted desired months
 */
export async function hasSubmittedDesiredMonths(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data, error } = await supabase
      .from('users')
      .select('has_submitted_desired_months')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return data?.has_submitted_desired_months || false;
  } catch (error: any) {
    console.error('Error checking submission status:', error);
    return false;
  }
}

// ============================================
// SUBMIT DESIRED MONTHS (EXACTLY 2)
// ============================================

/**
 * Submit desired leave months (exactly 2 months only)
 */
export async function submitDesiredMonths(
  params: SubmitDesiredMonthsDto
): Promise<DesiredLeaveMonth> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    // Validate months array - MUST BE EXACTLY 2
    if (!params.preferred_months || params.preferred_months.length === 0) {
      throw new Error('Please select exactly 2 months');
    }

    if (params.preferred_months.length !== 2) {
      throw new Error('You must select exactly 2 months (you selected ' + params.preferred_months.length + ')');
    }

    // Validate month values (1-12)
    const invalidMonths = params.preferred_months.filter(
      (m) => m < 1 || m > 12
    );
    if (invalidMonths.length > 0) {
      throw new Error('Invalid month values detected');
    }

    // Remove duplicates and sort
    const uniqueMonths = Array.from(new Set(params.preferred_months)).sort(
      (a, b) => a - b
    );

    // Double check after removing duplicates
    if (uniqueMonths.length !== 2) {
      throw new Error('You must select exactly 2 different months');
    }

    const { data, error } = await supabase
      .from('desired_leave_months')
      .insert([
        {
          user_id: user.id,
          preferred_months: uniqueMonths,
          submitted_at: new Date().toISOString(),
          is_locked: true,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('You have already submitted your desired leave months');
      }
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error submitting desired months:', error);
    throw new Error(error.message || 'Failed to submit desired months');
  }
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate if leave dates fall within desired months
 */
export async function validateLeaveDatesInDesiredMonths(
  startDate: string,
  endDate: string
): Promise<DesiredMonthsValidationResult> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc(
      'check_leave_dates_in_desired_months',
      {
        p_user_id: user.id,
        p_start_date: startDate,
        p_end_date: endDate,
      }
    );

    if (error) throw error;

    // The RPC returns an array with one result
    const result = Array.isArray(data) ? data[0] : data;

    return {
      is_valid: result.is_valid || false,
      desired_months: result.desired_months || null,
      leave_months: result.leave_months || null,
      message: result.message || '',
    };
  } catch (error: any) {
    console.error('Error validating leave dates:', error);
    throw new Error(error.message || 'Failed to validate leave dates');
  }
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

/**
 * Get all users' desired months (Admin/HR only)
 */
export async function getAllDesiredMonths(): Promise<
  Array<DesiredLeaveMonth & { user?: { full_name: string; email: string } }>
> {
  try {
    const { data, error } = await supabase
      .from('desired_leave_months')
      .select(
        `
        *,
        user:users!desired_leave_months_user_id_fkey(full_name, email)
      `
      )
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error('Error fetching all desired months:', error);
    throw new Error(error.message || 'Failed to fetch all desired months');
  }
}

/**
 * Get users who haven't submitted desired months
 */
export async function getUsersWithoutDesiredMonths(): Promise<
  Array<{ id: string; full_name: string; email: string; department?: string }>
> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(
        `
        id,
        full_name,
        email,
        department:departments(name)
      `
      )
      .eq('has_submitted_desired_months', false)
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error('Error fetching users without desired months:', error);
    throw new Error(error.message || 'Failed to fetch users');
  }
}