// ============================================
// Leave Application Form Component
// ============================================

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Select,
  Textarea,
  VStack,
  HStack,
  Input,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Text,
  Divider,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Spinner,
  Badge,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useCreateLeaveApplication } from "@/hooks/useLeaveApplication";
import { useMyLeaveBalances } from "@/hooks/useLeaveBalance";
import { LeaveType } from "@/types/models";
import { format, addDays } from "date-fns";
import { supabase } from "@/lib/supabase";

const LEAVE_TYPE_OPTIONS = [
  {
    value: "annual",
    label: "Annual Leave",
    description: "30 days/year - 14 days notice",
  },
  {
    value: "casual",
    label: "Casual Leave",
    description: "7 days/year - 14 days notice",
  },
  {
    value: "sick",
    label: "Sick Leave",
    description: "10 days/year (reapplicable) - No notice",
  },
  {
    value: "maternity",
    label: "Maternity Leave",
    description: "16 weeks - 4 weeks notice",
  },
  {
    value: "paternity",
    label: "Paternity Leave",
    description: "14 days - 14 days notice",
  },
];

interface FormData {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
}

interface LeaveApplicationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate end date from start date + working days
 * Skips weekends and public holidays
 */
async function calculateEndDate(
  startDate: string,
  workingDays: number,
): Promise<string> {
  if (!startDate || workingDays <= 0) return "";

  try {
    // Get public holidays from database
    const year = new Date(startDate).getFullYear();
    const { data: holidays } = await supabase
      .from("public_holidays")
      .select("date")
      .eq("year", year)
      .eq("is_active", true);

    const holidayDates = new Set(holidays?.map((h) => h.date) || []);

    let currentDate = new Date(startDate);
    let daysAdded = 0;

    while (daysAdded < workingDays) {
      const dayOfWeek = currentDate.getDay();
      const dateString = currentDate.toISOString().split("T")[0];

      // Check if it's a weekday and not a holiday
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateString)) {
        daysAdded++;
      }

      // If we haven't reached the target, move to next day
      if (daysAdded < workingDays) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return currentDate.toISOString().split("T")[0];
  } catch (error) {
    console.error("Error calculating end date:", error);
    return "";
  }
}

/**
 * Calculate resumption date (next business day after end date)
 */
async function calculateResumptionDate(endDate: string): Promise<string> {
  if (!endDate) return "";

  try {
    // Get public holidays
    const year = new Date(endDate).getFullYear();
    const { data: holidays } = await supabase
      .from("public_holidays")
      .select("date")
      .eq("year", year)
      .eq("is_active", true);

    const holidayDates = new Set(holidays?.map((h) => h.date) || []);

    let resumptionDate = new Date(endDate);
    resumptionDate.setDate(resumptionDate.getDate() + 1);

    // Find next business day
    while (true) {
      const dayOfWeek = resumptionDate.getDay();
      const dateString = resumptionDate.toISOString().split("T")[0];

      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateString)) {
        break;
      }

      resumptionDate.setDate(resumptionDate.getDate() + 1);
    }

    return resumptionDate.toISOString().split("T")[0];
  } catch (error) {
    console.error("Error calculating resumption date:", error);
    return "";
  }
}

/**
 * Format date for display
 */
