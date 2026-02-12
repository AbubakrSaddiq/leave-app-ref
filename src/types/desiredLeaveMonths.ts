// ============================================
// Desired Leave Months Types
// ============================================

export interface DesiredLeaveMonth {
  id: string;
  user_id: string;
  preferred_months: number[]; // Array of month numbers (1-12)
  submitted_at: string;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubmitDesiredMonthsDto {
  preferred_months: number[];
}

export interface MonthOption {
  value: number;
  label: string;
  shortLabel: string;
}

export interface DesiredMonthsValidationResult {
  is_valid: boolean;
  desired_months: number[] | null;
  leave_months: number[] | null;
  message: string;
}