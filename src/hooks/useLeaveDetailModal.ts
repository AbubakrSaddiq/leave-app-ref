import { useCallback, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import type { LeaveReportData } from '@/api/reports.api';
import { generateSingleLeaveReportPdf } from '@/utils/generateSingleLeaveReport';

/**
 * Maps leave type to Chakra UI badge color scheme.
 */
const leaveTypeColorMap: Record<string, string> = {
  annual: 'blue',
  sick: 'red',
  casual: 'green',
  maternity: 'purple',
  paternity: 'cyan',
  study: 'orange',
};

/**
 * Custom hook encapsulating logic for the leave detail modal.
 * - PDF export with loading state
 * - Print handler
 * - Leave type color mapping
 */
export function useLeaveDetailModal(leave: LeaveReportData) {
  const toast = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExportPdf = useCallback(async () => {
    setIsExporting(true);
    try {
      await generateSingleLeaveReportPdf(leave);
      toast({
        title: 'PDF generated successfully',
        description: `Leave application ${leave.application_number} exported`,
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message,
        status: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  }, [leave, toast]);

  const getLeaveTypeColor = useCallback((type: string): string => {
    return leaveTypeColorMap[type] || 'gray';
  }, []);

  return {
    isExporting,
    handlePrint,
    handleExportPdf,
    getLeaveTypeColor,
  };
}