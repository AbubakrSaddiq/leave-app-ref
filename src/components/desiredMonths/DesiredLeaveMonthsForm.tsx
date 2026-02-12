// ============================================
// Desired Leave Months Form Component (2 MONTHS ONLY)
// ============================================

import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  Text,
  Box,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  Badge,
  Divider,
  HStack,
  Progress,
} from '@chakra-ui/react';
import { FiCalendar, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useSubmitDesiredMonths } from '@/hooks/useDesiredLeaveMonths';

const MONTHS = [
  { value: 1, label: 'January', shortLabel: 'Jan' },
  { value: 2, label: 'February', shortLabel: 'Feb' },
  { value: 3, label: 'March', shortLabel: 'Mar' },
  { value: 4, label: 'April', shortLabel: 'Apr' },
  { value: 5, label: 'May', shortLabel: 'May' },
  { value: 6, label: 'June', shortLabel: 'Jun' },
  { value: 7, label: 'July', shortLabel: 'Jul' },
  { value: 8, label: 'August', shortLabel: 'Aug' },
  { value: 9, label: 'September', shortLabel: 'Sep' },
  { value: 10, label: 'October', shortLabel: 'Oct' },
  { value: 11, label: 'November', shortLabel: 'Nov' },
  { value: 12, label: 'December', shortLabel: 'Dec' },
];

interface DesiredLeaveMonthsFormProps {
  isOpen: boolean;
  onClose: () => void;
  canClose?: boolean; // If false, modal cannot be closed without submission
}

