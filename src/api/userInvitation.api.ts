import { supabase } from '@/lib/supabase';
 
export async function createUserInvitation(params: {
  email: string;
  full_name: string;
  password: string;
  role: string;
  department_id?: string;
  designation_id?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
 
  const { data: invitation, error } = await supabase
    .from('user_invitations')
    .insert([{
      email: params.email,
      full_name: params.full_name,
      role: params.role,
      department_id: params.department_id || null,
      designation_id: params.designation_id || null,
      temp_password: params.password,
      invited_by: user.id,
    }])
    .select()
    .single();
 
  if (error) {
    if (error.code === '23505') {
      throw new Error('An invitation for this email already exists');
    }
    throw error;
  }
 
  const signupUrl = `${window.location.origin}/signup?email=${encodeURIComponent(params.email)}`;
  return { invitation, signupUrl };
}
