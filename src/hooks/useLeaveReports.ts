import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import { getApprovedLeaveReports, type LeaveReportFilters, type LeaveReportData } from '@/api/reports.api';
import { getDepartments } from '@/api/departments.api';
import { generateLeaveReportPdf } from '@/utils/generateLeaveReportPdf';

/**
 * Custom hook encapsulating all logic for the Reports page.
 * - Filters state and management
 * - TanStack Query data fetching
 * - PDF generation and modal state
 * - All side effects and error handling
 */
export function useLeaveReports() {
  const toast = useToast();

  // Filter state
  const [filters, setFilters] = useState<LeaveReportFilters>({
    startDate: '',
    endDate: '',
    departmentId: '',
    leaveType: '',
  });

  // Modal state
  const [selectedLeave, setSelectedLeave] = useState<LeaveReportData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch departments for filter dropdown
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  // Fetch approved leave reports based on filters
  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ['leave-reports', filters],
    queryFn: () => getApprovedLeaveReports(filters),
  });

  // Filter helpers
  const updateFilter = useCallback((key: keyof LeaveReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ startDate: '', endDate: '', departmentId: '', leaveType: '' });
  }, []);

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  // Modal handlers
  const openDetailModal = useCallback((leave: LeaveReportData) => {
    setSelectedLeave(leave);
    setIsDetailModalOpen(true);
  }, []);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedLeave(null);
  }, []);

  // PDF export handler
  const handleExportPdf = useCallback(async () => {
    if (!reports || reports.length === 0) {
      toast({
        title: 'No data to export',
        description: 'Apply filters to generate a report',
        status: 'warning',
      });
      return;
    }

    setIsGenerating(true);
    try {
      await generateLeaveReportPdf(reports, filters);
      toast({
        title: 'Report generated successfully',
        description: 'Your PDF file is ready for download',
        status: 'success',
        duration: 5000,
      });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message,
        status: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [reports, filters, toast]);

  // Print handler (simple window.print)
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return {
    // State
    filters,
    departments,
    reports,
    isLoading,
    isGenerating,
    selectedLeave,
    isDetailModalOpen,
    // Derived
    hasActiveFilters,
    // Actions
    updateFilter,
    clearFilters,
    openDetailModal,
    closeDetailModal,
    handleExportPdf,
    handlePrint,
    refetch, // expose refetch if needed elsewhere
  };
}