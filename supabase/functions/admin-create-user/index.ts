import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or malformed Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // ── Use service client to verify the token ──────────────────────────────
    // getUser(token) validates the JWT server-side without needing a matching
    // anon key — works regardless of how the session was created
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: userError } = await serviceClient.auth.getUser(token);

    console.log("Auth user:", user?.id, "Error:", userError?.message);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid or expired token",
          detail: userError?.message 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Fetch caller's role using service client scoped to their ID ─────────
    const { data: callerProfile, error: profileError } = await serviceClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    console.log("Caller profile:", callerProfile, "Error:", profileError?.message);

    if (!callerProfile) {
      return new Response(
        JSON.stringify({
          error: "Your profile was not found in public.users",
          detail: profileError?.message ?? "No row returned",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedRoles = ["admin", "hr"];
    if (!allowedRoles.includes(callerProfile.role)) {
      return new Response(
        JSON.stringify({
          error: "Forbidden: admin or hr role required",
          your_role: callerProfile.role,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Parse and validate body ─────────────────────────────────────────────
    const {
      email,
      password,
      full_name,
      role = "staff",
      department_id = null,
      designation_id = null,
    } = await req.json();

    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: "email, password, and full_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validRoles = ["staff", "director", "hr", "admin"];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: `Invalid role: ${role}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Create user in auth.users — trigger populates public.users ──────────
    const { data: newAuthUser, error: createError } =
      await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          role,
          department_id,
          designation_id,
        },
      });

    console.log("Created auth user:", newAuthUser?.user?.id, "Error:", createError?.message);

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Fetch the new public profile ────────────────────────────────────────
    const { data: publicProfile } = await serviceClient
      .from("users")
      .select("*")
      .eq("id", newAuthUser.user!.id)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        user: publicProfile ?? newAuthUser.user,
        message: "User created successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    console.error("Unhandled error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});