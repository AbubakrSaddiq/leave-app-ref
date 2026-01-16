// ============================================
// Users API
// ============================================

import { supabase } from '@/lib/supabase';
import type { User, UserRole } from '@/types/models';

// ============================================
// TYPES
// ============================================

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: UserRole;
  department_id?: string;
  search?: string;
  is_active?: boolean;
}

export interface PaginatedUsers {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface CreateUserParams {
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
  department_id: string;
  hire_date: string;
}

export interface UpdateUserParams {
  full_name?: string;
  role?: UserRole;
  department_id?: string;
  is_active?: boolean;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get all users with filters and pagination
 */
export async function getUsers(filters?: UserFilters): Promise<PaginatedUsers> {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      department_id,
      search,
      is_active,
    } = filters || {};

    // Build query
    let query = supabase
      .from('users')
      .select(
        `
        *,
        department:departments(id, name, code)
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }
    if (department_id) {
      query = query.eq('department_id', department_id);
    }
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active);
    }
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Order by name
    query = query.order('full_name');

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
  } catch (error: any) {
    console.error('Error fetching users:', error);
    throw new Error(error.message || 'Failed to fetch users');
  }
}

/**
 * Get single user by ID
 */
export async function getUserById(id: string): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(
        `
        *,
        department:departments(id, name, code)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error fetching user:', error);
    throw new Error(error.message || 'Failed to fetch user');
  }
}

/**
 * Create new user (Admin only)
 */
export async function createUser(params: CreateUserParams): Promise<User> {
  try {
    const { email, password, full_name, role, department_id, hire_date } = params;

    console.log('Creating user:', { email, full_name, role, department_id, hire_date });

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }
    
    if (!authData.user) {
      throw new Error('Failed to create auth user');
    }

    console.log('Auth user created:', authData.user.id);

    // 2. Wait for trigger to create user record
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Update the user profile with admin-specified details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({
        full_name,
        role,
        department_id,
        hire_date,
        is_active: true,
      })
      .eq('id', authData.user.id)
      .select(
        `
        *,
        department:departments(id, name, code)
      `
      )
      .single();

    if (userError) {
      console.error('User update error:', userError);
      
      // If user doesn't exist in users table, create it manually
      if (userError.code === 'PGRST116') {
        console.log('User not found in database, creating manually...');
        
        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email,
            full_name,
            role,
            department_id,
            hire_date,
            is_active: true,
          })
          .select(
            `
            *,
            department:departments(id, name, code)
          `
          )
          .single();

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }

        // 4. Allocate leave balances
        console.log('Allocating leave for user:', authData.user.id);
        const { error: allocError } = await supabase.rpc('allocate_leave_for_user', {
          p_user_id: authData.user.id,
          p_year: new Date().getFullYear(),
          p_hire_date: hire_date,
        });

        if (allocError) {
          console.error('Leave allocation error:', allocError);
        }

        return insertedUser;
      }
      
      throw userError;
    }

    // 4. Allocate leave balances
    console.log('Allocating leave for user:', authData.user.id);
    const { error: allocError } = await supabase.rpc('allocate_leave_for_user', {
      p_user_id: authData.user.id,
      p_year: new Date().getFullYear(),
      p_hire_date: hire_date,
    });

    if (allocError) {
      console.error('Leave allocation error:', allocError);
      // Don't throw - user is created, just allocation failed
    }

    console.log('User created successfully:', userData);
    return userData;
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw new Error(error.message || 'Failed to create user');
  }
}

/**
 * Update user profile (Admin only)
 */
export async function updateUser(
  id: string,
  params: UpdateUserParams
): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(params)
      .eq('id', id)
      .select(
        `
        *,
        department:departments(id, name, code)
      `
      )
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error updating user:', error);
    throw new Error(error.message || 'Failed to update user');
  }
}

/**
 * Activate user
 */
export async function activateUser(id: string): Promise<User> {
  return updateUser(id, { is_active: true });
}

/**
 * Deactivate user
 */
export async function deactivateUser(id: string): Promise<User> {
  return updateUser(id, { is_active: false });
}

/**
 * Delete user (Admin only)
 * This soft deletes by deactivating
 */
export async function deleteUser(id: string): Promise<void> {
  try {
    // Soft delete - just deactivate
    await deactivateUser(id);

    // Optional: Hard delete from auth if needed
    // await supabase.auth.admin.deleteUser(id);
  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw new Error(error.message || 'Failed to delete user');
  }
}

/**
 * Reset user password (Admin only)
 */
export async function resetUserPassword(
  email: string,
  newPassword: string
): Promise<void> {
  try {
    const { error } = await supabase.auth.admin.updateUserById(
      email,
      { password: newPassword }
    );

    if (error) throw error;
  } catch (error: any) {
    console.error('Error resetting password:', error);
    throw new Error(error.message || 'Failed to reset password');
  }
}

/**
 * Bulk import users from CSV data
 */
export async function bulkImportUsers(
  users: CreateUserParams[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const user of users) {
    try {
      await createUser(user);
      success++;
    } catch (error: any) {
      failed++;
      errors.push(`${user.email}: ${error.message}`);
    }
  }

  return { success, failed, errors };
}

/**
 * Get user statistics
 */
export async function getUserStatistics(): Promise<{
  total_users: number;
  active_users: number;
  by_role: Array<{ role: UserRole; count: number }>;
  by_department: Array<{ department: string; count: number }>;
}> {
  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select(
        `
        id,
        role,
        is_active,
        department:departments(name)
      `
      );

    if (error) throw error;

    const total_users = users?.length || 0;
    const active_users = users?.filter((u) => u.is_active).length || 0;

    // Group by role
    const roleGroups: Record<string, number> = {};
    users?.forEach((u) => {
      roleGroups[u.role] = (roleGroups[u.role] || 0) + 1;
    });
    const by_role = Object.entries(roleGroups).map(([role, count]) => ({
      role: role as UserRole,
      count,
    }));

    // Group by department
    const deptGroups: Record<string, number> = {};
    users?.forEach((u) => {
      const deptName = (u.department as any)?.name || 'Unassigned';
      deptGroups[deptName] = (deptGroups[deptName] || 0) + 1;
    });
    const by_department = Object.entries(deptGroups).map(([department, count]) => ({
      department,
      count,
    }));

    return {
      total_users,
      active_users,
      by_role,
      by_department,
    };
  } catch (error: any) {
    console.error('Error fetching user statistics:', error);
    throw new Error(error.message || 'Failed to fetch statistics');
  }
}