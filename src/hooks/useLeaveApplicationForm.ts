import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDisclosure } from '@chakra-ui/react';
import { format, addYears, subDays } from 'date-fns';
import { LeaveType } from '@/types/models';
import { LEAVE_TYPE_OPTIONS, STUDY_PROGRAMS } from '@/constants/leaveConstants';
import { useCreateLeaveApplication } from '@/hooks/useLeaveApplication';
import { useMyLeaveBalances } from '@/hooks/useLeaveBalance';
import { useMyDesiredMonths } from '@/hooks/useDesiredLeaveMonths';
import { useValidateLeaveDates } from '@/hooks/useDesiredLeaveMonths';
import { leaveService } from '@/services/leaveService';

export interface LeaveFormData {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  working_days: number;
  study_program?: 'bsc' | 'msc' | 'phd';
}

interface UseLeaveApplicationFormProps {
  onSuccess?: () => void;
}

/**
 * Custom hook managing all logic for leave application form.
 * - Form state and validation
 * - Date calculations for regular and study leave
 * - Balance verification
 * - Desired months validation for annual leave
 * - Submission handling
 */
export function useLeaveApplicationForm({ onSuccess }: UseLeaveApplicationFormProps = {}) {
  const { isOpen: isDesiredMonthsOpen, onOpen: onDesiredMonthsOpen, onClose: onDesiredMonthsClose } = useDisclosure();
  
  const [workingDays, setWorkingDays] = useState(1);
  const [calculatedEndDate, setCalculatedEndDate] = useState('');
  const [resumptionDate, setResumptionDate] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  const form = useForm<LeaveFormData>({
    defaultValues: {
      leave_type: LeaveType.ANNUAL,
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: '',
      reason: '',
      working_days: 1,
      study_program: undefined,
    },
  });

  const { watch, setValue, reset } = form;
  const leaveType = watch('leave_type');
  const startDate = watch('start_date');
  const studyProgram = watch('study_program');

  const createMutation = useCreateLeaveApplication();
  const { data: balanceData } = useMyLeaveBalances();
  const { data: desiredMonths, refetch: refetchDesiredMonths } = useMyDesiredMonths();

  const currentBalance = balanceData?.balances.find(b => b.leave_type === leaveType);
  const isStudyLeave = leaveType === LeaveType.STUDY;

  // Reset form when leave type changes
  useEffect(() => {
    setWorkingDays(1);
    setCalculatedEndDate('');
    setResumptionDate('');
    setValue('working_days', 1);
    setValue('end_date', '');
    
    if (leaveType !== LeaveType.STUDY) {
      setValue('study_program', undefined);
    }
  }, [leaveType, setValue]);

  // Calculate dates based on leave type
  useEffect(() => {
    if (leaveType === LeaveType.STUDY) {
      calculateStudyLeaveDates();
    } else {
      calculateRegularLeaveDates();
    }
  }, [startDate, workingDays, leaveType, studyProgram]);

  const calculateStudyLeaveDates = () => {
    if (!startDate || !studyProgram) return;
    
    const program = STUDY_PROGRAMS.find(p => p.value === studyProgram);
    if (!program) return;

    const start = new Date(startDate);
    const end = subDays(addYears(start, program.durationYears), 1);
    const endDateStr = format(end, 'yyyy-MM-dd');
    
    setCalculatedEndDate(endDateStr);
    setValue('end_date', endDateStr);
    setValue('working_days', program.durationYears * 365);
    setWorkingDays(program.durationYears * 365);
    setResumptionDate(format(addYears(start, program.durationYears), 'yyyy-MM-dd'));
  };

  const calculateRegularLeaveDates = async () => {
    if (!startDate || workingDays <= 0) return;
    
    setIsCalculating(true);
    try {
      const endDate = await leaveService.calculateEndDate(startDate, workingDays);
      const resumption = await leaveService.calculateResumptionDate(endDate);
      
      setCalculatedEndDate(endDate);
      setResumptionDate(resumption);
      setValue('end_date', endDate);
      setValue('working_days', workingDays);
    } finally {
      setIsCalculating(false);
    }
  };

  // Desired months validation
  const shouldValidateDesiredMonths = 
    leaveType === LeaveType.ANNUAL && 
    !!startDate && 
    !!calculatedEndDate &&
    !isCalculating &&
    !!desiredMonths;

  const {
    data: desiredMonthsValidation,
    isLoading: isValidatingDesiredMonths,
  } = useValidateLeaveDates(
    startDate,
    calculatedEndDate,
    shouldValidateDesiredMonths
  );

  // Derived states
  const isAnnualLeaveBlocked = leaveType === LeaveType.ANNUAL && !desiredMonths;
  const isDesiredMonthsInvalid = 
    leaveType === LeaveType.ANNUAL && 
    desiredMonthsValidation && 
    !desiredMonthsValidation.is_valid;

  const canSubmit = 
    !isCalculating && 
    !isValidatingDesiredMonths &&
    !!calculatedEndDate && 
    !isAnnualLeaveBlocked &&
    !isDesiredMonthsInvalid &&
    (leaveType !== LeaveType.STUDY || !!studyProgram);

  // Handlers
  const handleDesiredMonthsClose = () => {
    onDesiredMonthsClose();
    refetchDesiredMonths();
  };

  const handleWorkingDaysChange = (value: number) => {
    setWorkingDays(value || 1);
  };

  const onSubmit = async (data: LeaveFormData) => {
    if (!canSubmit) return;

    await createMutation.mutateAsync({
      ...data,
      end_date: calculatedEndDate,
      working_days: workingDays,
    });

    reset();
    setWorkingDays(1);
    onSuccess?.();
  };

  // Get leave type description
  const getLeaveTypeDescription = () => {
    return LEAVE_TYPE_OPTIONS.find(o => o.value === leaveType)?.description;
  };

  // Get study program duration
  const getStudyProgramDuration = () => {
    return STUDY_PROGRAMS.find(p => p.value === studyProgram)?.duration;
  };

  // Get desired months formatted
  const getDesiredMonthsNames = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return desiredMonths?.preferred_months.map(monthNum => monthNames[monthNum - 1]) || [];
  };

  return {
    // Form state
    form,
    workingDays,
    calculatedEndDate,
    resumptionDate,
    isCalculating,
    currentBalance,
    desiredMonths,
    desiredMonthsValidation,
    isValidatingDesiredMonths,
    
    // Derived state
    leaveType,
    startDate,
    studyProgram,
    isStudyLeave,
    isAnnualLeaveBlocked,
    isDesiredMonthsInvalid,
    canSubmit,
    
    // Modal state
    isDesiredMonthsOpen,
    onDesiredMonthsOpen,
    handleDesiredMonthsClose,
    
    // Handlers
    handleWorkingDaysChange,
    onSubmit,
    
    // Helpers
    getLeaveTypeDescription,
    getStudyProgramDuration,
    getDesiredMonthsNames,
    
    // Mutation
    createMutation,
  };
}