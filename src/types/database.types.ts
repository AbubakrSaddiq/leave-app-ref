// ============================================
// Database Types - Supabase Generated
// This file defines the database schema types
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'staff' | 'director' | 'hr' | 'admin'
          department_id: string | null
          // hire_date: string
          is_active: boolean
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role?: 'staff' | 'director' | 'hr' | 'admin'
          department_id?: string | null
          // hire_date: string
          is_active?: boolean
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'staff' | 'director' | 'hr' | 'admin'
          department_id?: string | null
          hire_date?: string
          is_active?: boolean
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      leave_balances: {
        Row: {
          id: string
          user_id: string
          leave_type: 'annual' | 'casual' | 'sick' | 'maternity' | 'paternity'
          year: number
          allocated_days: number
          used_days: number
          pending_days: number
          available_days: number
          created_at: string
          updated_at: string
        }
      }
      leave_applications: {
        Row: {
          id: string
          application_number: string
          user_id: string
          leave_type: 'annual' | 'casual' | 'sick' | 'maternity' | 'paternity'
          start_date: string
          end_date: string
          working_days: number
          status: 'draft' | 'pending_director' | 'pending_hr' | 'approved' | 'rejected'
          reason: string
          submitted_at: string | null
          director_id: string | null
          director_approved_by: string | null
          director_approved_at: string | null
          director_comments: string | null
          hr_approved_by: string | null
          hr_approved_at: string | null
          hr_comments: string | null
          created_at: string
          updated_at: string
        }
      }
      public_holidays: {
        Row: {
          id: string
          date: string
          name: string
          year: number
          is_active: boolean
          source: string
          created_at: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_working_days: {
        Args: {
          p_start_date: string
          p_end_date: string
        }
        Returns: number
      }
      validate_leave_application: {
        Args: {
          p_user_id: string
          p_leave_type: string
          p_start_date: string
          p_end_date: string
          p_exclude_application_id?: string
        }
        Returns: Array<{
          is_valid: boolean
          working_days: number
          errors: Json
          warnings: Json
        }>
      }
      allocate_leave_for_user: {
        Args: {
          p_user_id: string
          p_year: number
          p_hire_date?: string
        }
        Returns: void
      }
      allocate_leave_for_all_users: {
        Args: {
          p_year?: number
        }
        Returns: Array<{
          user_count: number
          year: number
        }>
      }
    }
    Enums: {
      user_role: 'staff' | 'director' | 'hr' | 'admin'
      leave_type: 'annual' | 'casual' | 'sick' | 'maternity' | 'paternity'
      leave_status: 'draft' | 'pending_director' | 'pending_hr' | 'approved' | 'rejected'
    }
  }
}