import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    console.log('🚀 Starting user creation...')
    
    // Parse request body
    const { email, password, user_metadata } = await req.json()
    console.log('📧 Email:', email)
    console.log('👤 User metadata:', user_metadata)

    // Validate required fields
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    // Create Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { 
        auth: { 
          autoRefreshToken: false, 
          persistSession: false 
        } 
      }
    )

    // Get the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ No Authorization header')
      throw new Error('Missing authorization header')
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the caller
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !caller) {
      console.error('❌ Auth verification failed:', authError?.message)
      throw new Error('Unauthorized: Invalid authentication token')
    }

    console.log('✅ Caller authenticated:', caller.id)

    // Get caller's profile and role
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role, full_name, email')
      .eq('id', caller.id)
      .single()

    if (profileError || !callerProfile) {
      console.error('❌ Profile fetch failed:', profileError?.message)
      throw new Error('User profile not found')
    }

    console.log('👔 Caller:', callerProfile.full_name, '(' + callerProfile.role + ')')

    // 🔥 CHECK AUTHORIZATION: Allow ADMIN or HR
    if (!['admin', 'hr'].includes(callerProfile.role)) {
      console.error('❌ Unauthorized role:', callerProfile.role)
      throw new Error(`Access denied. Only Admin and HR can create users. Your role: ${callerProfile.role}`)
    }

    console.log('✅ Authorization passed - proceeding with user creation')

    // Create the new user in auth.users
    const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: user_metadata || {},
    })

    if (createError) {
      console.error('❌ User creation failed:', createError.message)
      throw new Error(`Failed to create user: ${createError.message}`)
    }

    console.log('✅ Auth user created:', newAuthUser.user.id)

    // Wait for database trigger to create user record
    console.log('⏳ Waiting for trigger to create user record...')
    await new Promise(resolve => setTimeout(resolve, 2500))

    // Update the user profile in public.users table
    if (user_metadata) {
      console.log('📝 Updating user profile...')
      
      const updateData = {
        full_name: user_metadata.full_name,
        role: user_metadata.role,
        department_id: user_metadata.department_id || null,
        designation_id: user_metadata.designation_id || null,
        is_active: true,
      }

      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', newAuthUser.user.id)
        .select()
        .single()

      if (updateError) {
        console.warn('⚠️ Update failed, attempting manual insert:', updateError.message)
        
        // If update failed, try manual insert
        const { data: insertedUser, error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            id: newAuthUser.user.id,
            email: email,
            ...updateData
          })
          .select()
          .single()

        if (insertError) {
          console.error('❌ Manual insert also failed:', insertError.message)
          throw new Error('User created in auth but profile setup failed')
        }

        console.log('✅ User profile created via manual insert')
      } else {
        console.log('✅ User profile updated successfully')
      }
    }

    // Allocate leave balances
    console.log('📅 Allocating leave balances...')
    
    const { error: leaveError } = await supabaseAdmin.rpc('allocate_leave_for_user', {
      p_user_id: newAuthUser.user.id,
      p_year: new Date().getFullYear(),
      p_hire_date: null,
    })

    if (leaveError) {
      console.warn('⚠️ Leave allocation failed:', leaveError.message)
      // Don't throw - user is created, allocation can be done manually
    } else {
      console.log('✅ Leave balances allocated')
    }

    console.log('🎉 User creation completed successfully!')

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'User created successfully',
        user: {
          id: newAuthUser.user.id,
          email: newAuthUser.user.email,
        },
        created_by: {
          name: callerProfile.full_name,
          email: callerProfile.email,
          role: callerProfile.role,
        }
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    console.error('💥 ERROR:', error.message)
    console.error('Stack trace:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})