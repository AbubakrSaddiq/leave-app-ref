// ============================================
// Balance Card Component
// ============================================

import React from "react";
import {
  Box,
  Text,
  Progress,
  HStack,
  VStack,
  Badge,
  Icon,
} from "@chakra-ui/react";
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiBook,
} from "react-icons/fi";
import type { LeaveBalance, LeaveType } from "@/types/models";

const LEAVE_TYPE_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    icon: typeof FiCalendar;
  }
> = {
  annual: { label: "Annual Leave", color: "blue", icon: FiCalendar },
  casual: { label: "Casual Leave", color: "green", icon: FiClock },
  sick: { label: "Sick Leave", color: "red", icon: FiAlertCircle },
  maternity: { label: "Maternity Leave", color: "purple", icon: FiCheckCircle },
  paternity: { label: "Paternity Leave", color: "orange", icon: FiCheckCircle },
  study: { label: "Study Leave", color: "teal", icon: FiBook },
};

// Fallback so an unknown leave type never crashes the page
const FALLBACK_CONFIG = {
  label: "Leave",
  color: "gray",
  icon: FiCalendar,
};

interface BalanceCardProps {
  balance: LeaveBalance;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ balance }) => {
  const config = LEAVE_TYPE_CONFIG[balance.leave_type] ?? FALLBACK_CONFIG;

  const utilizationPercentage =
    balance.allocated_days > 0
      ? (balance.used_days / balance.allocated_days) * 100
      : 0;

  const getStatusColor = () => {
    if (balance.available_days === 0) return "red";
    if (balance.available_days <= 5) return "orange";
    return "green";
  };

  const statusColor = getStatusColor();
  const isReapplicable = balance.leave_type === "sick";

  return (
    <Box
      bg="white"
      borderRadius="lg"
      boxShadow="md"
      p={6}
      borderLeft="4px solid"
      borderLeftColor={`${config.color}.500`}
    >
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between" align="flex-start">
          <HStack spacing={3}>
            <Box
              bg={`${config.color}.100`}
              p={2}
              borderRadius="md"
              color={`${config.color}.600`}
            >
              <Icon as={config.icon} boxSize={5} />
            </Box>
            <Text fontWeight="bold" fontSize="lg">
              {config.label}
            </Text>
          </HStack>

          {isReapplicable && (
            <Badge colorScheme="purple" fontSize="xs">
              Reapplicable
            </Badge>
          )}
        </HStack>

        <HStack justify="space-between" align="baseline">
          <VStack align="flex-start" spacing={0}>
            <Text fontSize="3xl" fontWeight="bold" color={`${statusColor}.600`}>
              {balance.available_days}
            </Text>
            <Text fontSize="sm" color="gray.600">
              days available
            </Text>
          </VStack>

          <VStack align="flex-end" spacing={0}>
            <Text fontSize="sm" color="gray.500">
              {balance.used_days} used
            </Text>
            {balance.pending_days > 0 && (
              <Text fontSize="sm" color="orange.600">
                {balance.pending_days} pending
              </Text>
            )}
          </VStack>
        </HStack>

        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="xs" color="gray.600">
              Utilization
            </Text>
            <Text fontSize="xs" fontWeight="medium" color="gray.700">
              {utilizationPercentage.toFixed(0)}%
            </Text>
          </HStack>
          <Progress
            value={utilizationPercentage}
            size="sm"
            colorScheme={config.color}
            borderRadius="full"
            hasStripe
          />
        </Box>

        {balance.available_days === 0 && !isReapplicable && (
          <Box
            bg="red.50"
            p={2}
            borderRadius="md"
            borderLeft="3px solid"
            borderLeftColor="red.500"
          >
            <Text fontSize="xs" color="red.700" fontWeight="medium">
              No leave days remaining
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};
