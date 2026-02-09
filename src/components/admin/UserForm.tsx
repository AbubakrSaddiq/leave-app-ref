import React, { useState } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, Button, FormControl, FormLabel,
  Input, Select, VStack, useToast, InputGroup, InputLeftElement,
  Icon, Text, Box, HStack
} from "@chakra-ui/react";
import { FiUser, FiMail, FiLock, FiShield, FiBriefcase, FiCalendar } from "react-icons/fi";
import { supabase } from "@/lib/supabase";

interface UserFormProps {
  user?: any; // The selected user if editing
  departments: any[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  departments,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || "",
    full_name: user?.full_name || "",
    password: "",
    role: user?.role || "staff",
    department_id: user?.department_id || "",
    hire_date: user?.hire_date || new Date().toISOString().split("T")[0],
  });

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
            hire_date: formData.hire_date,
          })
          .eq("id", user.id);

        if (error) throw error;
        toast({ title: "User updated successfully", status: "success" });
      } else {
        // CREATE MODE (Uses Edge Function for Auth + DB sync)
        const { data, error } = await supabase.functions.invoke("admin-create-user", {
          body: {
            email: formData.email,
            password: formData.password,
            user_metadata: {
              full_name: formData.full_name,
              role: formData.role,
              department_id: formData.department_id,
            //   Hard coded hire date for demo - in real app, consider allowing admin to set this or default to current date
              hire_date: "01/02/2026",
            },
          },
        });

        if (error) throw error;
        toast({ title: "User created and activated", status: "success" });
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
                  <FormLabel fontSize="xs" fontWeight="bold">Temporary Password</FormLabel>
                  <InputGroup>
                    <InputLeftElement children={<Icon as={FiLock} color="gray.400" />} />
                    <Input 
                      type="password" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Min. 6 characters" 
                    />
                  </InputGroup>
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

              {/* <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="bold">Hire Date</FormLabel>
                <InputGroup>
                  <InputLeftElement children={<Icon as={FiCalendar} color="gray.400" />} />
                  <Input 
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                  />
                </InputGroup>
              </FormControl> */}
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