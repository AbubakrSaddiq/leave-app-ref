// ============================================
// Leave Application Card Component
// Displays individual leave application
// ============================================

import React from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  Icon,
  Divider,
  useDisclosure,
} from "@chakra-ui/react";
import {
  FiCalendar,
  FiUser,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import type { LeaveApplication, LeaveStatus, LeaveType } from "@/types/models";
import { formatDate, formatDateRange } from "@/utils/date.utils";
import { ApprovalModal } from "./ApprovalModal";

const LEAVE_TYPE_CONFIG: Record<LeaveType, { label: string; color: string }> = {
  annual: { label: "Annual", color: "blue" },
  casual: { label: "Casual", color: "green" },
  sick: { label: "Sick", color: "red" },
  maternity: { label: "Maternity", color: "purple" },
  paternity: { label: "Paternity", color: "orange" },
};

const STATUS_CONFIG: Record<LeaveStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "gray" },
  pending_director: { label: "Pending Director", color: "yellow" },
  pending_hr: { label: "Pending HR", color: "orange" },
  approved: { label: "Approved", color: "green" },
  rejected: { label: "Rejected", color: "red" },
};

interface LeaveApplicationCardProps {
  application: LeaveApplication;
  showActions?: boolean;
  onApprove?: (id: string, comments?: string) => void;
  onReject?: (id: string, comments: string) => void;
}

export const LeaveApplicationCard: React.FC<LeaveApplicationCardProps> = ({
  application,
  showActions = false,
  onApprove,
  onReject,
}) => {
  const {
    isOpen: isApproveOpen,
    onOpen: onApproveOpen,
    onClose: onApproveClose,
  } = useDisclosure();
  const {
    isOpen: isRejectOpen,
    onOpen: onRejectOpen,
    onClose: onRejectClose,
  } = useDisclosure();

  const leaveConfig = LEAVE_TYPE_CONFIG[application.leave_type];
  const statusConfig = STATUS_CONFIG[application.status];

  const handleApprove = (comments?: string) => {
    if (onApprove) {
      onApprove(application.id, comments);
      onApproveClose();
    }
  };

  const handleReject = (comments: string) => {
    if (onReject) {
      onReject(application.id, comments);
      onRejectClose();
    }
  };

  return (
    <>
      <Box
        bg="white"
        borderRadius="lg"
        boxShadow="md"
        p={5}
        borderLeft="4px solid"
        borderLeftColor={`${leaveConfig.color}.500`}
        _hover={{ boxShadow: "lg" }}
        transition="all 0.2s"
      >
        <VStack spacing={4} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="flex-start">
            <VStack align="flex-start" spacing={1}>
              <HStack>
                <Badge colorScheme={leaveConfig.color} fontSize="sm">
                  {leaveConfig.label}
                </Badge>
                <Badge colorScheme={statusConfig.color} fontSize="sm">
                  {statusConfig.label}
                </Badge>
              </HStack>
              <Text fontSize="xs" color="gray.500">
                {application.application_number}
              </Text>
            </VStack>

            <Text fontSize="sm" fontWeight="bold" color="blue.600">
              {application.working_days} days
            </Text>
          </HStack>

          <Divider />

          {/* User Info */}
          <HStack spacing={2}>
            <Icon as={FiUser} color="gray.500" />
            <Text fontSize="sm" fontWeight="medium">
              {(application as any).user?.full_name || "Unknown User"}
            </Text>
          </HStack>

          {/* Date Range */}
          <HStack spacing={2}>
            <Icon as={FiCalendar} color="gray.500" />
            <Text fontSize="sm">
              {formatDateRange(application.start_date, application.end_date)}
            </Text>
          </HStack>

          {/* Submitted Date */}
          {application.submitted_at && (
            <HStack spacing={2}>
              <Icon as={FiClock} color="gray.500" />
              <Text fontSize="sm" color="gray.600">
                Submitted {formatDate(application.submitted_at)}
              </Text>
            </HStack>
          )}

          {/* Reason */}
          <Box bg="gray.50" p={3} borderRadius="md">
            <Text fontSize="xs" fontWeight="bold" color="gray.700" mb={1}>
              Reason:
            </Text>
            <Text fontSize="sm" color="gray.700">
              {application.reason}
            </Text>
          </Box>

          {/* Comments if rejected */}
          {application.status === "rejected" && (
            <Box
              bg="red.50"
              p={3}
              borderRadius="md"
              borderLeft="3px solid"
              borderLeftColor="red.500"
            >
              <Text fontSize="xs" fontWeight="bold" color="red.700" mb={1}>
                Rejection Comments:
              </Text>
              <Text fontSize="sm" color="red.700">
                {application.director_comments ||
                  application.hr_comments ||
                  "No comments provided"}
              </Text>
            </Box>
          )}

          {/* Action Buttons */}
          {showActions && (
            <HStack spacing={3} pt={2}>
              <Button
                leftIcon={<Icon as={FiCheckCircle} />}
                colorScheme="green"
                size="sm"
                onClick={onApproveOpen}
                flex={1}
              >
                Approve
              </Button>
              <Button
                leftIcon={<Icon as={FiXCircle} />}
                colorScheme="red"
                variant="outline"
                size="sm"
                onClick={onRejectOpen}
                flex={1}
              >
                Reject
              </Button>
            </HStack>
          )}
        </VStack>
      </Box>

      {/* Modals */}
      <ApprovalModal
        isOpen={isApproveOpen}
        onClose={onApproveClose}
        onConfirm={handleApprove}
        type="approve"
        applicationNumber={application.application_number}
      />

      <ApprovalModal
        isOpen={isRejectOpen}
        onClose={onRejectClose}
        onConfirm={handleReject}
        type="reject"
        applicationNumber={application.application_number}
      />
    </>
  );
};
