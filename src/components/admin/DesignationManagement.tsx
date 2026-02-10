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
  Spinner,
  Center,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiPlus, FiEdit2, FiTrash2, FiInfo, FiAward, FiHash } from "react-icons/fi";
import { 
  getDesignations, 
  createDesignation, 
  updateDesignation, 
  deleteDesignation,
  isDesignationInUse 
} from "@/api/designation.api";

interface DesignationFormProps {
  designation?: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DesignationForm: React.FC<DesignationFormProps> = ({
  designation,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: designation?.name || "",
    code: designation?.code || "",
    description: designation?.description || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (designation?.id) {
        await updateDesignation(designation.id, formData);
      } else {
        await createDesignation(formData);
      }
      
      toast({
        title: `Designation ${designation ? "updated" : "created"}`,
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
            {designation ? "Edit Designation" : "New Designation"}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody py={6}>
            <VStack spacing={5}>
              <FormControl isRequired>
                <FormLabel fontWeight="bold" fontSize="sm">Designation Name</FormLabel>
                <InputGroup>
                  <InputLeftElement children={<Icon as={FiAward} color="gray.400" />} />
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Senior Officer"
                    focusBorderColor="blue.400"
                  />
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="bold" fontSize="sm">Designation Code</FormLabel>
                <InputGroup>
                  <InputLeftElement children={<Icon as={FiHash} color="gray.400" />} />
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SNR-OFF"
                    maxLength={20}
                    focusBorderColor="blue.400"
                  />
                </InputGroup>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Short code for reports and displays
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="bold" fontSize="sm">Description (Optional)</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this designation..."
                  rows={3}
                  focusBorderColor="blue.400"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter bg="gray.50" borderBottomRadius="xl">
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" type="submit" isLoading={isSubmitting} px={8}>
              {designation ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export function DesignationManagement() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedDesignation, setSelectedDesignation] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null!);
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: designations, isLoading } = useQuery({
    queryKey: ["designations"],
    queryFn: getDesignations,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check if in use first
      const inUse = await isDesignationInUse(id);
      if (inUse) {
        throw new Error("Cannot delete designation that is assigned to users");
      }
      return deleteDesignation(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations"] });
      toast({ title: "Designation removed successfully", status: "success" });
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, status: "error" });
    }
  });

  const handleEdit = (designation: any) => {
    setSelectedDesignation(designation);
    onOpen();
  };

  const handleCreate = () => {
    setSelectedDesignation(null);
    onOpen();
  };

  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between">
          <Box>
            <Heading size="md">Designation Management</Heading>
            <Text fontSize="sm" color="gray.500">
              Manage job titles and positions for staff members.
            </Text>
          </Box>
          <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleCreate} boxShadow="sm">
            Add Designation
          </Button>
        </HStack>

        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.100" shadow="sm" overflow="hidden">
          {isLoading ? (
            <Center py={20}>
              <VStack spacing={4}>
                <Spinner color="blue.500" />
                <Text color="gray.500">Loading designations...</Text>
              </VStack>
            </Center>
          ) : designations && designations.length > 0 ? (
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th color="gray.600" width="200px">Code</Th>
                  <Th color="gray.600">Designation Name</Th>
                  <Th color="gray.600">Description</Th>
                  <Th color="gray.600" textAlign="right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {designations.map((designation: any) => (
                  <Tr key={designation.id} _hover={{ bg: "gray.25" }}>
                    <Td>
                      <Badge variant="subtle" colorScheme="blue" px={2} py={1} borderRadius="md" fontFamily="mono">
                        {designation.code}
                      </Badge>
                    </Td>
                    <Td fontWeight="bold" fontSize="sm">{designation.name}</Td>
                    <Td>
                      <Text fontSize="xs" color="gray.600" noOfLines={2}>
                        {designation.description || "—"}
                      </Text>
                    </Td>
                    <Td textAlign="right">
                      <HStack spacing={1} justify="flex-end">
                        <IconButton
                          aria-label="Edit"
                          icon={<FiEdit2 />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(designation)}
                        />
                        <IconButton
                          aria-label="Delete"
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => setDeleteId(designation.id)}
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
                <Text color="gray.500">No designations found. Start by creating one.</Text>
              </VStack>
            </Center>
          )}
        </Box>
      </VStack>

      <DesignationForm
        key={selectedDesignation?.id || "new-designation"}
        designation={selectedDesignation}
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["designations"] })}
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
              Are you sure? This action cannot be undone. If this designation is assigned to any users, the deletion will fail.
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