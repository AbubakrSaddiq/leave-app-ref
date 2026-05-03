import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Heading,
  InputGroup,
  InputRightElement,
  IconButton,
  Alert,
  AlertIcon,
  AlertTitle,
  useToast,
  Divider,
  Progress,
} from "@chakra-ui/react";
import { FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { authService } from "@/services/authService";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  const toast = useToast();

  // Handle countdown timer for rate limiting
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.loginWithEdgeFunction({
        email,
        password,
      });

      // Success
      toast({
        title: "Login Successful",
        description: "Welcome back to the Leave Management System.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Clear form
      setEmail("");
      setPassword("");
      setAttemptsRemaining(null);
    } catch (err: any) {
      const errorMessage = err.message || "Invalid email or password";
      setError(errorMessage);

      // Check if it's a rate limit error
      if (err.message?.includes("Too many login attempts")) {
        // Extract retry-after from error message if available
        const match = err.message.match(/(\d+) seconds/);
        if (match) {
          const seconds = parseInt(match[1]);
          setRetryAfter(seconds);
          setCountdown(seconds);
          setAttemptsRemaining(0);
        }
      }

      toast({
        title: "Login Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show countdown when rate limited
  if (countdown > 0) {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;

    return (
      <Box
        maxW="md"
        mx="auto"
        mt={10}
        p={8}
        borderWidth={1}
        borderRadius="xl"
        boxShadow="lg"
        bg="white"
      >
        <VStack spacing={6} align="stretch">
          <VStack spacing={2} align="center">
            <Heading size="lg">Welcome Back</Heading>
            <Text color="gray.600">Enter your credentials to manage leave</Text>
          </VStack>

          <Alert status="error" borderRadius="md" variant="left-accent">
            <AlertIcon />
            <VStack align="start" spacing={1} flex={1}>
              <AlertTitle>Too Many Login Attempts</AlertTitle>
              <Text fontSize="sm">
                Please wait before trying again. Time remaining:
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="red.600">
                {minutes > 0 ? `${minutes}m ` : ""}{seconds}s
              </Text>
              <Progress
                value={(countdown / (retryAfter || 900)) * 100}
                size="sm"
                width="100%"
                colorScheme="red"
                borderRadius="md"
              />
            </VStack>
          </Alert>

          <Button
            colorScheme="gray"
            size="lg"
            fontSize="md"
            width="full"
            isDisabled
          >
            Try Again in {seconds}s
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      maxW="md"
      mx="auto"
      mt={10}
      p={8}
      borderWidth={1}
      borderRadius="xl"
      boxShadow="lg"
      bg="white"
    >
      <VStack spacing={6} align="stretch" as="form" onSubmit={handleLogin}>
        <VStack spacing={2} align="center">
          <Heading size="lg">Welcome Back</Heading>
          <Text color="gray.600">Enter your credentials to manage leave</Text>
        </VStack>

        {/* Error Alert */}
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={0} flex={1}>
              <AlertTitle>Login Failed</AlertTitle>
              <Text fontSize="sm">{error}</Text>
              {attemptsRemaining !== null && attemptsRemaining > 0 && (
                <Text fontSize="xs" color="red.700" mt={1}>
                  You have {attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""} remaining
                </Text>
              )}
            </VStack>
          </Alert>
        )}

        {/* Warning when attempts are low */}
        {attemptsRemaining !== null && attemptsRemaining > 0 && attemptsRemaining <= 2 && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={0} flex={1}>
              <AlertTitle>⚠️ Limited Attempts Remaining</AlertTitle>
              <Text fontSize="sm">
                {attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""} left before temporary lockout
              </Text>
            </VStack>
          </Alert>
        )}

        <FormControl isRequired>
          <FormLabel>Email Address</FormLabel>
          <InputGroup>
            <Input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              focusBorderColor="blue.400"
              isDisabled={isLoading}
            />
          </InputGroup>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Password</FormLabel>
          <InputGroup>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              focusBorderColor="blue.400"
              isDisabled={isLoading}
            />
            <InputRightElement>
              <IconButton
                variant="ghost"
                size="sm"
                icon={showPassword ? <FiEyeOff /> : <FiEye />}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                isDisabled={isLoading}
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          size="lg"
          fontSize="md"
          isLoading={isLoading}
          loadingText="Signing in..."
          width="full"
        >
          Sign In
        </Button>

        <Divider />

        <Text fontSize="xs" color="gray.500" textAlign="center">
          🔒 This login is protected with rate limiting (max 5 attempts per 15 minutes)
        </Text>
      </VStack>
    </Box>
  );
};
