import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  useToast,
  InputGroup,
  InputLeftElement,
  Icon,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { FiGrid, FiHash, FiUser } from "react-icons/fi";
import { createDepartment, updateDepartment } from "@/api/departments.api";
import { supabase } from "@/lib/supabase";

interface DepartmentFormProps {
  department?: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({
  department,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: department?.name || "",
    code: department?.code || "",
    director_id: department?.director_id || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Fetch potential directors (users with director/admin role)
  const { data: directors } = useQuery({
    queryKey: ["directors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email")
        .in("role", ["director", "admin"])
        .eq("is_active", true)
        .order("full_name");

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (department?.id) {
        await updateDepartment(department.id, formData);
      } else {
        await createDepartment(formData);
      }
      
      toast({
        title: `Department ${department ? "updated" : "created"}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius="xl" shadow="2xl">
        <form onSubmit={handleSubmit}>
          <ModalHeader borderBottomWidth="1px" py={4}>
            {department ? "Edit Department" : "New Department"}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody py={6}>
            <VStack spacing={5}>
              <FormControl isRequired>
                <FormLabel fontWeight="bold" fontSize="sm">Department Name</FormLabel>
                <InputGroup>
                  <InputLeftElement children={<Icon as={FiGrid} color="gray.400" />} />
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Information Technology"
                    focusBorderColor="blue.400"
                  />
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="bold" fontSize="sm">Department Code</FormLabel>
                <InputGroup>
                  <InputLeftElement children={<Icon as={FiHash} color="gray.400" />} />
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., ICT"
                    maxLength={10}
                    focusBorderColor="blue.400"
                  />
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="bold" fontSize="sm">Department Director</FormLabel>
                <InputGroup>
                  <InputLeftElement children={<Icon as={FiUser} color="gray.400" />} />
                  <Select
                    pl="40px"
                    value={formData.director_id}
                    onChange={(e) => setFormData({ ...formData, director_id: e.target.value })}
                    placeholder="Select director"
                    focusBorderColor="blue.400"
                  >
                    {directors?.map((director) => (
                      <option key={director.id} value={director.id}>
                        {director.full_name}
                      </option>
                    ))}
                  </Select>
                </InputGroup>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter bg="gray.50" borderBottomRadius="xl">
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" type="submit" isLoading={isSubmitting} px={8}>
              {department ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};