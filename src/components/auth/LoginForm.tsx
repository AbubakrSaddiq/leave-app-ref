import React, { useState } from "react";
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
  useToast,
  Divider,
} from "@chakra-ui/react";
import { FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { supabase } from "@/lib/supabase";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const toast = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      toast({
        title: "Login Successful",
        description: "Welcome back to the Leave Management System.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

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

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
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
            />
            <InputRightElement>
              <IconButton
                variant="ghost"
                size="sm"
                icon={showPassword ? <FiEyeOff /> : <FiEye />}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
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

        <Text fontSize="sm" color="gray.500" textAlign="center">
          Staff ID login is managed by the ICT .
        </Text>
      </VStack>
    </Box>
  );
};