import { useToast } from "@chakra-ui/react";
import type { LeaveReportData } from "@/api/reports.api";
import { generateSingleLeaveReportPdf } from "@/utils/generateSingleLeaveReport";

export const useLeaveExport = (leave: LeaveReportData) => {
  const toast = useToast();

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    try {
      await generateSingleLeaveReportPdf(leave);
      toast({
        title: "PDF generated successfully",
        description: `Leave application ${leave.application_number} exported`,
        status: "success",
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "An unknown error occurred",
        status: "error",
      });
    }
  };

  return { handlePrint, handleExportPdf };
};