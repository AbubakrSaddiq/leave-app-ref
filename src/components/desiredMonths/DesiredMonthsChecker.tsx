// ============================================
// Desired Months Checker Component
// Displays modal if user hasn't submitted desired months
// ============================================

import React, { useEffect } from 'react';
import { useDisclosure } from '@chakra-ui/react';
import { useAuth } from '@/hooks/useAuth';
import { useHasSubmittedDesiredMonths } from '@/hooks/useDesiredLeaveMonths';
import { DesiredLeaveMonthsForm } from './DesiredLeaveMonthsForm';

export const DesiredMonthsChecker: React.FC = () => {
  const { profile } = useAuth();
  const { data: hasSubmitted, isLoading } = useHasSubmittedDesiredMonths();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    // Only show modal for staff, director roles (not admin/hr)
    // Admin and HR don't need to submit desired months
    if (
      !isLoading &&
      hasSubmitted === false &&
      profile &&
      (profile.role === 'staff' || profile.role === 'director')
    ) {
      onOpen();
    }
  }, [hasSubmitted, isLoading, profile, onOpen]);

  // Don't show modal for admin/hr
  if (!profile || profile.role === 'admin' || profile.role === 'hr') {
    return null;
  }

  return (
    <DesiredLeaveMonthsForm
      isOpen={isOpen}
      onClose={onClose}
      canClose={false} // User must submit before closing
    />
  );
};