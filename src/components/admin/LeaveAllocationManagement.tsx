// ============================================
// LeaveAllocationManagement
// Admin/HR tab: view all staff balances,
// edit allocated_days inline, re-run allocations
// ============================================

import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  Heading,
  HStack,
  VStack,
  Text,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Avatar,
  Spinner,
  Center,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Tooltip,
  Progress,
  Alert,
  AlertIcon,
  AlertDescription,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useDisclosure,
  Collapse,
  IconButton,
  Tag,
  TagLabel,
} from "@chakra-ui/react";
import {
  FiRefreshCw,
  FiSearch,
  FiUsers,
  FiAlertCircle,
  FiChevronDown,
  FiChevronRight,
  FiCalendar,
} from "react-icons/fi";
import {
  useAllStaffLeaveBalances,
  useRerunAllocationForUser,
  useRerunAllocationForAll,
} from "@/hooks/useLeaveAllocation";
import { EditableAllocationCell } from "./EditableAllocationCell";
import type { StaffLeaveBalance } from "@/api/leaveAllocation.api";
import { LeaveType } from "@/types/models";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const LEAVE_TYPE_COLORS: Record<string, string> = {
  annual: "blue",
  casual: "green",
  sick: "red",
  maternity: "pink",
  paternity: "cyan",
  study: "orange",
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Annual",
  casual: "Casual",
  sick: "Sick",
  maternity: "Maternity",
  paternity: "Paternity",
  study: "Study",
};

// ─────────────────────────────────────────────────────────────────────────────
// STAFF ROW — expandable
// ─────────────────────────────────────────────────────────────────────────────

interface StaffRowProps {
  staff: StaffLeaveBalance;
  year: number;
}

