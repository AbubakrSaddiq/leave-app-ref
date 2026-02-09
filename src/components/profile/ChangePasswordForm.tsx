// ============================================
// Change Password Form Component
// ============================================

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  VStack,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Button,
  FormErrorMessage,
  FormHelperText,
  Text,
  Progress,
  List,
  ListItem,
  ListIcon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Heading,
  Divider,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { FiEye, FiEyeOff, FiLock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useChangePassword } from '@/hooks/useProfile';
import { checkPasswordStrength } from '@/api/profile.api';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const ChangePasswordForm: React.FC = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [] as string[],
    isStrong: false,
  });

  const changePasswordMutation = useChangePassword();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<PasswordFormData>();

  const newPassword = watch('newPassword');

  // Update password strength as user types
  React.useEffect(() => {
    if (newPassword) {
      const strength = checkPasswordStrength(newPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: [], isStrong: false });
    }
  }, [newPassword]);

  const onSubmit = async (data: PasswordFormData) => {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      reset();
      setPasswordStrength({ score: 0, feedback: [], isStrong: false });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getStrengthColor = (score: number) => {
    if (score === 0) return 'red';
    if (score <= 2) return 'orange';
    if (score === 3) return 'yellow';
    return 'green';
  };

  const getStrengthLabel = (score: number) => {
    if (score === 0) return 'Very Weak';
    if (score === 1) return 'Weak';
    if (score === 2) return 'Fair';
    if (score === 3) return 'Good';
    return 'Strong';
  };

  return (
    <Card>
      <CardBody>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="md" mb={2}>
              Change Password
            </Heading>
            <Text color="gray.600" fontSize="sm">
              Ensure your account stays secure by using a strong password
            </Text>
          </Box>

          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle fontSize="sm">Password Requirements</AlertTitle>
              <AlertDescription fontSize="xs">
                Your password must be at least 8 characters long and include uppercase,
                lowercase, numbers, and special characters.
              </AlertDescription>
            </Box>
          </Alert>

          <Divider />

          <Box as="form" onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={5} align="stretch">
              {/* Current Password */}
              <FormControl isInvalid={!!errors.currentPassword}>
                <FormLabel>Current Password</FormLabel>
                <InputGroup size="lg">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    {...register('currentPassword', {
                      required: 'Current password is required',
                    })}
                    placeholder="Enter current password"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                      icon={showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      variant="ghost"
                      size="sm"
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.currentPassword?.message}</FormErrorMessage>
              </FormControl>

              {/* New Password */}
              <FormControl isInvalid={!!errors.newPassword}>
                <FormLabel>New Password</FormLabel>
                <InputGroup size="lg">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    {...register('newPassword', {
                      required: 'New password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                      validate: (value) => {
                        const strength = checkPasswordStrength(value);
                        return strength.isStrong || 'Password is not strong enough';
                      },
                    })}
                    placeholder="Enter new password"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      icon={showNewPassword ? <FiEyeOff /> : <FiEye />}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      variant="ghost"
                      size="sm"
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.newPassword?.message}</FormErrorMessage>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <Box mt={3}>
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="xs" fontWeight="medium">
                        Password Strength:
                      </Text>
                      <Text
                        fontSize="xs"
                        fontWeight="bold"
                        color={`${getStrengthColor(passwordStrength.score)}.600`}
                      >
                        {getStrengthLabel(passwordStrength.score)}
                      </Text>
                    </HStack>
                    <Progress
                      value={(passwordStrength.score / 4) * 100}
                      size="sm"
                      colorScheme={getStrengthColor(passwordStrength.score)}
                      borderRadius="full"
                    />
                  </Box>
                )}
              </FormControl>

              {/* Confirm Password */}
              <FormControl isInvalid={!!errors.confirmPassword}>
                <FormLabel>Confirm New Password</FormLabel>
                <InputGroup size="lg">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === newPassword || 'Passwords do not match',
                    })}
                    placeholder="Confirm new password"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={
                        showConfirmPassword ? 'Hide password' : 'Show password'
                      }
                      icon={showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      variant="ghost"
                      size="sm"
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
              </FormControl>

              {/* Password Feedback */}
              {passwordStrength.feedback.length > 0 && (
                <Box
                  p={3}
                  bg="orange.50"
                  borderRadius="md"
                  borderLeft="3px solid"
                  borderLeftColor="orange.400"
                >
                  <Text fontSize="xs" fontWeight="bold" mb={2} color="orange.800">
                    Password Improvement Suggestions:
                  </Text>
                  <List spacing={1}>
                    {passwordStrength.feedback.map((item, index) => (
                      <ListItem key={index} fontSize="xs" color="orange.700">
                        <ListIcon as={FiXCircle} color="orange.500" />
                        {item}
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Success Message */}
              {changePasswordMutation.isSuccess && (
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <Box flex="1">
                    <AlertTitle fontSize="sm">Password Changed!</AlertTitle>
                    <AlertDescription fontSize="xs">
                      Your password has been updated successfully.
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                leftIcon={<FiLock />}
                isLoading={changePasswordMutation.isPending}
                loadingText="Changing Password..."
              >
                Change Password
              </Button>
            </VStack>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};

// Helper component for HStack (imported from @chakra-ui/react above)
import { HStack } from '@chakra-ui/react';