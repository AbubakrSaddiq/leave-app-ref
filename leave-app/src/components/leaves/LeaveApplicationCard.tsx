// ============================================
// Leave Application Card Component - COMPLETE
// ============================================
import React from "react";
import {
  Box,
  Card,
  CardBody,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  Divider,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { formatDate } from "@/utils/date.utils";
import type { LeaveApplication, LeaveStatus, LeaveType } from "@/types/models";

interface LeaveApplicationCardProps {
  application: LeaveApplication;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  showActions?: boolean;
}

export function LeaveApplicationCard({
  application,
  onApprove,
  onReject,
  showActions = false,
}: LeaveApplicationCardProps) {
  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case "approved":
        return "green";
      case "rejected":
        return "red";
      case "pending_director":
      case "pending_hr":
        return "yellow";
      default:
        return "gray";
    }
  };

  const getLeaveTypeColor = (type: LeaveType) => {
    switch (type) {
      case "annual":
        return "blue";
      case "sick":
        return "orange";
      case "casual":
        return "purple";
      case "maternity":
        return "pink";
      case "paternity":
        return "cyan";
      default:
        return "gray";
    }
  };

  const formatStatus = (status: LeaveStatus) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Calculate resumption date (day after end_date)
  const getResumptionDate = () => {
    // We create the starting point from the application end_date
    const resumptionDate = new Date(application.end_date);

    // We want the NEXT business day, so we start by adding one day
    let daysToAdd = 1;

    while (daysToAdd > 0) {
      resumptionDate.setDate(resumptionDate.getDate() + 1);
      const dayOfWeek = resumptionDate.getDay();

      // 0 = Sunday, 6 = Saturday
      // Only "consume" the daysToAdd if it's a weekday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysToAdd--;
      }
    }
    return resumptionDate.toISOString().split("T")[0];
  };

  // Get user name - try multiple data structures
  const getUserName = () => {
    console.log("Getting user name for application:", application);
    console.log("User data:", application.user);
    console.log(
      "Full application object:",
      JSON.stringify(application, null, 2),
    );

    // Try all possible locations
    if (application.user?.full_name) {
      console.log(
        "Found name in application.user.full_name:",
        application.user.full_name,
      );
      return application.user.full_name;
    }

    const appAny = application as any;

    if (appAny.user?.full_name) {
      console.log(
        "Found name in appAny.user.full_name:",
        appAny.user.full_name,
      );
      return appAny.user.full_name;
    }

    if (appAny.users?.full_name) {
      console.log(
        "Found name in appAny.users.full_name:",
        appAny.users.full_name,
      );
      return appAny.users.full_name;
    }

    if (appAny.full_name) {
      console.log("Found name in appAny.full_name:", appAny.full_name);
      return appAny.full_name;
    }

    console.warn("No user name found, returning User");
    return "User";
  };

  // Get user email
  const getUserEmail = () => {
    if (application.user?.email) return application.user.email;
    const appAny = application as any;
    if (appAny.user?.email) return appAny.user.email;
    if (appAny.users?.email) return appAny.users.email;
    return null;
  };

  // Get user department
  const getUserDepartment = () => {
    if (application.user?.department?.name) {
      return `${application.user.department.name} (${application.user.department.code})`;
    }
    const appAny = application as any;
    if (appAny.user?.department?.name) {
      return `${appAny.user.department.name} (${appAny.user.department.code})`;
    }
    if (appAny.users?.department?.name) {
      return `${appAny.users.department.name} (${appAny.users.department.code})`;
    }
    return null;
  };

  const userName = getUserName();
  const userEmail = getUserEmail();
  const userDepartment = getUserDepartment();

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card
      mb={4}
      boxShadow="sm"
      _hover={{ boxShadow: "md" }}
      transition="all 0.2s"
    >
      <CardBody>
        <VStack align="stretch" spacing={4}>
          {/* Header */}
          <HStack justify="space-between" flexWrap="wrap">
            <HStack spacing={3}>
              <Badge
                colorScheme={getLeaveTypeColor(application.leave_type)}
                fontSize="sm"
                px={3}
                py={1}
              >
                {application.leave_type.toUpperCase()}
              </Badge>
              <Badge
                colorScheme={getStatusColor(application.status)}
                fontSize="sm"
                px={3}
                py={1}
              >
                {formatStatus(application.status)}
              </Badge>
            </HStack>
            <Text fontSize="xs" color="gray.500" fontFamily="monospace">
              {application.application_number}
            </Text>
          </HStack>

          {/* User Info */}
          <Box bg="gray.50" p={3} borderRadius="md">
            <Text
              fontSize="xs"
              color="gray.600"
              textTransform="uppercase"
              fontWeight="semibold"
              mb={1}
            >
              👤 Applicant
            </Text>
            <Text fontWeight="bold" fontSize="lg" color="gray.800">
              {userName}
            </Text>
            {userEmail && (
              <Text fontSize="sm" color="gray.600">
                {userEmail}
              </Text>
            )}
            {userDepartment && (
              <Text fontSize="sm" color="blue.600" fontWeight="medium" mt={1}>
                🏢 {userDepartment}
              </Text>
            )}
            {application.user_id && (
              <Text
                fontSize="xs"
                color="gray.400"
                fontFamily="monospace"
                mt={1}
              >
                ID: {application.user_id.slice(0, 8)}...
              </Text>
            )}
          </Box>

          <Divider />

          {/* Leave Details - Grid Layout */}
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <GridItem>
              <VStack align="start" spacing={1}>
                <Text
                  fontSize="xs"
                  color="gray.600"
                  textTransform="uppercase"
                  fontWeight="semibold"
                >
                  📅 Start Date
                </Text>
                <Text fontWeight="medium" fontSize="md">
                  {formatDate(application.start_date)}
                </Text>
              </VStack>
            </GridItem>

            <GridItem>
              <VStack align="start" spacing={1}>
                <Text
                  fontSize="xs"
                  color="gray.600"
                  textTransform="uppercase"
                  fontWeight="semibold"
                >
                  📅 End Date
                </Text>
                <Text fontWeight="medium" fontSize="md">
                  {formatDate(application.end_date)}
                </Text>
              </VStack>
            </GridItem>

            <GridItem>
              <VStack align="start" spacing={1}>
                <Text
                  fontSize="xs"
                  color="gray.600"
                  textTransform="uppercase"
                  fontWeight="semibold"
                >
                  🔄 Resumption Date
                </Text>
                <Text fontWeight="medium" fontSize="md" color="green.600">
                  {formatDate(getResumptionDate())}
                </Text>
              </VStack>
            </GridItem>

            <GridItem>
              <VStack align="start" spacing={1}>
                <Text
                  fontSize="xs"
                  color="gray.600"
                  textTransform="uppercase"
                  fontWeight="semibold"
                >
                  ⏱️ Duration
                </Text>
                <Text fontWeight="medium" fontSize="md">
                  {application.working_days} working day
                  {application.working_days !== 1 ? "s" : ""}
                </Text>
              </VStack>
            </GridItem>
          </Grid>

          {/* Submitted Date */}
          {application.submitted_at && (
            <Box bg="blue.50" p={2} borderRadius="md">
              <Text fontSize="xs" color="blue.700" fontWeight="medium">
                📤 Submitted on {formatDate(application.submitted_at)}
              </Text>
            </Box>
          )}

          {/* Reason */}
          {application.reason && (
            <Box>
              <Text
                fontSize="xs"
                color="gray.600"
                textTransform="uppercase"
                fontWeight="semibold"
                mb={2}
              >
                📝 Reason
              </Text>
              <Text
                fontSize="sm"
                bg="gray.50"
                p={3}
                borderRadius="md"
                lineHeight="tall"
              >
                {application.reason}
              </Text>
            </Box>
          )}

          {/* Director Comments */}
          {application.director_comments && (
            <Box
              bg="blue.50"
              p={3}
              borderRadius="md"
              borderLeft="4px solid"
              borderLeftColor="blue.500"
            >
              <Text fontSize="xs" fontWeight="bold" color="blue.800" mb={2}>
                💼 DIRECTOR'S COMMENTS
              </Text>
              <Text fontSize="sm" color="blue.900" mb={2}>
                {application.director_comments}
              </Text>
              {application.director_approved_at && (
                <Text fontSize="xs" color="blue.600">
                  ✓ Approved on {formatDate(application.director_approved_at)}
                </Text>
              )}
            </Box>
          )}

          {/* HR Comments */}
          {application.hr_comments && (
            <Box
              bg="purple.50"
              p={3}
              borderRadius="md"
              borderLeft="4px solid"
              borderLeftColor="purple.500"
            >
              <Text fontSize="xs" fontWeight="bold" color="purple.800" mb={2}>
                👔 HR'S COMMENTS
              </Text>
              <Text fontSize="sm" color="purple.900" mb={2}>
                {application.hr_comments}
              </Text>
              {application.hr_approved_at && (
                <Text fontSize="xs" color="purple.600">
                  ✓ Approved on {formatDate(application.hr_approved_at)}
                </Text>
              )}
            </Box>
          )}

          {/* Actions */}
          {showActions && (
            <>
              <Divider />
              <HStack spacing={3}>
                <Button
                  size="sm"
                  colorScheme="green"
                  onClick={() => onApprove?.(application.id)}
                  flex={1}
                  leftIcon={<span>✓</span>}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => onReject?.(application.id)}
                  flex={1}
                  leftIcon={<span>✕</span>}
                >
                  Reject
                </Button>
              </HStack>
            </>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}
