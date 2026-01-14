// ============================================
// Departments API
// ============================================

import { supabase } from '@/lib/supabase';
import type { Department } from '@/types/models';

/**
 * Get all departments
 */
export async function getDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select(`
      *,
      director:users!director_id(id, full_name, email)
    `)
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Create department
 */
export async function createDepartment(params: {
  name: string;
  code: string;
  director_id?: string;
}): Promise<Department> {
  const { data, error } = await supabase
    .from('departments')
    .insert([params])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update department
 */
export async function updateDepartment(
  id: string,
  params: Partial<{ name: string; code: string; director_id: string | null }>
): Promise<Department> {
  const { data, error } = await supabase
    .from('departments')
    .update(params)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete department
 */
export async function deleteDepartment(id: string): Promise<void> {
  const { error } = await supabase.from('departments').delete().eq('id', id);

  if (error) throw error;
}