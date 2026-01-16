// ============================================
// Leave Application Card Component - UPDATED
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
    const endDate = new Date(application.end_date);
    endDate.setDate(endDate.getDate() + 1);
    return endDate.toISOString().split("T")[0];
  };

  // Get user name - check multiple possible locations
  const getUserName = () => {
    // Try different possible data structures
    if (application.user?.full_name) return application.user.full_name;
    if ((application as any).user?.full_name)
      return (application as any).user.full_name;
    if ((application as any).users?.full_name)
      return (application as any).users.full_name;

    // Fallback: try to get from user_id
    return "User";
  };

  return (
    <Card mb={4} boxShadow="sm" _hover={{ boxShadow: "md" }}>
      <CardBody>
        <VStack align="stretch" spacing={4}>
          {/* Header */}
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Badge
                colorScheme={getLeaveTypeColor(application.leave_type)}
                fontSize="sm"
              >
                {application.leave_type.toUpperCase()}
              </Badge>
              <Badge
                colorScheme={getStatusColor(application.status)}
                fontSize="sm"
              >
                {formatStatus(application.status)}
              </Badge>
            </HStack>
            <Text fontSize="xs" color="gray.500" fontFamily="monospace">
              {application.application_number}
            </Text>
          </HStack>

          {/* User Info */}
          <Box>
            <Text
              fontSize="xs"
              color="gray.600"
              textTransform="uppercase"
              fontWeight="semibold"
            >
              Applicant
            </Text>
            <Text fontWeight="medium" fontSize="md">
              {getUserName()}
            </Text>
            {application.user_id && (
              <Text fontSize="xs" color="gray.400" fontFamily="monospace">
                ID: {application.user_id.slice(0, 8)}...
              </Text>
            )}
          </Box>

          <Divider />

          {/* Leave Details - Grid Layout */}
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <GridItem>
              <Text
                fontSize="xs"
                color="gray.600"
                textTransform="uppercase"
                fontWeight="semibold"
              >
                Start Date
              </Text>
              <Text fontWeight="medium">
                {formatDate(application.start_date)}
              </Text>
            </GridItem>

            <GridItem>
              <Text
                fontSize="xs"
                color="gray.600"
                textTransform="uppercase"
                fontWeight="semibold"
              >
                End Date
              </Text>
              <Text fontWeight="medium">
                {formatDate(application.end_date)}
              </Text>
            </GridItem>

            <GridItem>
              <Text
                fontSize="xs"
                color="gray.600"
                textTransform="uppercase"
                fontWeight="semibold"
              >
                Resumption Date
              </Text>
              <Text fontWeight="medium" color="green.600">
                {formatDate(getResumptionDate())}
              </Text>
            </GridItem>

            <GridItem>
              <Text
                fontSize="xs"
                color="gray.600"
                textTransform="uppercase"
                fontWeight="semibold"
              >
                Duration
              </Text>
              <Text fontWeight="medium">
                {application.working_days} working day
                {application.working_days !== 1 ? "s" : ""}
              </Text>
            </GridItem>
          </Grid>

          {/* Submitted Date */}
          {application.submitted_at && (
            <Box bg="gray.50" p={2} borderRadius="md">
              <Text fontSize="xs" color="gray.600">
                Submitted on {formatDate(application.submitted_at)}
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
                mb={1}
              >
                Reason
              </Text>
              <Text fontSize="sm" bg="gray.50" p={3} borderRadius="md">
                {application.reason}
              </Text>
            </Box>
          )}

          {/* Comments */}
          {application.director_comments && (
            <Box
              bg="blue.50"
              p={3}
              borderRadius="md"
              borderLeft="4px solid"
              borderLeftColor="blue.500"
            >
              <Text fontSize="xs" fontWeight="bold" color="blue.800" mb={1}>
                💼 DIRECTOR'S COMMENTS
              </Text>
              <Text fontSize="sm" color="blue.700">
                {application.director_comments}
              </Text>
              {application.director_approved_at && (
                <Text fontSize="xs" color="blue.600" mt={2}>
                  Approved on {formatDate(application.director_approved_at)}
                </Text>
              )}
            </Box>
          )}

          {application.hr_comments && (
            <Box
              bg="purple.50"
              p={3}
              borderRadius="md"
              borderLeft="4px solid"
              borderLeftColor="purple.500"
            >
              <Text fontSize="xs" fontWeight="bold" color="purple.800" mb={1}>
                👔 HR'S COMMENTS
              </Text>
              <Text fontSize="sm" color="purple.700">
                {application.hr_comments}
              </Text>
              {application.hr_approved_at && (
                <Text fontSize="xs" color="purple.600" mt={2}>
                  Approved on {formatDate(application.hr_approved_at)}
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
                >
                  ✓ Approve
                </Button>
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => onReject?.(application.id)}
                  flex={1}
                >
                  ✕ Reject
                </Button>
              </HStack>
            </>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}

// // ============================================
// // Leave Application Card Component
// // Displays individual leave application
// // ============================================

// import React from "react";
// import {
//   Box,
//   HStack,
//   VStack,
//   Text,
//   Badge,
//   Button,
//   Icon,
//   Divider,
//   useDisclosure,
// } from "@chakra-ui/react";
// import {
//   FiCalendar,
//   FiUser,
//   FiClock,
//   FiCheckCircle,
//   FiXCircle,
// } from "react-icons/fi";
// import type { LeaveApplication, LeaveStatus, LeaveType } from "@/types/models";
// import { formatDate, formatDateRange } from "@/utils/date.utils";
// import { ApprovalModal } from "./ApprovalModal";

// const LEAVE_TYPE_CONFIG: Record<LeaveType, { label: string; color: string }> = {
//   annual: { label: "Annual", color: "blue" },
//   casual: { label: "Casual", color: "green" },
//   sick: { label: "Sick", color: "red" },
//   maternity: { label: "Maternity", color: "purple" },
//   paternity: { label: "Paternity", color: "orange" },
// };

// const STATUS_CONFIG: Record<LeaveStatus, { label: string; color: string }> = {
//   draft: { label: "Draft", color: "gray" },
//   pending_director: { label: "Pending Director", color: "yellow" },
//   pending_hr: { label: "Pending HR", color: "orange" },
//   approved: { label: "Approved", color: "green" },
//   rejected: { label: "Rejected", color: "red" },
// };

// interface LeaveApplicationCardProps {
//   application: LeaveApplication;
//   showActions?: boolean;
//   onApprove?: (id: string, comments?: string) => void;
//   onReject?: (id: string, comments: string) => void;
// }

// export const LeaveApplicationCard: React.FC<LeaveApplicationCardProps> = ({
//   application,
//   showActions = false,
//   onApprove,
//   onReject,
// }) => {
//   const {
//     isOpen: isApproveOpen,
//     onOpen: onApproveOpen,
//     onClose: onApproveClose,
//   } = useDisclosure();
//   const {
//     isOpen: isRejectOpen,
//     onOpen: onRejectOpen,
//     onClose: onRejectClose,
//   } = useDisclosure();

//   const leaveConfig = LEAVE_TYPE_CONFIG[application.leave_type];
//   const statusConfig = STATUS_CONFIG[application.status];

//   const handleApprove = (comments?: string) => {
//     if (onApprove) {
//       onApprove(application.id, comments);
//       onApproveClose();
//     }
//   };

//   const handleReject = (comments: string) => {
//     if (onReject) {
//       onReject(application.id, comments);
//       onRejectClose();
//     }
//   };

//   return (
//     <>
//       <Box
//         bg="white"
//         borderRadius="lg"
//         boxShadow="md"
//         p={5}
//         borderLeft="4px solid"
//         borderLeftColor={`${leaveConfig.color}.500`}
//         _hover={{ boxShadow: "lg" }}
//         transition="all 0.2s"
//       >
//         <VStack spacing={4} align="stretch">
//           {/* Header */}
//           <HStack justify="space-between" align="flex-start">
//             <VStack align="flex-start" spacing={1}>
//               <HStack>
//                 <Badge colorScheme={leaveConfig.color} fontSize="sm">
//                   {leaveConfig.label}
//                 </Badge>
//                 <Badge colorScheme={statusConfig.color} fontSize="sm">
//                   {statusConfig.label}
//                 </Badge>
//               </HStack>
//               <Text fontSize="xs" color="gray.500">
//                 {application.application_number}
//               </Text>
//             </VStack>

//             <Text fontSize="sm" fontWeight="bold" color="blue.600">
//               {application.working_days} days
//             </Text>
//           </HStack>

//           <Divider />

//           {/* User Info */}
//           <HStack spacing={2}>
//             <Icon as={FiUser} color="gray.500" />
//             <Text fontSize="sm" fontWeight="medium">
//               {(application as any).user?.full_name || "Unknown User"}
//             </Text>
//           </HStack>

//           {/* Date Range */}
//           <HStack spacing={2}>
//             <Icon as={FiCalendar} color="gray.500" />
//             <Text fontSize="sm">
//               {formatDateRange(application.start_date, application.end_date)}
//             </Text>
//           </HStack>

//           {/* Submitted Date */}
//           {application.submitted_at && (
//             <HStack spacing={2}>
//               <Icon as={FiClock} color="gray.500" />
//               <Text fontSize="sm" color="gray.600">
//                 Submitted {formatDate(application.submitted_at)}
//               </Text>
//             </HStack>
//           )}

//           {/* Reason */}
//           <Box bg="gray.50" p={3} borderRadius="md">
//             <Text fontSize="xs" fontWeight="bold" color="gray.700" mb={1}>
//               Reason:
//             </Text>
//             <Text fontSize="sm" color="gray.700">
//               {application.reason}
//             </Text>
//           </Box>

//           {/* Comments if rejected */}
//           {application.status === "rejected" && (
//             <Box
//               bg="red.50"
//               p={3}
//               borderRadius="md"
//               borderLeft="3px solid"
//               borderLeftColor="red.500"
//             >
//               <Text fontSize="xs" fontWeight="bold" color="red.700" mb={1}>
//                 Rejection Comments:
//               </Text>
//               <Text fontSize="sm" color="red.700">
//                 {application.director_comments ||
//                   application.hr_comments ||
//                   "No comments provided"}
//               </Text>
//             </Box>
//           )}

//           {/* Action Buttons */}
//           {showActions && (
//             <HStack spacing={3} pt={2}>
//               <Button
//                 leftIcon={<Icon as={FiCheckCircle} />}
//                 colorScheme="green"
//                 size="sm"
//                 onClick={onApproveOpen}
//                 flex={1}
//               >
//                 Approve
//               </Button>
//               <Button
//                 leftIcon={<Icon as={FiXCircle} />}
//                 colorScheme="red"
//                 variant="outline"
//                 size="sm"
//                 onClick={onRejectOpen}
//                 flex={1}
//               >
//                 Reject
//               </Button>
//             </HStack>
//           )}
//         </VStack>
//       </Box>

//       {/* Modals */}
//       <ApprovalModal
//         isOpen={isApproveOpen}
//         onClose={onApproveClose}
//         onConfirm={handleApprove}
//         type="approve"
//         applicationNumber={application.application_number}
//       />

//       <ApprovalModal
//         isOpen={isRejectOpen}
//         onClose={onRejectClose}
//         onConfirm={handleReject}
//         type="reject"
//         applicationNumber={application.application_number}
//       />
//     </>
//   );
// };