export const DesiredLeaveMonthsForm: React.FC<DesiredLeaveMonthsFormProps> = ({
  isOpen,
  onClose,
  canClose = false,
}) => {
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const submitMutation = useSubmitDesiredMonths();

  const handleMonthToggle = (monthValue: number) => {
    setSelectedMonths((prev) => {
      if (prev.includes(monthValue)) {
        // Deselect month
        return prev.filter((m) => m !== monthValue);
      } else {
        // Select month (but limit to 2)
        if (prev.length >= 2) {
          // Replace the first selected month with the new one
          return [prev[1], monthValue].sort((a, b) => a - b);
        } else {
          return [...prev, monthValue].sort((a, b) => a - b);
        }
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedMonths.length !== 2) {
      return; // Button should be disabled, but just in case
    }

    await submitMutation.mutateAsync({ preferred_months: selectedMonths });
    onClose();
  };

  const handleClose = () => {
    if (canClose) {
      onClose();
    }
  };

  const selectionComplete = selectedMonths.length === 2;
  const progressPercent = (selectedMonths.length / 2) * 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
      closeOnOverlayClick={canClose}
      closeOnEsc={canClose}
      isCentered
    >
      <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.600" />
      <ModalContent borderRadius="xl" maxW="700px">
        <ModalHeader borderBottomWidth="1px" pb={4}>
          <HStack spacing={3}>
            <Icon as={FiCalendar} color="blue.500" boxSize={6} />
            <Box>
              <Text fontSize="xl" fontWeight="bold">
                Select Your 2 Desired Leave Months
              </Text>
              <Text fontSize="sm" fontWeight="normal" color="gray.600" mt={1}>
                Choose exactly 2 months for your annual leave
              </Text>
            </Box>
          </HStack>
        </ModalHeader>

        <ModalBody py={6}>
          <VStack spacing={6} align="stretch">
            {/* Important Notice */}
            <Alert status="info" borderRadius="lg" variant="left-accent">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle fontSize="sm" mb={1}>
                  Important Information
                </AlertTitle>
                <AlertDescription fontSize="xs">
                  <VStack align="start" spacing={1}>
                    <Text>
                      • Select <strong>exactly 2 months</strong> for your annual leave
                    </Text>
                    <Text>
                      • This is a <strong>one-time submission</strong> and cannot be
                      changed later
                    </Text>
                    <Text>
                      • Your annual leave applications must fall within these 2 months
                    </Text>
                    <Text>
                      • This restriction applies only to{' '}
                      <strong>annual leave</strong>, not other leave types
                    </Text>
                  </VStack>
                </AlertDescription>
              </Box>
            </Alert>

            {/* Selection Progress */}
            <Box
              p={4}
              bg={selectionComplete ? 'green.50' : 'blue.50'}
              borderRadius="lg"
              borderLeft="4px solid"
              borderLeftColor={selectionComplete ? 'green.400' : 'blue.400'}
            >
              <HStack justify="space-between" mb={3}>
                <Text fontSize="sm" fontWeight="bold" color={selectionComplete ? 'green.900' : 'blue.900'}>
                  Selection Progress: {selectedMonths.length}/2 Months
                </Text>
                {selectionComplete && (
                  <Badge colorScheme="green" px={2} py={1}>
                    <HStack spacing={1}>
                      <Icon as={FiCheckCircle} />
                      <Text>Complete</Text>
                    </HStack>
                  </Badge>
                )}
              </HStack>
              
              <Progress 
                value={progressPercent} 
                colorScheme={selectionComplete ? 'green' : 'blue'}
                size="sm"
                borderRadius="full"
                mb={3}
              />

              {selectedMonths.length > 0 && (
                <>
                  <Text fontSize="xs" fontWeight="bold" mb={2} color="gray.700">
                    Your Selected Months:
                  </Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {selectedMonths.map((month) => {
                      const monthData = MONTHS.find((m) => m.value === month);
                      return (
                        <Badge
                          key={month}
                          colorScheme={selectionComplete ? 'green' : 'blue'}
                          px={3}
                          py={1}
                          borderRadius="md"
                          fontSize="sm"
                          fontWeight="bold"
                        >
                          {monthData?.label}
                        </Badge>
                      );
                    })}
                  </HStack>
                </>
              )}
            </Box>

            <Divider />

            {/* Instruction */}
            <Box bg="purple.50" p={3} borderRadius="md">
              <Text fontSize="sm" fontWeight="bold" mb={1} color="purple.900">
                💡 How to Select:
              </Text>
              <Text fontSize="xs" color="purple.800">
                {selectedMonths.length === 0 && 'Click on any 2 months to select them.'}
                {selectedMonths.length === 1 && 'Click on 1 more month to complete your selection.'}
                {selectedMonths.length === 2 && 'Selection complete! Click a selected month to change it, or submit your choice.'}
              </Text>
            </Box>

            {/* Month Selection Grid */}
            <Box>
              <Text fontSize="sm" fontWeight="bold" mb={3} color="gray.700">
                Click to select your 2 preferred months:
              </Text>
              <SimpleGrid columns={3} spacing={3}>
                {MONTHS.map((month) => {
                  const isSelected = selectedMonths.includes(month.value);
                  const canSelect = selectedMonths.length < 2 || isSelected;
                  
                  return (
                    <Box
                      key={month.value}
                      as="button"
                      type="button"
                      onClick={() => handleMonthToggle(month.value)}
                      p={4}
                      borderRadius="lg"
                      borderWidth="2px"
                      borderColor={isSelected ? 'blue.400' : canSelect ? 'gray.200' : 'gray.100'}
                      bg={isSelected ? 'blue.50' : canSelect ? 'white' : 'gray.50'}
                      transition="all 0.2s"
                      _hover={{
                        borderColor: isSelected ? 'blue.500' : canSelect ? 'blue.300' : 'gray.200',
                        transform: canSelect ? 'translateY(-2px)' : 'none',
                        shadow: canSelect ? 'md' : 'none',
                      }}
                      _active={{ transform: canSelect ? 'scale(0.98)' : 'none' }}
                      cursor={canSelect ? 'pointer' : 'not-allowed'}
                      opacity={canSelect ? 1 : 0.5}
                      position="relative"
                    >
                      <VStack spacing={2}>
                        <Icon
                          as={isSelected ? FiCheckCircle : FiCalendar}
                          color={isSelected ? 'blue.500' : 'gray.400'}
                          boxSize={5}
                        />
                        <Text
                          fontSize="sm"
                          fontWeight={isSelected ? 'bold' : 'medium'}
                          color={isSelected ? 'blue.700' : 'gray.700'}
                        >
                          {month.label}
                        </Text>
                        {isSelected && (
                          <Badge colorScheme="blue" fontSize="9px">
                            Selected #{selectedMonths.indexOf(month.value) + 1}
                          </Badge>
                        )}
                      </VStack>
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Box>

            {/* Validation Warning */}
            {selectedMonths.length !== 2 && (
              <Alert status="warning" borderRadius="md">
                <AlertIcon as={FiAlertCircle} />
                <AlertDescription fontSize="sm">
                  {selectedMonths.length === 0 && 'Please select 2 months to continue'}
                  {selectedMonths.length === 1 && 'Please select 1 more month (2 required)'}
                </AlertDescription>
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter bg="gray.50" borderTopWidth="1px" borderBottomRadius="xl">
          <HStack spacing={3}>
            {canClose && (
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
            )}
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isDisabled={selectedMonths.length !== 2}
              isLoading={submitMutation.isPending}
              loadingText="Submitting..."
              size="lg"
              px={8}
              leftIcon={<FiCheckCircle />}
            >
              Submit My 2 Months
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};