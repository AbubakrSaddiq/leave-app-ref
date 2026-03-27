// ============================================================
// createUserDirect - Fixed to preserve admin session
//
// KEY FIX: supabase.auth.signUp() auto-logs you in as the new user.
// We capture the admin's session BEFORE signup, then restore it AFTER,
// so the admin stays logged in and the RPC calls work correctly.
// ============================================================

import { supabase } from '@/lib/supabase';

export interface CreateUserDirectParams {
  email: string;
  password: string;
  full_name: string;
  role: string;
  department_id?: string;
  designation_id?: string;
}

export async function createUserDirect(
  params: CreateUserDirectParams
): Promise<{ id: string; email: string }> {
  const { email, password, full_name, role, department_id, designation_id } = params;

  // ── Step 0: CAPTURE ADMIN SESSION ────────────────────────────────────────
  console.log('💾 Capturing admin session...');
  
  const { data: adminSessionData, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !adminSessionData?.session) {
    throw new Error('No active session found. Please log out and log back in.');
  }

  const adminSession = adminSessionData.session;
  console.log('✅ Admin session captured:', adminSession.user.email);

  // ── Step 1: Create the auth user ─────────────────────────────────────────
  console.log('📧 Creating auth user:', email);

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
      emailRedirectTo: undefined,
    },
  });

  if (signUpError) {
    console.error('❌ signUp failed:', signUpError);
    
    if (signUpError.message.toLowerCase().includes('already registered')) {
      throw new Error(`An account with email "${email}" already exists.`);
    }
    if (signUpError.message.toLowerCase().includes('invalid email')) {
      throw new Error('Invalid email address format.');
    }
    if (signUpError.message.toLowerCase().includes('password')) {
      throw new Error('Password does not meet security requirements.');
    }
    
    throw new Error(`Account creation failed: ${signUpError.message}`);
  }

  if (!signUpData.user) {
    throw new Error('Sign-up succeeded but no user was returned.');
  }

  const newUserId = signUpData.user.id;
  console.log('✅ Auth user created:', newUserId);

  // ── Step 2: RESTORE ADMIN SESSION ────────────────────────────────────────
  console.log('🔄 Restoring admin session...');
  
  const { error: restoreError } = await supabase.auth.setSession({
    access_token: adminSession.access_token,
    refresh_token: adminSession.refresh_token,
  });

  if (restoreError) {
    console.error('⚠️ Failed to restore admin session:', restoreError);
  } else {
    console.log('✅ Admin session restored');
  }

  // ── Step 3: Wait for trigger ──────────────────────────────────────────────
  console.log('⏳ Waiting for trigger to create profile row...');
  await new Promise((resolve) => setTimeout(resolve, 2500));

  // ── Step 4: Set role/dept/designation via RPC ────────────────────────────
  console.log('🔧 Setting up profile...');
  
  const { error: setupError } = await supabase.rpc('admin_setup_user_profile', {
    p_target_user_id: newUserId,
    p_full_name:      full_name,
    p_role:           role,
    p_department_id:  department_id && department_id !== "" ? department_id : null,
    p_designation_id: designation_id && designation_id !== "" ? designation_id : null,
  });

  if (setupError) {
    console.error('❌ Profile setup failed:', setupError);
    throw new Error(
      `User created but profile setup failed: ${setupError.message}. ` +
      'Please contact an administrator to manually configure this account.'
    );
  }

  console.log('✅ Profile configured');

  // ── Step 5: Allocate leave balances ───────────────────────────────────────
  // FIX: removed p_hire_date — column does not exist in this schema
  console.log('📅 Allocating leave balances...');
  
  const { error: leaveError } = await supabase.rpc('allocate_leave_for_user', {
    p_user_id: newUserId,
    p_year:    new Date().getFullYear(),
  });

  if (leaveError) {
    console.warn('⚠️ Leave allocation failed:', leaveError.message);
    // Non-fatal — admin can allocate manually from the Leave Allocations tab
  } else {
    console.log('✅ Leave balances allocated');
  }

  console.log('🎉 User creation complete!');
  return { id: newUserId, email };
}

// // ============================================================
// // createUserDirect - Fixed to preserve admin session
// //
// // KEY FIX: supabase.auth.signUp() auto-logs you in as the new user.
// // We capture the admin's session BEFORE signup, then restore it AFTER,
// // so the admin stays logged in and the RPC calls work correctly.
// // ============================================================

