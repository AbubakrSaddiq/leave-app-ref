import React, { useRef } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, Button, VStack, HStack, Box,
  Text, Badge, Divider, Grid, GridItem,
} from '@chakra-ui/react';
import { FiPrinter, FiDownload } from 'react-icons/fi';
import type { LeaveReportData } from '@/api/reports.api';
import { formatDate } from '@/utils/date.utils';
import { useLeaveDetailModal } from '@/hooks/useLeaveDetailModal';

interface LeaveDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  leave: LeaveReportData;
}

export function LeaveDetailModal({ isOpen, onClose, leave }: LeaveDetailModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { isExporting, handlePrint, handleExportPdf, getLeaveTypeColor } = useLeaveDetailModal(leave);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="no-print">
            Leave Application Details
          </ModalHeader>
          <ModalCloseButton className="no-print" />

          <ModalBody ref={printRef}>
            <VStack align="stretch" spacing={6} className="print-content">
              
              {/* Header Section */}
              <Box textAlign="center" pb={4} borderBottom="2px solid" borderColor="blue.500">
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  LEAVE APPLICATION
                </Text>
                <Text fontSize="lg" fontWeight="bold" mt={2}>
                  {leave.application_number}
                </Text>
              </Box>

              {/* Employee Information */}
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="blue.600" mb={3}>
                  Employee Information
                </Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Text fontSize="sm" color="gray.600">Full Name</Text>
                    <Text fontWeight="bold">{leave.user.full_name}</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontSize="sm" color="gray.600">Email</Text>
                    <Text>{leave.user.email}</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontSize="sm" color="gray.600">Department</Text>
                    <Text fontWeight="bold">
                      {leave.user.department?.code || "—"} - {leave.user.department?.name || "N/A"}
                    </Text>
                  </GridItem>
                  <GridItem>
                    <Text fontSize="sm" color="gray.600">Designation</Text>
                    <Text>{leave.user.designation?.name || "N/A"}</Text>
                  </GridItem>
                </Grid>
              </Box>

              <Divider />

              {/* Leave Details */}
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="blue.600" mb={3}>
                  Leave Details
                </Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Text fontSize="sm" color="gray.600">Leave Type</Text>
                    <Badge
                      colorScheme={getLeaveTypeColor(leave.leave_type)}
                      fontSize="md"
                      px={3}
                      py={1}
                      mt={1}
                    >
                      {leave.leave_type.toUpperCase()}
                    </Badge>
                  </GridItem>
                  <GridItem>
                    <Text fontSize="sm" color="gray.600">Working Days</Text>
                    <Text fontSize="xl" fontWeight="bold" color="blue.600">
                      {leave.working_days} days
                    </Text>
                  </GridItem>
                  <GridItem>
                    <Text fontSize="sm" color="gray.600">Start Date</Text>
                    <Text fontWeight="bold">{formatDate(leave.start_date, "MMMM dd, yyyy")}</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontSize="sm" color="gray.600">End Date</Text>
                    <Text fontWeight="bold">{formatDate(leave.end_date, "MMMM dd, yyyy")}</Text>
                  </GridItem>
                  <GridItem colSpan={2}>
                    <Text fontSize="sm" color="gray.600">Reason</Text>
                    <Box
                      p={3}
                      bg="gray.50"
                      borderRadius="md"
                      mt={1}
                      borderLeft="4px solid"
                      borderColor="blue.500"
                    >
                      <Text>{leave.reason || "No reason provided"}</Text>
                    </Box>
                  </GridItem>
                </Grid>
              </Box>

              <Divider />

              {/* Approval Information */}
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="blue.600" mb={3}>
                  Approval Information
                </Text>
                
                <VStack align="stretch" spacing={4}>
                  {/* Status */}
                  <Box>
                    <Text fontSize="sm" color="gray.600">Status</Text>
                    <Badge
                      colorScheme="green"
                      fontSize="md"
                      px={3}
                      py={1}
                      mt={1}
                    >
                      APPROVED
                    </Badge>
                  </Box>

                  {/* Director Approval */}
                  {leave.director_approved_at && (
                    <Box
                      p={4}
                      bg="green.50"
                      borderRadius="md"
                      borderLeft="4px solid"
                      borderColor="green.500"
                    >
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="bold" color="green.700">
                          ✓ Director Approval
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {formatDate(leave.director_approved_at, "MMMM dd, yyyy 'at' HH:mm")}
                        </Text>
                      </HStack>
                      {leave.director_comments && (
                        <Box mt={2}>
                          <Text fontSize="sm" color="gray.600">Comments:</Text>
                          <Text mt={1}>{leave.director_comments}</Text>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* HR Approval */}
                  {leave.hr_approved_at && (
                    <Box
                      p={4}
                      bg="blue.50"
                      borderRadius="md"
                      borderLeft="4px solid"
                      borderColor="blue.500"
                    >
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="bold" color="blue.700">
                          ✓ HR Approval
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {formatDate(leave.hr_approved_at, "MMMM dd, yyyy 'at' HH:mm")}
                        </Text>
                      </HStack>
                      {leave.hr_comments && (
                        <Box mt={2}>
                          <Text fontSize="sm" color="gray.600">Comments:</Text>
                          <Text mt={1}>{leave.hr_comments}</Text>
                        </Box>
                      )}
                    </Box>
                  )}
                </VStack>
              </Box>

              {/* Application Dates */}
              <Box bg="gray.50" p={4} borderRadius="md">
                <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                  <GridItem>
                    <Text fontSize="xs" color="gray.600">Application Submitted</Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {formatDate(leave.created_at, "MMM dd, yyyy 'at' HH:mm")}
                    </Text>
                  </GridItem>
                  {leave.updated_at && leave.updated_at !== leave.created_at && (
                    <GridItem>
                      <Text fontSize="xs" color="gray.600">Last Updated</Text>
                      <Text fontSize="sm" fontWeight="medium">
                        {formatDate(leave.updated_at, "MMM dd, yyyy 'at' HH:mm")}
                      </Text>
                    </GridItem>
                  )}
                </Grid>
              </Box>

              {/* Footer */}
              <Box pt={4} borderTop="1px solid" borderColor="gray.200">
                <Text fontSize="xs" color="gray.500" textAlign="center" fontStyle="italic">
                  This is an official leave application record. For authorized personnel only.
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter className="no-print" borderTop="1px solid" borderColor="gray.200">
            <HStack spacing={3}>
              <Button
                leftIcon={<FiPrinter />}
                onClick={handlePrint}
                variant="outline"
              >
                Print
              </Button>
              <Button
                leftIcon={<FiDownload />}
                onClick={handleExportPdf}
                colorScheme="blue"
                isLoading={isExporting}
                loadingText="Exporting..."
              >
                Export PDF
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-content {
            width: 100%;
            padding: 20pt;
          }
          @page {
            size: A4 portrait;
            margin: 1cm;
          }
        }
      `}</style>
    </>
  );
}