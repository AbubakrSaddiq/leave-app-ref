import React from "react";
import {
  Box, Card, CardBody, HStack, VStack, Text, Badge, Button, Divider, 
  Grid, GridItem, useDisclosure, Icon, Tooltip
} from "@chakra-ui/react";
import { FiUser, FiCalendar, FiMapPin, FiClock } from "react-icons/fi";
import { formatDisplayDate, calculateResumptionDate } from "@/utils/dateUtils";
import type { LeaveApplication, LeaveStatus, LeaveType } from "@/types/models";
import { ApprovalModal } from "./ApprovalModal";
import { STUDY_PROGRAMS } from "@/constants/leaveConstants";


interface LeaveApplicationCardProps {
  application: LeaveApplication;
  onApprove?: (id: string, comments: string) => void;
  onReject?: (id: string, comments: string) => void;
  showActions?: boolean;
}

export const LeaveApplicationCard: React.FC<LeaveApplicationCardProps> = ({
  application,
  onApprove,
  onReject,
  showActions = false,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [actionType, setActionType] = React.useState<"approve" | "reject">("approve");

  // Simplified User Data Access
  const user = application.user || (application as any).users;
  const userName = user?.full_name || "Unknown Applicant";
  const userDept = user?.department ? `${user.department.name} (${user.department.code})` : null;

  const handleOpenModal = (type: "approve" | "reject") => {
    setActionType(type);
    onOpen();
  };

  const handleConfirmAction = (comments: string) => {
    if (actionType === "approve") {
      onApprove?.(application.id, comments);
    } else {
      onReject?.(application.id, comments);
    }
    onClose();
  };

  return (
    <Card variant="outline" boxShadow="sm" _hover={{ boxShadow: "md", borderColor: "blue.200" }} transition="all 0.2s">
      <CardBody>
        <VStack align="stretch" spacing={4}>
          {/* Top Row: Type & Status */}
          <HStack justify="space-between">
            <HStack spacing={2}>
              <Badge colorScheme={getLeaveTypeColor(application.leave_type)} variant="subtle">
                {application.leave_type}
              </Badge>
              <Badge colorScheme={getStatusColor(application.status)} variant="solid" borderRadius="full">
                {application.status.replace("_", " ")}
              </Badge>
            </HStack>
            <Text fontSize="xs" color="gray.400" fontFamily="mono">#{application.application_number}</Text>
            {/* Study Program Badge (if study leave) */}
          {application.leave_type === 'study' && application.study_program && (
            <Badge colorScheme="purple" variant="subtle">
              <Icon as={FiBook} mr={1} />
              {STUDY_PROGRAMS.find(p => p.value === application.study_program)?.label}
            </Badge>
          )}
          </HStack>

        

          {/* User Header */}
          <Box p={3} bg="gray.50" borderRadius="lg">
            <HStack>
              <Icon as={FiUser} color="blue.500" />
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="md" lineHeight="shorter">{userName}</Text>
                {userDept && <Text fontSize="xs" color="gray.600">{userDept}</Text>}
              </VStack>
            </HStack>
          </Box>

          {/* Leave Metrics Grid */}
          <Grid templateColumns="repeat(2, 1fr)" gap={3}>
            <DataPoint icon={FiCalendar} label="Starts" value={formatDisplayDate(application.start_date)} />
            <DataPoint icon={FiCalendar} label="Ends" value={formatDisplayDate(application.end_date)} />
            <DataPoint icon={FiClock} label="Duration" value={`${application.working_days} Days`} />
            <DataPoint 
              icon={FiMapPin} 
              label="Resumption" 
              value={formatDisplayDate(calculateResumptionDate(application.end_date))} 
              color="green.600" 
            />
                      {application.leave_type === 'study' ? (
            <>
              <DataPoint 
                icon={FiCalendar} 
                label="Program" 
                value={STUDY_PROGRAMS.find(p => p.value === application.study_program)?.label || 'N/A'} 
              />
              <DataPoint 
                icon={FiClock} 
                label="Duration" 
                value={STUDY_PROGRAMS.find(p => p.value === application.study_program)?.duration || 'N/A'} 
                color="purple.600"
              />
            </>
          ) : (
            <DataPoint icon={FiClock} label="Duration" value={`${application.working_days} Days`} />
          )}
          </Grid>

          {/* Application Reason */}
          <Box>
            <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1} textTransform="uppercase">Reason</Text>
            <Text fontSize="sm" color="gray.700" noOfLines={3} bg="gray.25" p={2} borderRadius="md" border="1px solid" borderColor="gray.100">
              {application.reason || "No reason provided."}
            </Text>
          </Box>

          {/* Comments Sections (Director/HR) */}
          <ApprovalComment role="Director" comment={application.director_comments} date={application.director_approved_at} />
          <ApprovalComment role="HR" comment={application.hr_comments} date={application.hr_approved_at} />

          {/* Action Buttons */}
          {showActions && (
            <HStack spacing={3} pt={2}>
              <Button size="sm" colorScheme="green" flex={1} onClick={() => handleOpenModal("approve")}>Approve</Button>
              <Button size="sm" colorScheme="red" variant="outline" flex={1} onClick={() => handleOpenModal("reject")}>Reject</Button>
            </HStack>
          )}

          <ApprovalModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={handleConfirmAction}
            type={actionType}
            applicationNumber={application.application_number}
          />
        </VStack>
      </CardBody>
    </Card>
  );
};

// --- Internal Helper Components ---

const DataPoint = ({ icon, label, value, color = "gray.800" }: any) => (
  <GridItem>
    <HStack spacing={2}>
      <Icon as={icon} fontSize="xs" color="gray.400" />
      <VStack align="start" spacing={0}>
        <Text fontSize="10px" color="gray.500" fontWeight="bold" textTransform="uppercase">{label}</Text>
        <Text fontSize="xs" fontWeight="bold" color={color}>{value}</Text>
      </VStack>
    </HStack>
  </GridItem>
);

const ApprovalComment = ({ role, comment, date }: any) => {
  if (!comment) return null;
  const isHR = role === "HR";
  return (
    <Box p={2} bg={isHR ? "purple.50" : "blue.50"} borderRadius="md" borderLeft="3px solid" borderLeftColor={isHR ? "purple.400" : "blue.400"}>
      <Text fontSize="10px" fontWeight="black" color={isHR ? "purple.700" : "blue.700"}>{role.toUpperCase()} FEEDBACK</Text>
      <Text fontSize="xs" color="gray.800" my={1}>{comment}</Text>
      {date && <Text fontSize="10px" color="gray.500 italic">Commented on {formatDisplayDate(date)}</Text>}
    </Box>
  );
};

const getStatusColor = (status: LeaveStatus) => {
  const colors: Record<string, string> = {
    approved: "green",
    rejected: "red",
    pending_director: "orange",
    pending_hr: "purple",
  };
  return colors[status] || "gray";
};

const getLeaveTypeColor = (type: LeaveType) => {
  const colors: Record<string, string> = {
    annual: "blue",
    sick: "red",
    casual: "orange",
    maternity: "pink",
    paternity: "cyan",
  };
  return colors[type] || "gray";
};