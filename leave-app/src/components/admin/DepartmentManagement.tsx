// ============================================
// Department Management Component
// ============================================

import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
  Text,
  Badge,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/api/departments.api";
import { supabase } from "@/lib/supabase";

interface DepartmentFormProps {
  department?: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function DepartmentForm({
  department,
  isOpen,
  onClose,
  onSuccess,
}: DepartmentFormProps) {
  const [name, setName] = useState(department?.name || "");
  const [code, setCode] = useState(department?.code || "");
  const [directorId, setDirectorId] = useState(department?.director_id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Fetch potential directors (users with director/admin role)
  const { data: directors } = useQuery({
    queryKey: ["directors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email, role")
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
      if (department) {
        // Update existing
        await updateDepartment(department.id, {
          name,
          code,
          director_id: directorId || null,
        });
        toast({
          title: "Department updated",
          status: "success",
          duration: 3000,
        });
      } else {
        // Create new
        await createDepartment({
          name,
          code,
          director_id: directorId || undefined,
        });
        toast({
          title: "Department created",
          status: "success",
          duration: 3000,
        });
      }
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
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            {department ? "Edit Department" : "Create Department"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Department Name</FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Engineering"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Department Code</FormLabel>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g., ENG"
                  maxLength={10}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Department Director</FormLabel>
                <Select
                  value={directorId}
                  onChange={(e) => setDirectorId(e.target.value)}
                  placeholder="Select director (optional)"
                >
                  {directors?.map((director) => (
                    <option key={director.id} value={director.id}>
                      {director.full_name} ({director.email})
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" type="submit" isLoading={isSubmitting}>
              {department ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

export function DepartmentManagement() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null) as any;
  const toast = useToast();
  const queryClient = useQueryClient();

  // Fetch departments
  const {
    data: departments,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast({
        title: "Department deleted",
        status: "success",
        duration: 3000,
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting department",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    },
  });

  const handleEdit = (department: any) => {
    setSelectedDepartment(department);
    onOpen();
  };

  const handleCreate = () => {
    setSelectedDepartment(null);
    onOpen();
  };

  const handleCloseForm = () => {
    setSelectedDepartment(null);
    onClose();
  };

  const handleFormSuccess = () => {
    refetch();
  };

  return (
    <Box>
      <Card>
        <CardHeader>
          <HStack justify="space-between">
            <Heading size="md">Department Management</Heading>
            <Button colorScheme="blue" onClick={handleCreate}>
              Create Department
            </Button>
          </HStack>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <Text>Loading departments...</Text>
          ) : departments && departments.length > 0 ? (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Code</Th>
                  <Th>Name</Th>
                  <Th>Director</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {departments.map((dept: any) => (
                  <Tr key={dept.id}>
                    <Td>
                      <Badge colorScheme="blue">{dept.code}</Badge>
                    </Td>
                    <Td fontWeight="medium">{dept.name}</Td>
                    <Td>
                      {dept.director ? (
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm">{dept.director.full_name}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {dept.director.email}
                          </Text>
                        </VStack>
                      ) : (
                        <Text fontSize="sm" color="gray.400">
                          No director assigned
                        </Text>
                      )}
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button size="sm" onClick={() => handleEdit(dept)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => setDeleteId(dept.id)}
                        >
                          Delete
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Text color="gray.500">
              No departments found. Create one to get started.
            </Text>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <DepartmentForm
        department={selectedDepartment}
        isOpen={isOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        isOpen={deleteId !== null}
        leastDestructiveRef={cancelRef}
        onClose={() => setDeleteId(null)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Delete Department</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure? This will affect all users in this department.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                ml={3}
                isLoading={deleteMutation.isPending}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
