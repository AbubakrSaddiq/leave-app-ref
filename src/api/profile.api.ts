// ============================================
// Profile API
// ============================================

import { supabase } from '@/lib/supabase';
import type { User } from '@/types/models';

// ============================================
// TYPES
// ============================================

export interface UpdateProfileParams {
  full_name?: string;
  avatar_url?: string;
}

export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get current user profile
 */
export async function getCurrentUserProfile(): Promise<User> {
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('users')
      .select(
        `
        *,
        department:departments(id, name, code)
      `
      )
      .eq('id', authUser.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    throw new Error(error.message || 'Failed to fetch profile');
  }
}

/**
 * Update user profile (name, avatar)
 */
export async function updateUserProfile(params: UpdateProfileParams): Promise<User> {
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('users')
      .update({
        full_name: params.full_name,
        avatar_url: params.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authUser.id)
      .select(
        `
        *,
        department:departments(id, name, code)
      `
      )
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error updating profile:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
}

/**
 * Change user password
 */
export async function changePassword(params: ChangePasswordParams): Promise<void> {
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) throw new Error('Not authenticated');

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: authUser.email!,
      password: params.currentPassword,
    });

    if (signInError) {
      throw new Error('Current password is incorrect');
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: params.newPassword,
    });

    if (updateError) throw updateError;
  } catch (error: any) {
    console.error('Error changing password:', error);
    throw new Error(error.message || 'Failed to change password');
  }
}

/**
 * Upload profile avatar
 */
export async function uploadAvatar(file: File): Promise<string> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath);

    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    throw new Error(error.message || 'Failed to upload avatar');
  }
}

/**
 * Delete profile avatar
 */
export async function deleteAvatar(avatarUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const urlParts = avatarUrl.split('/avatars/');
    if (urlParts.length < 2) return;

    const filePath = `avatars/${urlParts[1]}`;

    const { error } = await supabase.storage.from('avatars').remove([filePath]);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting avatar:', error);
    throw new Error(error.message || 'Failed to delete avatar');
  }
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Password must be at least 8 characters');
  }

  if (password.length >= 12) {
    score++;
  }

  // Complexity checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Include both uppercase and lowercase letters');
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Include at least one number');
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++;
  } else {
    feedback.push('Include at least one special character');
  }

  // Common patterns to avoid
  const commonPatterns = ['12345', 'password', 'qwerty', 'abc123'];
  if (commonPatterns.some((pattern) => password.toLowerCase().includes(pattern))) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common patterns like "12345" or "password"');
  }

  return {
    score: Math.min(4, score),
    feedback,
    isStrong: score >= 3,
  };
}

/**
 * Request password reset email
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  } catch (error: any) {
    console.error('Error requesting password reset:', error);
    throw new Error(error.message || 'Failed to send reset email');
  }
}