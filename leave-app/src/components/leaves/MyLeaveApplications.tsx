// ============================================
// My Leave Applications Component - COMPLETE
// ============================================
import React from "react";
import {
  Box,
  Heading,
  Text,
  Spinner,
  VStack,
  HStack,
  Select,
  Button,
  SimpleGrid,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { getLeaveApplications } from "@/api/leaves.api";
import { LeaveApplicationCard } from "./LeaveApplicationCard";
import { supabase } from "@/lib/supabase";
import type { LeaveStatus } from "@/types/models";

export function MyLeaveApplications() {
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<LeaveStatus | "all">(
    "all",
  );

  // Get current user ID on mount
  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);
      } else {
        console.warn("No authenticated user found");
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch leave applications for current user ONLY
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-leave-applications", currentUserId, statusFilter],
    queryFn: () => {
      return getLeaveApplications({
        user_id: currentUserId!, // CRITICAL: Filter by current user only
        status: statusFilter === "all" ? undefined : statusFilter,
        sort_by: "submitted_at",
        sort_order: "desc",
      });
    },
    enabled: !!currentUserId, // Only run query when we have user ID
  });

  // Show loading state while fetching user ID
  if (!currentUserId) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" />
        <Text mt={4} color="gray.600">
          Loading user data...
        </Text>
      </Box>
    );
  }

  // Show loading state while fetching applications
  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" />
        <Text mt={4} color="gray.600">
          Loading your applications...
        </Text>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="red.500" fontSize="lg" mb={4}>
          ❌ Failed to load your applications
        </Text>
        <Text color="gray.600" mb={4}>
          {(error as Error).message}
        </Text>
        <Button colorScheme="blue" onClick={() => refetch()}>
          Try Again
        </Button>
      </Box>
    );
  }

  const applications = data?.data || [];
  const totalApplications = data?.pagination.total || 0;

  return (
    <VStack align="stretch" spacing={6}>
      {/* Header */}
      <HStack justify="space-between" flexWrap="wrap">
        <Box>
          <Heading size="md">My Leave Applications</Heading>
          <Text color="gray.600" fontSize="sm" mt={1}>
            {totalApplications} application{totalApplications !== 1 ? "s" : ""}{" "}
            found
          </Text>
        </Box>

        {/* Filter by status */}
        <HStack spacing={3}>
          <Text fontSize="sm" color="gray.600">
            Filter:
          </Text>
          <Select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as LeaveStatus | "all")
            }
            size="sm"
            width="200px"
          >
            <option value="all">All Status</option>
            <option value="pending_director">Pending Director</option>
            <option value="pending_hr">Pending HR</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            🔄 Refresh
          </Button>
        </HStack>
      </HStack>

      {/* Applications List */}
      {applications.length === 0 ? (
        <Box
          textAlign="center"
          py={16}
          bg="gray.50"
          borderRadius="lg"
          borderWidth="2px"
          borderStyle="dashed"
          borderColor="gray.300"
        >
          <Text fontSize="3xl" mb={2}>
            📋
          </Text>
          <Text fontSize="lg" fontWeight="medium" color="gray.700" mb={2}>
            No applications found
          </Text>
          <Text color="gray.500" fontSize="sm">
            {statusFilter === "all"
              ? "You haven't submitted any leave applications yet"
              : `No ${statusFilter.replace("_", " ")} applications found`}
          </Text>
        </Box>
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
}
