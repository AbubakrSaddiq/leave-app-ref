import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Profile } from '@/types/auth';
import { authService } from '@/services/authService';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  profile: Profile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await authService.getCurrentProfile();
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    
    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      // Clear all React Query cache on auth change
      if (event === 'SIGNED_OUT') {
        console.log('User signed out - clearing all cache');
        queryClient.clear(); // Nuclear option: clear everything
        setProfile(null);
      } else if (event === 'SIGNED_IN') {
        console.log('User signed in - clearing cache and reloading profile');
        queryClient.clear(); // Clear cache to prevent cross-user data
        await loadProfile();
      } else if (event === 'TOKEN_REFRESHED') {
        // Token refresh doesn't need cache clear, just profile update
        await loadProfile();
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ profile, isLoading, refreshProfile: loadProfile }}>
      {children}
    </AuthContext.Provider>
  );
};