const StaffRow: React.FC<StaffRowProps> = ({ staff, year }) => {
  const [expanded, setExpanded] = useState(false);
  const rerunMutation = useRerunAllocationForUser();

  const hasBalances = staff.balances.length > 0;
  const totalAllocated = staff.balances.reduce(
    (s, b) => s + b.allocated_days,
    0,
  );
  const totalUsed = staff.balances.reduce((s, b) => s + b.used_days, 0);
  const totalAvailable = staff.balances.reduce(
    (s, b) => s + b.available_days,
    0,
  );

  const handleRerun = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await rerunMutation.mutateAsync({ userId: staff.user_id, year });
  };

  return (
    <>
      {/* ── Summary row ── */}
      <Tr
        _hover={{ bg: "gray.50" }}
        cursor="pointer"
        onClick={() => setExpanded((v) => !v)}
        bg={expanded ? "blue.50" : "white"}
      >
        <Td w="32px" px={2}>
          <Icon
            as={expanded ? FiChevronDown : FiChevronRight}
            color="gray.400"
            boxSize={4}
          />
        </Td>

        <Td>
          <HStack spacing={3}>
            <Avatar size="xs" name={staff.full_name} />
            <Box>
              <Text fontWeight="bold" fontSize="sm" lineHeight="shorter">
                {staff.full_name}
              </Text>
              <Text fontSize="10px" color="gray.500">
                {staff.email}
              </Text>
            </Box>
          </HStack>
        </Td>

        <Td>
          {staff.department_code ? (
            <Badge variant="subtle" colorScheme="purple" fontFamily="mono">
              {staff.department_code}
            </Badge>
          ) : (
            <Text fontSize="xs" color="gray.400">
              —
            </Text>
          )}
        </Td>

        <Td>
          <Text fontSize="xs" color="gray.600">
            {staff.designation_name ?? "—"}
          </Text>
        </Td>

        {/* Balance summary chips */}
        <Td>
          {!hasBalances ? (
            <Badge colorScheme="orange" variant="subtle" fontSize="10px">
              No balances
            </Badge>
          ) : (
            <HStack spacing={2} flexWrap="wrap">
              <Tag size="sm" colorScheme="blue" variant="subtle">
                <TagLabel>{totalAllocated} alloc.</TagLabel>
              </Tag>
              <Tag size="sm" colorScheme="orange" variant="subtle">
                <TagLabel>{totalUsed} used</TagLabel>
              </Tag>
              <Tag size="sm" colorScheme="green" variant="subtle">
                <TagLabel>{totalAvailable} avail.</TagLabel>
              </Tag>
            </HStack>
          )}
        </Td>

        <Td textAlign="right" onClick={(e) => e.stopPropagation()}>
          <Tooltip label={`Re-run auto-allocation for ${year}`}>
            <Button
              size="xs"
              leftIcon={<FiRefreshCw />}
              variant="outline"
              colorScheme="blue"
              isLoading={rerunMutation.isPending}
              loadingText="Running…"
              onClick={handleRerun}
            >
              Re-run
            </Button>
          </Tooltip>
        </Td>
      </Tr>

      {/* ── Expanded balance detail rows ── */}
      {expanded && (
        <>
          {!hasBalances ? (
            <Tr bg="gray.25">
              <Td colSpan={6} pl={12} py={3}>
                <HStack spacing={2} color="orange.600">
                  <Icon as={FiAlertCircle} boxSize={4} />
                  <Text fontSize="sm">
                    No leave balances found for {year}. Use "Re-run" to
                    allocate.
                  </Text>
                </HStack>
              </Td>
            </Tr>
          ) : (
            staff.balances.map((balance) => {
              const utilPct =
                balance.allocated_days > 0
                  ? Math.round(
                      (balance.used_days / balance.allocated_days) * 100,
                    )
                  : 0;

              return (
                <Tr key={balance.id} bg="blue.25" _hover={{ bg: "blue.50" }}>
                  {/* indent */}
                  <Td colSpan={2} pl={14}>
                    <Badge
                      colorScheme={
                        LEAVE_TYPE_COLORS[balance.leave_type] ?? "gray"
                      }
                      variant="subtle"
                      px={2}
                      py={0.5}
                    >
                      {LEAVE_TYPE_LABELS[balance.leave_type] ??
                        balance.leave_type}
                    </Badge>
                  </Td>

                  {/* Allocated (editable) */}
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text
                        fontSize="9px"
                        color="gray.500"
                        fontWeight="bold"
                        textTransform="uppercase"
                        mb={1}
                      >
                        Allocated (click to edit)
                      </Text>
                      <EditableAllocationCell balance={balance} />
                    </VStack>
                  </Td>

                  {/* Used / Pending / Available */}
                  <Td>
                    <HStack spacing={3}>
                      <Stat
                        label="Used"
                        value={balance.used_days}
                        color="orange.600"
                      />
                      <Stat
                        label="Pending"
                        value={balance.pending_days}
                        color="purple.600"
                      />
                      <Stat
                        label="Available"
                        value={balance.available_days}
                        color="green.600"
                      />
                    </HStack>
                  </Td>

                  {/* Utilisation bar */}
                  <Td colSpan={2} minW="150px">
                    <VStack align="stretch" spacing={1}>
                      <HStack justify="space-between">
                        <Text fontSize="10px" color="gray.500">
                          Utilisation
                        </Text>
                        <Text
                          fontSize="10px"
                          fontWeight="bold"
                          color="gray.700"
                        >
                          {utilPct}%
                        </Text>
                      </HStack>
                      <Progress
                        value={utilPct}
                        size="xs"
                        colorScheme={
                          utilPct >= 90
                            ? "red"
                            : utilPct >= 60
                              ? "orange"
                              : "green"
                        }
                        borderRadius="full"
                      />
                    </VStack>
                  </Td>
                </Tr>
              );
            })
          )}
        </>
      )}
    </>
  );
};

