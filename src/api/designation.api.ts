// ============================================
// Designations API
// ============================================

import { supabase } from '@/lib/supabase';
import type { Designation } from '@/types/models';

// ============================================
// GET DESIGNATIONS
// ============================================

/**
 * Get all active designations
 */
export async function getDesignations(): Promise<Designation[]> {
  const { data, error } = await supabase
    .from('designations')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Get all designations (including inactive)
 */
export async function getAllDesignations(includeInactive: boolean = false): Promise<Designation[]> {
  let query = supabase
    .from('designations')
    .select('*')
    .order('name');

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get single designation by ID
 */
export async function getDesignationById(id: string): Promise<Designation> {
  const { data, error } = await supabase
    .from('designations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// CREATE/UPDATE/DELETE DESIGNATIONS (Admin only)
// ============================================

/**
 * Create new designation
 */
export async function createDesignation(params: {
  name: string;
  code: string;
  description?: string;
}): Promise<Designation> {
  const { data, error } = await supabase
    .from('designations')
    .insert([{
      name: params.name,
      code: params.code.toUpperCase(),
      description: params.description || null,
      is_active: true,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update designation
 */
export async function updateDesignation(
  id: string,
  params: Partial<{ name: string; code: string; description: string; is_active: boolean }>
): Promise<Designation> {
  const updateData: any = { ...params };
  
  if (params.code) {
    updateData.code = params.code.toUpperCase();
  }

  const { data, error } = await supabase
    .from('designations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Soft delete designation (set is_active = false)
 */
export async function deactivateDesignation(id: string): Promise<Designation> {
  return updateDesignation(id, { is_active: false });
}

/**
 * Activate designation
 */
export async function activateDesignation(id: string): Promise<Designation> {
  return updateDesignation(id, { is_active: true });
}

/**
 * Hard delete designation (use with caution - will affect users)
 */
export async function deleteDesignation(id: string): Promise<void> {
  const { error } = await supabase
    .from('designations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if designation is in use by any users
 */
export async function isDesignationInUse(id: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('designation_id', id);

  if (error) throw error;
  return (count || 0) > 0;
}

/**
 * Get user count by designation
 */
export async function getUserCountByDesignation(): Promise<Array<{
  designation_id: string;
  designation_name: string;
  user_count: number;
}>> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      designation_id,
      designation:designations(name)
    `)
    .not('designation_id', 'is', null);

  if (error) throw error;

  // Group and count
  const grouped = (data || []).reduce((acc: any, item: any) => {
    const id = item.designation_id;
    const name = item.designation?.name || 'Unknown';
    
    if (!acc[id]) {
      acc[id] = {
        designation_id: id,
        designation_name: name,
        user_count: 0,
      };
    }
    acc[id].user_count++;
    return acc;
  }, {});

  return Object.values(grouped);
}