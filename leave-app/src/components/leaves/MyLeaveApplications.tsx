// ============================================
// My Leave Applications Component
// Shows user's submitted applications
// ============================================

import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Select,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  SimpleGrid,
} from "@chakra-ui/react";
import { useMyLeaveApplications } from "@/hooks/useLeaveApplication";
import { LeaveApplicationCard } from "./LeaveApplicationCard";
import type { LeaveStatus } from "@/types/models";

export const MyLeaveApplications: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "all">("all");

  const queryParams = statusFilter === "all" ? {} : { status: statusFilter };
  const { data, isLoading, error } = useMyLeaveApplications(queryParams);

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text mt={4} color="gray.600">
          Loading your applications...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <AlertDescription>
          Failed to load applications. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const applications = data?.data || [];

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between" align="center">
        <Box>
          <Heading size="lg" mb={2}>
            My Leave Applications
          </Heading>
          <Text color="gray.600">
            View and track your submitted leave requests
          </Text>
        </Box>

        <Select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as LeaveStatus | "all")
          }
          width="200px"
          size="lg"
        >
          <option value="all">All Applications</option>
          <option value="pending_director">Pending Director</option>
          <option value="pending_hr">Pending HR</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </HStack>

      {applications.length === 0 ? (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <AlertDescription>
            No leave applications found. Submit your first application to get
            started!
          </AlertDescription>
        </Alert>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {applications.map((application) => (
            <LeaveApplicationCard
              key={application.id}
              application={application}
              showActions={false}
            />
          ))}
        </SimpleGrid>
      )}
    </VStack>
  );
};
