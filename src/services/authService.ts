import { supabase } from "@/lib/supabase";
import { Profile } from "@/types/auth";

export const authService = {
  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // We use the '!' syntax to specify which foreign key to follow
    // Format: relation_name:table_name!foreign_key_column_name(*)
    const { data, error } = await supabase
      .from("users")
      .select("*, department:departments!department_id(*)")
      .eq("id", user.id)
      .maybeSingle(); // Changed .single() to .maybeSingle() to prevent errors if row is missing

    if (error) {
      console.error("Supabase error fetching profile:", error.message);
      throw error;
    }

    return data as Profile;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};