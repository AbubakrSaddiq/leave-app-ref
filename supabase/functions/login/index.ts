import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  checkRateLimit,
  getRateLimitHeaders,
  getClientIdentifier,
  type RateLimitConfig,
} from "../rate-limiter/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: 5 attempts per 15 minutes for auth routes
const AUTH_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyPrefix: "auth-login",
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
    // ── Rate Limiting ───────────────────────────────────────────────────────
    const identifier = getClientIdentifier(req);
    const rateLimitResult = checkRateLimit(identifier, AUTH_RATE_LIMIT);

    const rateLimitHeaders = getRateLimitHeaders(
      AUTH_RATE_LIMIT.maxRequests,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: `Too many login attempts. Please try again in ${rateLimitResult.retryAfter} seconds.`,
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            ...rateLimitHeaders,
            "Retry-After": rateLimitResult.retryAfter.toString(),
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ── Parse and validate body ─────────────────────────────────────────────
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          error: "Missing credentials",
          message: "Email and password are required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            ...rateLimitHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ── Initialize Supabase client ───────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // ── Attempt login ────────────────────────────────────────────────────────
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.log("Login failed for email:", email, "Error:", signInError.message);
      return new Response(
        JSON.stringify({
          error: "Authentication failed",
          message: signInError.message || "Invalid email or password",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            ...rateLimitHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ── Fetch user profile ───────────────────────────────────────────────────
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: profile } = await serviceClient
      .from("users")
      .select(
        `
        id,
        email,
        full_name,
        role,
        is_active,
        avatar_url,
        department_id,
        department:departments(id, name, code),
        created_at,
        updated_at
      `
      )
      .eq("id", data.user!.id)
      .maybeSingle();

    console.log("Login successful for user:", data.user!.id);

    return new Response(
      JSON.stringify({
        user: data.user,
        session: {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_in: data.session?.expires_in,
          expires_at: data.session?.expires_at,
        },
        profile,
        message: "Login successful",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          ...rateLimitHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    console.error("Unhandled error in login:", message);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
