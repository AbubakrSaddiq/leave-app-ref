// supabase/functions/admin-create-user/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create a Supabase client with the user's JWT (to verify role)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get the user from the JWT
    const {
      data: { user: caller },
      error: userError,
    } = await supabaseClient.auth.getUser()
    if (userError || !caller) {
      throw new Error('Invalid user token')
    }

    // Fetch the caller's role from the `users` table (or use JWT claims if you store role there)
    const { data: callerProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (profileError || !callerProfile) {
      throw new Error('Could not verify user role')
    }

    const allowedRoles = ['hr', 'admin']
    if (!allowedRoles.includes(callerProfile.role)) {
      throw new Error('Forbidden: Only HR or Admin can create users')
    }

    // Parse request body
    const { email, password, user_metadata } = await req.json()
    if (!email || !password || !user_metadata?.full_name) {
      throw new Error('Missing required fields: email, password, full_name')
    }

    // Create a Supabase admin client (service role) for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // 1. Create the user in auth.users
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email (or set to false if you want verification)
      user_metadata: {
        full_name: user_metadata.full_name,
        role: user_metadata.role || 'staff',
      },
    })

    if (createError) {
      console.error('Auth creation error:', createError)
      throw new Error(`Failed to create auth user: ${createError.message}`)
    }

    if (!authUser.user) {
      throw new Error('Auth user creation returned no user')
    }

    // 2. Insert the corresponding profile into public.users
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id, // Same ID as auth.users
        email: authUser.user.email!,
        full_name: user_metadata.full_name,
        role: user_metadata.role || 'staff',
        department_id: user_metadata.department_id || null,
        designation_id: user_metadata.designation_id || null,
        is_active: true,
      })

    if (insertError) {
      // If profile insert fails, clean up the auth user to avoid orphaned accounts
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      console.error('Profile insert error:', insertError)
      throw new Error(`Failed to create user profile: ${insertError.message}`)
    }

    // 3. Return success
    return new Response(
      JSON.stringify({
        message: 'User created successfully',
        user: {
          id: authUser.user.id,
          email: authUser.user.email,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})