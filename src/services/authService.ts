import { supabase } from "@/lib/supabase";
import { Profile } from "@/types/auth";

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    created_at: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at: number;
  };
  profile: Profile;
  message: string;
}

/**
 * Login using the rate-limited edge function
 * Provides better control and brute-force protection
 */
export async function loginWithEdgeFunction(
  credentials: LoginRequest
): Promise<LoginResponse> {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(credentials),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        throw new Error(
          `Too many login attempts. Please try again in ${retryAfter} seconds.`
        );
      }

      throw new Error(data.message || "Login failed");
    }

    // Set session in Supabase
    if (data.session?.access_token) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }

    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

/**
 * Alternative: Use native Supabase auth (client-side, no rate limiting)
 * Use this for development or if edge function is not available
 */
export async function loginWithSupabase(
  credentials: LoginRequest
): Promise<any> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out user
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Refresh access token
 */
export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw error;
  return data.session;
}

export const authService = {
  loginWithEdgeFunction,
  loginWithSupabase,
  signOut,
  getCurrentSession,
  refreshSession,
  
  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("users")
      .select("*, department:departments!department_id(*)")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Supabase error fetching profile:", error.message);
      throw error;
    }

    return data as Profile;
  },
};