function formatDisplayDate(dateString: string): string {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export const LeaveApplicationForm: React.FC<LeaveApplicationFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const createMutation = useCreateLeaveApplication();
  const { data: balanceData } = useMyLeaveBalances();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      leave_type: "annual" as LeaveType,
      start_date: format(addDays(new Date(), 14), "yyyy-MM-dd"),
      end_date: "",
      reason: "",
    },
  });

  // Additional state for working days input
  const [workingDays, setWorkingDays] = useState<number>(1);
  const [calculatedEndDate, setCalculatedEndDate] = useState<string>("");
  const [resumptionDate, setResumptionDate] = useState<string>("");
  const [isCalculating, setIsCalculating] = useState(false);

  const leaveType = watch("leave_type");
  const startDate = watch("start_date");

  const currentBalance = balanceData?.balances.find(
    (b) => b.leave_type === leaveType,
  );

  // Calculate end date and resumption date when start date or working days change
  useEffect(() => {
    const calculateDates = async () => {
      if (!startDate || workingDays <= 0) {
        setCalculatedEndDate("");
        setResumptionDate("");
        setValue("end_date", "");
        return;
      }

      setIsCalculating(true);
      try {
        // Calculate end date
        const endDate = await calculateEndDate(startDate, workingDays);
        setCalculatedEndDate(endDate);
        setValue("end_date", endDate);

        // Calculate resumption date
        if (endDate) {
          const resumption = await calculateResumptionDate(endDate);
          setResumptionDate(resumption);
        }
      } catch (error) {
        console.error("Error calculating dates:", error);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateDates();
  }, [startDate, workingDays, setValue]);

  // const onSubmit = async (data: FormData) => {
  //   try {
  //     await createMutation.mutateAsync(data);
  //     reset();
  //     setWorkingDays(1);
  //     setCalculatedEndDate("");
  //     setResumptionDate("");
  //     if (onSuccess) onSuccess();
  //   } catch (error) {
  //     console.error("Failed to submit:", error);
  //   }
  // };

  const onSubmit = async (data: FormData) => {
    // Defensive check: Ensure we actually have an end date calculated
    if (!calculatedEndDate) {
      console.error("Cannot submit: End date not calculated");
      return;
    }

    try {
      // MERGE form data with your calculated state variables
      await createMutation.mutateAsync({
        ...data,
        end_date: calculatedEndDate, // From your local state
        working_days: workingDays, // From your local state
      });

      // Success Logic
      reset();
      setWorkingDays(1);
      setCalculatedEndDate("");
      setResumptionDate("");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to submit:", error);
    }
  };

  return (
    <Box
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      bg="white"
      p={6}
      borderRadius="lg"
      boxShadow="md"
    >
      <VStack spacing={6} align="stretch">
        <Box>
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            Apply for Leave
          </Text>
          <Text color="gray.600">
            Fill in the details below to submit your leave request
          </Text>
        </Box>

        <Divider />

        {/* Leave Type */}
        <FormControl isInvalid={!!errors.leave_type} isRequired>
          <FormLabel>Leave Type</FormLabel>
          <Select {...register("leave_type", { required: true })} size="lg">
            {LEAVE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {leaveType && (
            <FormHelperText>
              {
                LEAVE_TYPE_OPTIONS.find((o) => o.value === leaveType)
                  ?.description
              }
            </FormHelperText>
          )}
        </FormControl>

        {/* Current Balance */}
        {currentBalance && (
          <Alert
            status={currentBalance.available_days < 5 ? "warning" : "info"}
            borderRadius="md"
          >
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Current Balance</AlertTitle>
              <AlertDescription>
                Available: <strong>{currentBalance.available_days} days</strong>
                {" / "}
                Allocated: {currentBalance.allocated_days} days
                {currentBalance.leave_type === "sick" && (
                  <Text fontSize="sm" mt={1}>
                    Note: Sick leave can be reapplied if needed
                  </Text>
                )}
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Start Date and Working Days */}
        <HStack spacing={4} align="flex-start">
          <FormControl isInvalid={!!errors.start_date} isRequired flex={1}>
            <FormLabel>Start Date</FormLabel>
            <Input
              type="date"
              {...register("start_date", {
                required: "Start date is required",
              })}
              size="lg"
              min={format(new Date(), "yyyy-MM-dd")}
            />
            {errors.start_date && (
              <FormErrorMessage>{errors.start_date.message}</FormErrorMessage>
            )}
            <FormHelperText>First day of your leave</FormHelperText>
          </FormControl>

          <FormControl isRequired flex={1}>
            <FormLabel>Number of Working Days</FormLabel>
            <NumberInput
              value={workingDays}
              onChange={(_, value) => setWorkingDays(value || 1)}
              min={1}
              max={currentBalance?.available_days || 365}
              size="lg"
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <FormHelperText>Excludes weekends & holidays</FormHelperText>
          </FormControl>
        </HStack>

        {/* Leave Summary */}
        {(isCalculating || calculatedEndDate || resumptionDate) && (
          <Alert
            status="info"
            variant="left-accent"
            borderRadius="md"
            bg="blue.50"
            borderLeftWidth={4}
            borderLeftColor="blue.500"
          >
            <Box flex="1">
              <AlertTitle fontSize="md" mb={3} color="blue.900">
                📊 Leave Summary
              </AlertTitle>

              {isCalculating ? (
                <HStack>
                  <Spinner size="sm" color="blue.500" />
                  <Text fontSize="sm" color="blue.700">
                    Calculating dates...
                  </Text>
                </HStack>
              ) : (
                <VStack align="stretch" spacing={3}>
                  {/* End Date */}
                  <Box p={3} bg="white" borderRadius="md">
                    <Text
                      fontSize="xs"
                      color="gray.600"
                      fontWeight="semibold"
                      mb={1}
                    >
                      END DATE (Last day of leave)
                    </Text>
                    <Text fontSize="md" fontWeight="bold" color="orange.700">
                      📅{" "}
                      {calculatedEndDate
                        ? formatDisplayDate(calculatedEndDate)
                        : "N/A"}
                    </Text>
                  </Box>

                  {/* Resumption Date */}
                  <Box p={3} bg="white" borderRadius="md">
                    <Text
                      fontSize="xs"
                      color="gray.600"
                      fontWeight="semibold"
                      mb={1}
                    >
                      RESUMPTION DATE (Return to work)
                    </Text>
                    <Text fontSize="md" fontWeight="bold" color="green.700">
                      🏢{" "}
                      {resumptionDate
                        ? formatDisplayDate(resumptionDate)
                        : "N/A"}
                    </Text>
                  </Box>

                  <Divider />

                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.700">
                      <strong>Total Working Days:</strong>
                    </Text>
                    <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
                      {workingDays} {workingDays === 1 ? "day" : "days"}
                    </Badge>
                  </HStack>

                  <Text fontSize="xs" color="gray.600" fontStyle="italic">
                    ℹ️ Calculation automatically excludes weekends and public
                    holidays
                  </Text>
                </VStack>
              )}
            </Box>
          </Alert>
        )}

        {/* Reason */}
        <FormControl isInvalid={!!errors.reason} isRequired>
          <FormLabel>Reason for Leave</FormLabel>
          <Textarea
            {...register("reason", {
              required: "Reason is required",
              minLength: {
                value: 10,
                message: "Reason must be at least 10 characters",
              },
              maxLength: {
                value: 500,
                message: "Reason must not exceed 500 characters",
              },
            })}
            placeholder="Please provide a detailed reason for your leave request..."
            size="lg"
            rows={4}
          />
          {errors.reason && (
            <FormErrorMessage>{errors.reason.message}</FormErrorMessage>
          )}
          <FormHelperText>Minimum 10 characters, maximum 500</FormHelperText>
        </FormControl>

        {/* Success/Error Messages */}
        {createMutation.isError && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertDescription>
              {(createMutation.error as Error)?.message ||
                "Failed to submit application"}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <HStack spacing={4} justify="flex-end" pt={4}>
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              isDisabled={createMutation.isPending || isCalculating}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={createMutation.isPending || isCalculating}
            loadingText={isCalculating ? "Calculating..." : "Submitting..."}
            size="lg"
            isDisabled={!calculatedEndDate || isCalculating}
          >
            Submit Leave Request
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};
