import React, { useEffect } from "react";
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
  Icon,
} from "@chakra-ui/react";
import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import { useLeaveForm } from "@/hooks/useLeaveForm";
import { LEAVE_TYPE_OPTIONS } from "@/constants/leaveConstants";
import { formatDisplayDate } from "@/utils/dateUtils";
import { format } from "date-fns";
import { LeaveType } from "@/types/models";
import { 
  useValidateLeaveDates, 
  useHasSubmittedDesiredMonths,
  useMyDesiredMonths 
} from "@/hooks/useDesiredLeaveMonths";

interface LeaveApplicationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const LeaveApplicationForm: React.FC<LeaveApplicationFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  // Pulling everything from our custom hook
  const {
    form,
    workingDays,
    setWorkingDays,
    calculatedEndDate,
    resumptionDate,
    isCalculating,
    currentBalance,
    submitForm,
    isSubmitting,
    error,
  } = useLeaveForm(onSuccess);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = form;

  const leaveType = watch("leave_type");
  const startDate = watch("start_date");

  // Check desired months submission status
  const { data: hasSubmitted } = useHasSubmittedDesiredMonths();
  const { data: desiredMonths } = useMyDesiredMonths();

  // Validate dates against desired months (only for annual leave)
  const shouldValidateDesiredMonths = 
    leaveType === LeaveType.ANNUAL && 
    !!startDate && 
    !!calculatedEndDate &&
    !isCalculating;

  const {
    data: desiredMonthsValidation,
    isLoading: isValidatingDesiredMonths,
  } = useValidateLeaveDates(
    startDate,
    calculatedEndDate,
    shouldValidateDesiredMonths
  );

  // Check if annual leave can be submitted
  const isAnnualLeaveBlocked = 
    leaveType === LeaveType.ANNUAL && !hasSubmitted;

  const isDesiredMonthsInvalid = 
    leaveType === LeaveType.ANNUAL && 
    desiredMonthsValidation && 
    !desiredMonthsValidation.is_valid;

  const canSubmit = 
    !isCalculating && 
    !isValidatingDesiredMonths &&
    !!calculatedEndDate && 
    !isAnnualLeaveBlocked &&
    !isDesiredMonthsInvalid;

  return (
    <Box
      as="form"
      onSubmit={handleSubmit(submitForm)}
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

        {/* Leave Type Selection */}
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
              {LEAVE_TYPE_OPTIONS.find((o) => o.value === leaveType)?.description}
            </FormHelperText>
          )}
        </FormControl>

        {/* Annual Leave - Desired Months Not Submitted */}
        {isAnnualLeaveBlocked && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Desired Months Required</AlertTitle>
              <AlertDescription>
                You must submit your desired leave months before applying for annual
                leave. Please complete the desired months form first.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Show desired months info for annual leave */}
        {leaveType === LeaveType.ANNUAL && desiredMonths && (
          <Alert status="info" borderRadius="md" variant="left-accent">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle fontSize="sm">Your Desired Leave Months</AlertTitle>
              <AlertDescription fontSize="sm" mt={2}>
                <HStack spacing={2} flexWrap="wrap">
                  {desiredMonths.preferred_months.map((monthNum) => {
                    const monthNames = [
                      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                    ];
                    return (
                      <Badge key={monthNum} colorScheme="blue" fontSize="xs">
                        {monthNames[monthNum - 1]}
                      </Badge>
                    );
                  })}
                </HStack>
                <Text fontSize="xs" mt={2} color="gray.600">
                  Your annual leave must fall within these months
                </Text>
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Dynamic Leave Balance Alert */}
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
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Start Date & Working Days Inputs */}
        <HStack spacing={4} align="flex-start">
          <FormControl isInvalid={!!errors.start_date} isRequired flex={1}>
            <FormLabel>Start Date</FormLabel>
            <Input
              type="date"
              {...register("start_date", { required: "Start date is required" })}
              size="lg"
              min={format(new Date(), "yyyy-MM-dd")}
              isDisabled={isAnnualLeaveBlocked}
            />
            <FormErrorMessage>{errors.start_date?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired flex={1}>
            <FormLabel>Working Days</FormLabel>
            <NumberInput
              value={workingDays}
              onChange={(_, value) => setWorkingDays(value || 1)}
              min={1}
              max={currentBalance?.available_days || 365}
              size="lg"
              isDisabled={isAnnualLeaveBlocked}
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

        {/* Calculated Leave Summary Section */}
        {(isCalculating || calculatedEndDate) && !isAnnualLeaveBlocked && (
          <Alert status="info" variant="left-accent" borderRadius="md" bg="blue.50">
            <Box flex="1">
              <AlertTitle fontSize="md" mb={3} color="blue.900">
                📊 Leave Summary
              </AlertTitle>

              {isCalculating ? (
                <HStack>
                  <Spinner size="sm" color="blue.500" />
                  <Text fontSize="sm">Calculating dates...</Text>
                </HStack>
              ) : (
                <VStack align="stretch" spacing={3}>
                  <SummaryItem 
                    label="END DATE (Last day of leave)" 
                    value={formatDisplayDate(calculatedEndDate)} 
                    color="orange.700" 
                  />
                  <SummaryItem 
                    label="RESUMPTION DATE (Return to work)" 
                    value={formatDisplayDate(resumptionDate)} 
                    color="green.700" 
                  />
                  <Divider />
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="bold">Total Working Days:</Text>
                    <Badge colorScheme="purple" fontSize="md" px={3}>
                      {workingDays} {workingDays === 1 ? "day" : "days"}
                    </Badge>
                  </HStack>
                </VStack>
              )}
            </Box>
          </Alert>
        )}

        {/* Desired Months Validation (Annual Leave Only) */}
        {isValidatingDesiredMonths && leaveType === LeaveType.ANNUAL && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <HStack>
              <Spinner size="sm" />
              <Text fontSize="sm">Validating against your desired months...</Text>
            </HStack>
          </Alert>
        )}

        {desiredMonthsValidation && leaveType === LeaveType.ANNUAL && !isValidatingDesiredMonths && (
          <Alert
            status={desiredMonthsValidation.is_valid ? "success" : "error"}
            borderRadius="md"
            variant="left-accent"
          >
            <AlertIcon as={desiredMonthsValidation.is_valid ? FiCheckCircle : FiAlertTriangle} />
            <Box flex="1">
              <AlertTitle fontSize="sm">
                {desiredMonthsValidation.is_valid 
                  ? "Dates Valid ✓" 
                  : "Invalid Date Selection"}
              </AlertTitle>
              <AlertDescription fontSize="sm" mt={1}>
                {desiredMonthsValidation.message}
              </AlertDescription>
              {!desiredMonthsValidation.is_valid && desiredMonthsValidation.leave_months && (
                <Box mt={3}>
                  <Text fontSize="xs" fontWeight="bold" mb={1}>Leave spans these months:</Text>
                  <HStack spacing={2}>
                    {desiredMonthsValidation.leave_months.map((monthNum) => {
                      const monthNames = [
                        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                      ];
                      const isDesired = desiredMonthsValidation.desired_months?.includes(monthNum);
                      return (
                        <Badge 
                          key={monthNum} 
                          colorScheme={isDesired ? "green" : "red"}
                          fontSize="xs"
                        >
                          {monthNames[monthNum - 1]}
                        </Badge>
                      );
                    })}
                  </HStack>
                </Box>
              )}
            </Box>
          </Alert>
        )}

        {/* Reason Field */}
        <FormControl isInvalid={!!errors.reason} isRequired>
          <FormLabel>Reason for Leave</FormLabel>
          <Textarea
            {...register("reason", {
              required: "Reason is required",
              minLength: { value: 10, message: "Minimum 10 characters" },
            })}
            placeholder="Provide a detailed reason..."
            size="lg"
            rows={4}
            isDisabled={isAnnualLeaveBlocked}
          />
          <FormErrorMessage>{errors.reason?.message}</FormErrorMessage>
        </FormControl>

        {/* API Error Handling */}
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <HStack spacing={4} justify="flex-end" pt={4}>
          {onCancel && (
            <Button variant="outline" onClick={onCancel} isDisabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isSubmitting || isCalculating || isValidatingDesiredMonths}
            loadingText={
              isCalculating 
                ? "Calculating..." 
                : isValidatingDesiredMonths 
                ? "Validating..."
                : "Submitting..."
            }
            size="lg"
            isDisabled={!canSubmit}
          >
            Submit Leave Request
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

/**
 * Helper component for clean summary items
 */
const SummaryItem = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <Box p={3} bg="white" borderRadius="md">
    <Text fontSize="xs" color="gray.600" fontWeight="semibold" mb={1}>
      {label}
    </Text>
    <Text fontSize="md" fontWeight="bold" color={color}>
      📅 {value}
    </Text>
  </Box>
);