// Tiny read-only stat cell
const Stat = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <VStack spacing={0} align="center" minW="40px">
    <Text
      fontSize="10px"
      color="gray.400"
      fontWeight="bold"
      textTransform="uppercase"
    >
      {label}
    </Text>
    <Text fontSize="sm" fontWeight="bold" color={color}>
      {value}
    </Text>
  </VStack>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function LeaveAllocationManagement() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [search, setSearch] = useState("");

  // Confirm dialog for bulk re-run
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null!);

  const {
    data: staffList,
    isLoading,
    error,
    refetch,
  } = useAllStaffLeaveBalances(year);
  const rerunAllMutation = useRerunAllocationForAll();

  // Filter by search
  const filtered = (staffList ?? []).filter((s) => {
    const q = search.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.department_code ?? "").toLowerCase().includes(q) ||
      (s.department_name ?? "").toLowerCase().includes(q)
    );
  });

  const noBalanceCount = (staffList ?? []).filter(
    (s) => s.balances.length === 0,
  ).length;

  const handleBulkRerun = async () => {
    onClose();
    await rerunAllMutation.mutateAsync(year);
  };

  // ── Year options: previous, current, next ──
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <VStack align="stretch" spacing={6}>
      {/* ── Header ── */}
      <HStack justify="space-between" flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="md">Leave Allocation Management</Heading>
          <Text fontSize="sm" color="gray.500" mt={1}>
            View and adjust staff leave allocations. Click a row to expand
            balances.
          </Text>
        </Box>

        <HStack spacing={3}>
          {/* Year selector */}
          <HStack spacing={2}>
            <Icon as={FiCalendar} color="gray.500" />
            <Select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              size="sm"
              w="120px"
              bg="white"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </HStack>

          <Button
            leftIcon={<FiRefreshCw />}
            size="sm"
            variant="outline"
            onClick={() => refetch()}
          >
            Refresh
          </Button>

          <Button
            leftIcon={<FiUsers />}
            size="sm"
            colorScheme="blue"
            onClick={onOpen}
            isLoading={rerunAllMutation.isPending}
            loadingText="Running…"
          >
            Re-run All ({year})
          </Button>
        </HStack>
      </HStack>

      {/* ── Warning: staff without balances ── */}
      {noBalanceCount > 0 && (
        <Alert status="warning" borderRadius="md" fontSize="sm">
          <AlertIcon />
          <AlertDescription>
            <strong>{noBalanceCount}</strong> staff member
            {noBalanceCount !== 1 ? "s have" : " has"} no leave balances for{" "}
            <strong>{year}</strong>. Use "Re-run" per staff or "Re-run All" to
            allocate.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Search bar ── */}
      <InputGroup maxW="400px">
        <InputLeftElement children={<Icon as={FiSearch} color="gray.400" />} />
        <Input
          placeholder="Search by name, email or department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          bg="white"
          size="sm"
        />
      </InputGroup>

      {/* ── Table ── */}
      <Box
        bg="white"
        borderRadius="xl"
        border="1px solid"
        borderColor="gray.100"
        shadow="sm"
        overflow="hidden"
      >
        {isLoading ? (
          <Center py={20}>
            <VStack spacing={4}>
              <Spinner color="blue.500" />
              <Text color="gray.500">Loading staff balances…</Text>
            </VStack>
          </Center>
        ) : error ? (
          <Center py={20}>
            <VStack spacing={3}>
              <Icon as={FiAlertCircle} boxSize={8} color="red.400" />
              <Text color="red.500">
                Failed to load balances. Please refresh.
              </Text>
              <Button size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </VStack>
          </Center>
        ) : filtered.length === 0 ? (
          <Center py={20}>
            <VStack spacing={2}>
              <Icon as={FiUsers} boxSize={8} color="gray.300" />
              <Text color="gray.500">
                {search
                  ? "No staff match your search."
                  : `No active staff found.`}
              </Text>
            </VStack>
          </Center>
        ) : (
          <Table variant="simple" size="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th w="32px" px={2} />
                <Th>Staff Member</Th>
                <Th>Dept</Th>
                <Th>Designation</Th>
                <Th>Balance Summary</Th>
                <Th textAlign="right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((staff) => (
                <StaffRow key={staff.user_id} staff={staff} year={year} />
              ))}
            </Tbody>
          </Table>
        )}
      </Box>

      {/* ── Footer count ── */}
      {!isLoading && filtered.length > 0 && (
        <Text fontSize="xs" color="gray.400" textAlign="right">
          Showing {filtered.length} of {staffList?.length ?? 0} active staff •{" "}
          {year}
        </Text>
      )}

      {/* ── Bulk re-run confirmation dialog ── */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay backdropFilter="blur(2px)">
          <AlertDialogContent borderRadius="xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Re-run Allocation for All Staff
            </AlertDialogHeader>
            <AlertDialogBody>
              This will recalculate leave balances for{" "}
              <strong>all active staff</strong> for <strong>{year}</strong>{" "}
              using the standard allocation rules. Existing <em>used</em> and{" "}
              <em>pending</em> days will not be affected.
              <br />
              <br />
              Continue?
            </AlertDialogBody>
            <AlertDialogFooter bg="gray.50" borderBottomRadius="xl">
              <Button ref={cancelRef} onClick={onClose} variant="ghost">
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                ml={3}
                onClick={handleBulkRerun}
                isLoading={rerunAllMutation.isPending}
              >
                Yes, Re-run All
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
}
