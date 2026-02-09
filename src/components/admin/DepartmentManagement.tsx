import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Heading,
  HStack,
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
  Avatar,
  Spinner,
  Center,
  Icon,
} from "@chakra-ui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiPlus, FiEdit2, FiTrash2, FiInfo } from "react-icons/fi";
import { getDepartments, deleteDepartment } from "@/api/departments.api";
import { DepartmentForm } from "./DepartmentForm";

export function DepartmentManagement() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null!);
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: departments, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast({ title: "Department removed successfully", status: "success" });
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, status: "error" });
    }
  });

  const handleEdit = (dept: any) => {
    setSelectedDept(dept);
    onOpen();
  };

  const handleCreate = () => {
    setSelectedDept(null);
    onOpen();
  };

  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between">
          <Box>
            <Heading size="md">Department Management</Heading>
            <Text fontSize="sm" color="gray.500">Create and manage organizational units and their leadership.</Text>
          </Box>
          <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleCreate} boxShadow="sm">
            Add Department
          </Button>
        </HStack>

        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" shadow="sm" overflow="hidden">
          {isLoading ? (
            <Center py={20}>
              <VStack spacing={4}>
                <Spinner color="blue.500" />
                <Text color="gray.500">Loading your organization structure...</Text>
              </VStack>
            </Center>
          ) : departments && departments.length > 0 ? (
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th color="gray.600" width="120px">Code</Th>
                  <Th color="gray.600">Department Name</Th>
                  <Th color="gray.600">Director</Th>
                  <Th color="gray.600" textAlign="right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {departments.map((dept: any) => (
                  <Tr key={dept.id} _hover={{ bg: "gray.25" }}>
                    <Td>
                      <Badge variant="subtle" colorScheme="blue" px={2} py={1} borderRadius="md">
                        {dept.code}
                      </Badge>
                    </Td>
                    <Td fontWeight="bold" fontSize="sm">{dept.name}</Td>
                    <Td>
                      {dept.director ? (
                        <HStack spacing={2}>
                          <Avatar size="xs" name={dept.director.full_name} src={dept.director.avatar_url} />
                          <VStack align="start" spacing={0}>
                            <Text fontSize="xs" fontWeight="bold">{dept.director.full_name}</Text>
                            <Text fontSize="xs" color="gray.500">{dept.director.email}</Text>
                          </VStack>
                        </HStack>
                      ) : (
                        <Badge variant="ghost" colorScheme="orange" fontSize="10px">No Director</Badge>
                      )}
                    </Td>
                    <Td textAlign="right">
                      <HStack spacing={1} justify="flex-end">
                        <IconButton
                          aria-label="Edit"
                          icon={<FiEdit2 />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(dept)}
                        />
                        <IconButton
                          aria-label="Delete"
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => setDeleteId(dept.id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Center py={20}>
              <VStack spacing={2}>
                <Icon as={FiInfo} boxSize={8} color="gray.300" />
                <Text color="gray.500">No departments found. Start by creating one.</Text>
              </VStack>
            </Center>
          )}
        </Box>
      </VStack>

      {/* The Key prop forces a clean mount/unmount to reset internal form state */}
      <DepartmentForm
        key={selectedDept?.id || "new-dept"}
        department={selectedDept}
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["departments"] })}
      />

      <AlertDialog
        isOpen={deleteId !== null}
        leastDestructiveRef={cancelRef}
        onClose={() => setDeleteId(null)}
        isCentered
      >
        <AlertDialogOverlay backdropFilter="blur(2px)">
          <AlertDialogContent borderRadius="xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirm Delete
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? This action cannot be undone and will affect all users currently assigned to this department.
            </AlertDialogBody>

            <AlertDialogFooter bg="gray.50" borderBottomRadius="xl">
              <Button ref={cancelRef} onClick={() => setDeleteId(null)} variant="ghost">
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                ml={3}
                isLoading={deleteMutation.isPending}
              >
                Delete Forever
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}