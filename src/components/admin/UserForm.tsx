import React, { useState, useEffect } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, Button, FormControl, FormLabel,
  Input, Select, VStack, useToast, InputGroup, InputLeftElement,
  Icon, Text, Box, HStack, RadioGroup, Radio, Stack, InputRightElement,
  IconButton, Tooltip, Badge
} from "@chakra-ui/react";
import { FiUser, FiMail, FiLock, FiShield, FiBriefcase, FiAward, FiRefreshCw, FiCopy, FiEye, FiEyeOff } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getDesignations } from "@/api/designation.api";

interface UserFormProps {
  user?: any;
  departments: any[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_PASSWORD = "Naseni123!";

const generateSecurePassword = (): string => {
  const length = 12;
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export const UserForm: React.FC<UserFormProps> = ({
  user,
  departments,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordOption, setPasswordOption] = useState<"default" | "auto">("default");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || "",
    full_name: user?.full_name || "",
    password: DEFAULT_PASSWORD,
    role: user?.role || "staff",
    department_id: user?.department_id || "",
    designation_id: user?.designation_id || "", // UPDATED: Added designation
  });

  // Fetch designations
  const { data: designations, isLoading: loadingDesignations } = useQuery({
    queryKey: ["designations"],
    queryFn: getDesignations,
  });

  // Update password when option changes
  useEffect(() => {
    if (!user) {
      if (passwordOption === "default") {
        setFormData(prev => ({ ...prev, password: DEFAULT_PASSWORD }));
      } else {
        setFormData(prev => ({ ...prev, password: generateSecurePassword() }));
      }
    }
  }, [passwordOption, user]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && !user) {
      setPasswordOption("default");
      setFormData({
        email: "",
        full_name: "",
        password: DEFAULT_PASSWORD,
        role: "staff",
        department_id: "",
        designation_id: "", // UPDATED: Reset designation
      });
      setShowPassword(false);
    } else if (isOpen && user) {
      // When editing, populate with user data
      setFormData({
        email: user.email || "",
        full_name: user.full_name || "",
        password: "",
        role: user.role || "staff",
        department_id: user.department_id || "",
        designation_id: user.designation_id || "", // UPDATED: Populate designation
      });
    }
  }, [isOpen, user]);

  const handleRegeneratePassword = () => {
    const newPassword = generateSecurePassword();
    setFormData(prev => ({ ...prev, password: newPassword }));
    toast({
      title: "Password regenerated",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(formData.password);
    toast({
      title: "Password copied to clipboard",
      description: "Make sure to share it securely with the user",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (user) {
        // UPDATE MODE
        const { error } = await supabase
          .from("users")
          .update({
            full_name: formData.full_name,
            role: formData.role,
            department_id: formData.department_id || null,
            designation_id: formData.designation_id || null, // UPDATED: Include designation
          })
          .eq("id", user.id);

        if (error) throw error;
        toast({ title: "User updated successfully", status: "success" });
      } else {
        // CREATE MODE
        const { data, error } = await supabase.functions.invoke("admin-create-user", {
          body: {
            email: formData.email,
            password: formData.password,
            user_metadata: {
              full_name: formData.full_name,
              role: formData.role,
              department_id: formData.department_id,
              designation_id: formData.designation_id, // UPDATED: Include designation
            },
          },
        });

        if (error) throw error;
        
        toast({
          title: "User created successfully",
          description: passwordOption === "auto" 
            ? "Generated password has been copied to clipboard" 
            : "Default password assigned",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        
        navigator.clipboard.writeText(formData.password);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({ title: "Operation failed", description: err.message, status: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius="xl">
        <form onSubmit={handleSubmit}>
          <ModalHeader borderBottomWidth="1px">
            {user ? "Edit Staff Member" : "Register New Staff"}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody py={6}>
            <VStack spacing={4}>
              <FormControl isRequired isDisabled={!!user}>
                <FormLabel fontSize="xs" fontWeight="bold">Email Address</FormLabel>
                <InputGroup>
                  <InputLeftElement children={<Icon as={FiMail} color="gray.400" />} />
                  <Input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="name@company.com" 
                  />
                </InputGroup>
              </FormControl>

              {!user && (
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">Password Option</FormLabel>
                  <RadioGroup value={passwordOption} onChange={(val) => setPasswordOption(val as "default" | "auto")}>
                    <Stack direction="row" spacing={6}>
                      <Radio value="default" colorScheme="blue">
                        <HStack spacing={2}>
                          <Text fontSize="sm">Default Password</Text>
                          <Badge colorScheme="blue" fontSize="10px">Naseni123!</Badge>
                        </HStack>
                      </Radio>
                      <Radio value="auto" colorScheme="green">
                        <HStack spacing={2}>
                          <Text fontSize="sm">Auto-Generate</Text>
                          <Badge colorScheme="green" fontSize="10px">Secure</Badge>
                        </HStack>
                      </Radio>
                    </Stack>
                  </RadioGroup>
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    {passwordOption === "default" 
                      ? "Uses the standard temporary password for new users" 
                      : "Generates a strong random password (12+ characters)"}
                  </Text>
                </FormControl>
              )}

              {!user && (
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    {passwordOption === "default" ? "Default Password" : "Generated Password"}
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement children={<Icon as={FiLock} color="gray.400" />} />
                    <Input 
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      readOnly
                      bg="gray.50"
                      fontFamily="mono"
                      fontSize="sm"
                    />
                    <InputRightElement width="auto" pr={2}>
                      <HStack spacing={1}>
                        {passwordOption === "auto" && (
                          <Tooltip label="Regenerate password">
                            <IconButton
                              aria-label="Regenerate password"
                              icon={<FiRefreshCw />}
                              size="xs"
                              variant="ghost"
                              onClick={handleRegeneratePassword}
                            />
                          </Tooltip>
                        )}
                        <Tooltip label="Copy password">
                          <IconButton
                            aria-label="Copy password"
                            icon={<FiCopy />}
                            size="xs"
                            variant="ghost"
                            onClick={handleCopyPassword}
                          />
                        </Tooltip>
                        <IconButton
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          icon={showPassword ? <FiEyeOff /> : <FiEye />}
                          size="xs"
                          variant="ghost"
                          onClick={() => setShowPassword(!showPassword)}
                        />
                      </HStack>
                    </InputRightElement>
                  </InputGroup>
                  <Text fontSize="xs" color="orange.600" mt={1} fontWeight="medium">
                    ⚠️ Password will be copied to clipboard on user creation
                  </Text>
                </FormControl>
              )}

              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="bold">Full Name</FormLabel>
                <InputGroup>
                  <InputLeftElement children={<Icon as={FiUser} color="gray.400" />} />
                  <Input 
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="e.g. Jane Doe" 
                  />
                </InputGroup>
              </FormControl>

              <HStack width="full" spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">Access Role</FormLabel>
                  <InputGroup>
                    <InputLeftElement children={<Icon as={FiShield} color="gray.400" />} />
                    <Select 
                      pl="40px"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="staff">Staff</option>
                      <option value="director">Director</option>
                      <option value="hr">HR Admin</option>
                      <option value="admin">System Admin</option>
                    </Select>
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold">Department</FormLabel>
                  <InputGroup>
                    <InputLeftElement children={<Icon as={FiBriefcase} color="gray.400" />} />
                    <Select 
                      pl="40px"
                      value={formData.department_id}
                      onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                      placeholder="Unassigned"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.code}</option>
                      ))}
                    </Select>
                  </InputGroup>
                </FormControl>
              </HStack>

              {/* UPDATED: Added Designation Field */}
              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold">Designation</FormLabel>
                <InputGroup>
                  <InputLeftElement children={<Icon as={FiAward} color="gray.400" />} />
                  <Select 
                    pl="40px"
                    value={formData.designation_id}
                    onChange={(e) => setFormData({...formData, designation_id: e.target.value})}
                    placeholder="Select designation"
                    isDisabled={loadingDesignations}
                  >
                    {designations?.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </Select>
                </InputGroup>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Job title/position (e.g., Director, Manager, Officer)
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter bg="gray.50" borderBottomRadius="xl">
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue" type="submit" isLoading={isSubmitting}>
              {user ? "Save Changes" : "Create Account"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};