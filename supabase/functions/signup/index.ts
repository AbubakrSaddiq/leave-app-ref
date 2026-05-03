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
  keyPrefix: "auth-signup",
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
          message: `Too many signup attempts. Please try again in ${rateLimitResult.retryAfter} seconds.`,
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
    const { email, password, full_name } = await req.json();

    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          message: "Email, password, and full_name are required",
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

    // ── Basic validation ─────────────────────────────────────────────────────
    if (password.length < 6) {
      return new Response(
        JSON.stringify({
          error: "Invalid password",
          message: "Password must be at least 6 characters",
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

    // ── Check if user already exists ─────────────────────────────────────────
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({
          error: "User already exists",
          message: "An account with this email already exists",
        }),
        {
          status: 409,
          headers: {
            ...corsHeaders,
            ...rateLimitHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ── Attempt signup ───────────────────────────────────────────────────────
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role: "staff", // Default role for self-signup
        },
      },
    });

    if (signUpError) {
      console.log("Signup failed for email:", email, "Error:", signUpError.message);
      return new Response(
        JSON.stringify({
          error: "Signup failed",
          message: signUpError.message || "Failed to create account",
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

    console.log("Signup successful for user:", data.user!.id);

    return new Response(
      JSON.stringify({
        user: data.user,
        message: "Signup successful. Please check your email to confirm your account.",
        confirmation_sent: data.user?.user_metadata?.email_verified === false,
      }),
      {
        status: 201,
        headers: {
          ...corsHeaders,
          ...rateLimitHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    console.error("Unhandled error in signup:", message);
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