// import { supabase } from '@/lib/supabase';

// export interface CreateUserDirectParams {
//   email: string;
//   password: string;
//   full_name: string;
//   role: string;
//   department_id?: string;
//   designation_id?: string;
// }

// export async function createUserDirect(
//   params: CreateUserDirectParams
// ): Promise<{ id: string; email: string }> {
//   const { email, password, full_name, role, department_id, designation_id } = params;

//   // ── Step 0: CAPTURE ADMIN SESSION ────────────────────────────────────────
//   // This is CRITICAL — signUp() will replace this session with the new user's
//   console.log('💾 Capturing admin session...');
  
//   const { data: adminSessionData, error: sessionError } = await supabase.auth.getSession();
  
//   if (sessionError || !adminSessionData?.session) {
//     throw new Error('No active session found. Please log out and log back in.');
//   }

//   const adminSession = adminSessionData.session;
//   console.log('✅ Admin session captured:', adminSession.user.email);

//   // ── Step 1: Create the auth user ─────────────────────────────────────────
//   // WARNING: This will auto-login as the new user, kicking admin out
//   console.log('📧 Creating auth user:', email);

//   const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
//     email,
//     password,
//     options: {
//       data: { full_name },
//       emailRedirectTo: undefined,
//     },
//   });

//   if (signUpError) {
//     console.error('❌ signUp failed:', signUpError);
    
//     if (signUpError.message.toLowerCase().includes('already registered')) {
//       throw new Error(`An account with email "${email}" already exists.`);
//     }
//     if (signUpError.message.toLowerCase().includes('invalid email')) {
//       throw new Error('Invalid email address format.');
//     }
//     if (signUpError.message.toLowerCase().includes('password')) {
//       throw new Error('Password does not meet security requirements.');
//     }
    
//     throw new Error(`Account creation failed: ${signUpError.message}`);
//   }

//   if (!signUpData.user) {
//     throw new Error('Sign-up succeeded but no user was returned.');
//   }

//   const newUserId = signUpData.user.id;
//   console.log('✅ Auth user created:', newUserId);

//   // ── Step 2: RESTORE ADMIN SESSION ────────────────────────────────────────
//   // This is the KEY FIX — we restore the admin's session so they stay logged in
//   console.log('🔄 Restoring admin session...');
  
//   const { error: restoreError } = await supabase.auth.setSession({
//     access_token: adminSession.access_token,
//     refresh_token: adminSession.refresh_token,
//   });

//   if (restoreError) {
//     console.error('⚠️ Failed to restore admin session:', restoreError);
//     // Non-fatal — continue anyway, admin can re-login if needed
//   } else {
//     console.log('✅ Admin session restored');
//   }

//   // ── Step 3: Wait for trigger ──────────────────────────────────────────────
//   console.log('⏳ Waiting for trigger to create profile row...');
//   await new Promise((resolve) => setTimeout(resolve, 2500));

//   // ── Step 4: Set role/dept/designation via RPC ────────────────────────────
//   // Now auth.uid() returns the ADMIN's ID, so the RLS check passes ✅
//   console.log('🔧 Setting up profile...');
  
//   const { error: setupError } = await supabase.rpc('admin_setup_user_profile', {
//     p_target_user_id: newUserId,
//     p_full_name:      full_name,
//     p_role:           role,
//     p_department_id:  department_id && department_id !== "" ? department_id : null,
//     p_designation_id: designation_id && designation_id !== "" ? designation_id : null,
//   });

//   if (setupError) {
//     console.error('❌ Profile setup failed:', setupError);
//     throw new Error(
//       `User created but profile setup failed: ${setupError.message}. ` +
//       'Please contact an administrator to manually configure this account.'
//     );
//   }

//   console.log('✅ Profile configured');

//   // ── Step 5: Allocate leave balances ───────────────────────────────────────
//   console.log('📅 Allocating leave balances...');
  
//   const { error: leaveError } = await supabase.rpc('allocate_leave_for_user', {
//     p_user_id:   newUserId,
//     p_year:      new Date().getFullYear(),
//     p_hire_date: null,
//   });

//   if (leaveError) {
//     console.warn('⚠️ Leave allocation failed:', leaveError.message);
//     // Non-fatal — admin can allocate manually later from the admin panel
//   } else {
//     console.log('✅ Leave balances allocated');
//   }

//   console.log('🎉 User creation complete!');
//   return { id: newUserId, email };
// }
