// ============================================
// Approval Queue Component
// Shows pending applications for approval
// ============================================

import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Select,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  SimpleGrid,
} from "@chakra-ui/react";
import {
  useLeaveApplications,
  useApproveLeaveApplication,
  useRejectLeaveApplication,
} from "@/hooks/useLeaveApplication";
import { LeaveApplicationCard } from "./LeaveApplicationCard";
import type { LeaveStatus } from "@/types/models";

interface ApprovalQueueProps {
  role: "director" | "hr";
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ role }) => {
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "all">("all");

  const pendingStatus = (
    role === "director" ? "pending_director" : "pending_hr"
  ) as LeaveStatus;

  const queryParams = {
    status:
      statusFilter === "all" ? [pendingStatus] : [statusFilter as LeaveStatus],
    page: 1,
    limit: 50,
  };

  const { data, isLoading, error } = useLeaveApplications(queryParams);
  const approveMutation = useApproveLeaveApplication();
  const rejectMutation = useRejectLeaveApplication();

  const handleApprove = async (id: string, comments?: string) => {
    await approveMutation.mutateAsync({ id, comments });
  };

  const handleReject = async (id: string, comments: string) => {
    await rejectMutation.mutateAsync({ id, comments });
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text mt={4} color="gray.600">
          Loading applications...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <AlertDescription>
          Failed to load leave applications. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const applications = data?.data || [];
  const pendingCount = applications.filter(
    (app) => app.status === pendingStatus
  ).length;

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between" align="center">
        <Box>
          <Heading size="lg" mb={2}>
            {role === "director" ? "Director" : "HR"} Approval Queue
          </Heading>
          <HStack spacing={2}>
            <Text color="gray.600">
              Showing applications pending your approval
            </Text>
            {pendingCount > 0 && (
              <Badge colorScheme="orange" fontSize="md">
                {pendingCount} pending
              </Badge>
            )}
          </HStack>
        </Box>

        <Select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as LeaveStatus | "all")
          }
          width="200px"
          size="lg"
        >
          <option value="all">All Pending</option>
          <option value="pending_director">Pending Director</option>
          <option value="pending_hr">Pending HR</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </HStack>

      {/* Applications Grid */}
      {applications.length === 0 ? (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <AlertDescription>
            No leave applications found. All caught up! 🎉
          </AlertDescription>
        </Alert>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {applications.map((application) => (
            <LeaveApplicationCard
              key={application.id}
              application={application}
              showActions={application.status === pendingStatus}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </SimpleGrid>
      )}

      {/* Info Box */}
      <Box
        bg="blue.50"
        p={4}
        borderRadius="md"
        borderLeft="4px solid"
        borderLeftColor="blue.500"
      >
        <Text fontSize="sm" fontWeight="bold" mb={2}>
          📋 Approval Process:
        </Text>
        {role === "director" ? (
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="sm">1. Review leave request details carefully</Text>
            <Text fontSize="sm">2. Check team coverage and workload</Text>
            <Text fontSize="sm">
              3. Approve to send to HR or Reject with comments
            </Text>
            <Text fontSize="sm">4. HR will make final approval decision</Text>
          </VStack>
        ) : (
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="sm">1. Review director-approved requests</Text>
            <Text fontSize="sm">
              2. Verify leave balance and policy compliance
            </Text>
            <Text fontSize="sm">
              3. Make final approval or rejection decision
            </Text>
            <Text fontSize="sm">4. Staff will be notified via email</Text>
          </VStack>
        )}
      </Box>
    </VStack>
  );
};
