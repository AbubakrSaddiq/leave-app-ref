// ============================================
// User Management Component
// ============================================

import React, { useState } from "react";
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
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Stat,
  StatLabel,
  StatNumber,
  Grid,
  Switch,
  Tooltip,
  Spinner,
} from "@chakra-ui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  getUserStatistics,
  type CreateUserParams,
  type UserFilters,
} from "@/api/users.api";
import { getDepartments } from "@/api/departments.api";
import type { UserRole } from "@/types/models";
import { formatDate } from "@/utils/date.utils";

// ============================================
// USER FORM COMPONENT
// ============================================

interface UserFormProps {
  user?: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function UserForm({ user, isOpen, onClose, onSuccess }: UserFormProps) {
  const [email, setEmail] = useState(user?.email || "");
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(user?.role || "staff");
  const [departmentId, setDepartmentId] = useState(user?.department_id || "");
  const [hireDate, setHireDate] = useState(
    user?.hire_date || new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Fetch departments
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email || !fullName || !role || !departmentId || !hireDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        status: "error",
        duration: 3000,
      });
      return;
    }

    if (!user && !password) {
      toast({
        title: "Validation Error",
        description: "Password is required for new users",
        status: "error",
        duration: 3000,
      });
      return;
    }

    if (!user && password.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (user) {
        // Update existing user
        await updateUser(user.id, {
          full_name: fullName,
          role,
          department_id: departmentId,
        });
        toast({
          title: "User updated",
          description: `${fullName} has been updated successfully`,
          status: "success",
          duration: 3000,
        });
      } else {
        // Create new user
        await createUser({
          email,
          full_name: fullName,
          password,
          role,
          department_id: departmentId,
          hire_date: hireDate,
        });
        toast({
          title: "User created",
          description: `${fullName} has been created successfully`,
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
          <ModalHeader>{user ? "Edit User" : "Create New User"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., John Doe"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., john.doe@company.com"
                  isDisabled={!!user}
                />
                {user && (
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Email cannot be changed after creation
                  </Text>
                )}
              </FormControl>

              {!user && (
                <FormControl isRequired>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    User will use this to login
                  </Text>
                </FormControl>
              )}

              <FormControl isRequired>
                <FormLabel>Role</FormLabel>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option value="staff">Staff</option>
                  <option value="director">Director</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Department</FormLabel>
                <Select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  placeholder="Select department"
                >
                  {departments?.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </Select>
              </FormControl>

              {!user && (
                <FormControl isRequired>
                  <FormLabel>Hire Date</FormLabel>
                  <Input
                    type="date"
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Leave allocation will be pro-rated based on hire date
                  </Text>
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" type="submit" isLoading={isSubmitting}>
              {user ? "Update User" : "Create User"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

// ============================================
// STATISTICS COMPONENT
// ============================================

function UserStatistics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["user-statistics"],
    queryFn: getUserStatistics,
  });

  if (isLoading) {
    return (
      <Box textAlign="center" py={4}>
        <Spinner />
      </Box>
    );
  }

  const roleColors: Record<UserRole, string> = {
    staff: "blue",
    director: "purple",
    hr: "green",
    admin: "red",
  };

  return (
    <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} mb={6}>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Total Users</StatLabel>
            <StatNumber>{stats?.total_users || 0}</StatNumber>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Active Users</StatLabel>
            <StatNumber color="green.500">
              {stats?.active_users || 0}
            </StatNumber>
          </Stat>
        </CardBody>
      </Card>

      {stats?.by_role.map((item) => (
        <Card key={item.role}>
          <CardBody>
            <Stat>
              <StatLabel>
                <Badge colorScheme={roleColors[item.role]}>
                  {item.role.toUpperCase()}
                </Badge>
              </StatLabel>
              <StatNumber>{item.count}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      ))}
    </Grid>
  );
}

// ============================================
// MAIN USER MANAGEMENT COMPONENT
// ============================================

export function UserManagement() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 20,
  });
  const cancelRef = React.useRef<HTMLButtonElement>(null!);
  const toast = useToast();
  const queryClient = useQueryClient();

  // Fetch users
  const {
    data: usersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["users", filters],
    queryFn: () => getUsers(filters),
  });

  // Fetch departments for filter
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-statistics"] });
      toast({
        title: "User deactivated",
        description: "User has been deactivated successfully",
        status: "success",
        duration: 3000,
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    },
  });

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: activateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-statistics"] });
      toast({
        title: "User activated",
        status: "success",
        duration: 3000,
      });
    },
  });

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-statistics"] });
      toast({
        title: "User deactivated",
        status: "success",
        duration: 3000,
      });
    },
  });

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    onOpen();
  };

  const handleCreate = () => {
    setSelectedUser(null);
    onOpen();
  };

  const handleCloseForm = () => {
    setSelectedUser(null);
    onClose();
  };

  const handleFormSuccess = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["user-statistics"] });
  };

  const handleToggleActive = async (user: any) => {
    if (user.is_active) {
      await deactivateMutation.mutateAsync(user.id);
    } else {
      await activateMutation.mutateAsync(user.id);
    }
  };

  const roleColors: Record<UserRole, string> = {
    staff: "blue",
    director: "purple",
    hr: "green",
    admin: "red",
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Statistics */}
      <UserStatistics />

      {/* Filters and Create Button */}
      <Card>
        <CardBody>
          <HStack spacing={4} wrap="wrap" justify="space-between">
            <HStack spacing={4} wrap="wrap">
              <FormControl maxW="200px">
                <FormLabel fontSize="sm">Search</FormLabel>
                <Input
                  size="sm"
                  placeholder="Name or email..."
                  value={filters.search || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value, page: 1 })
                  }
                />
              </FormControl>

              <FormControl maxW="150px">
                <FormLabel fontSize="sm">Role</FormLabel>
                <Select
                  size="sm"
                  value={filters.role || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      role: e.target.value as UserRole | undefined,
                      page: 1,
                    })
                  }
                >
                  <option value="">All Roles</option>
                  <option value="staff">Staff</option>
                  <option value="director">Director</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                </Select>
              </FormControl>

              <FormControl maxW="200px">
                <FormLabel fontSize="sm">Department</FormLabel>
                <Select
                  size="sm"
                  value={filters.department_id || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      department_id: e.target.value,
                      page: 1,
                    })
                  }
                >
                  <option value="">All Departments</option>
                  {departments?.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl maxW="150px">
                <FormLabel fontSize="sm">Status</FormLabel>
                <Select
                  size="sm"
                  value={
                    filters.is_active === undefined
                      ? ""
                      : String(filters.is_active)
                  }
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      is_active:
                        e.target.value === ""
                          ? undefined
                          : e.target.value === "true",
                      page: 1,
                    })
                  }
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Select>
              </FormControl>
            </HStack>

            <Button colorScheme="blue" onClick={handleCreate}>
              ➕ Create User
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <HStack justify="space-between">
            <Heading size="md">Users</Heading>
            {usersData && (
              <Text fontSize="sm" color="gray.600">
                Showing {usersData.data.length} of {usersData.pagination.total}{" "}
                users
              </Text>
            )}
          </HStack>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <Box textAlign="center" py={10}>
              <Spinner size="xl" />
              <Text mt={4}>Loading users...</Text>
            </Box>
          ) : usersData && usersData.data.length > 0 ? (
            <>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Email</Th>
                      <Th>Role</Th>
                      <Th>Department</Th>
                      <Th>Hire Date</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {usersData.data.map((user) => (
                      <Tr key={user.id}>
                        <Td fontWeight="medium">{user.full_name}</Td>
                        <Td>
                          <Text fontSize="sm">{user.email}</Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={roleColors[user.role]}>
                            {user.role.toUpperCase()}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {user.department?.name || "Unassigned"}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {formatDate(user.hire_date)}
                          </Text>
                        </Td>
                        <Td>
                          <Tooltip
                            label={
                              user.is_active
                                ? "Click to deactivate"
                                : "Click to activate"
                            }
                          >
                            <Switch
                              isChecked={user.is_active}
                              onChange={() => handleToggleActive(user)}
                              colorScheme="green"
                            />
                          </Tooltip>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Button size="sm" onClick={() => handleEdit(user)}>
                              Edit
                            </Button>
                            <Menu>
                              <MenuButton
                                as={Button}
                                size="sm"
                                variant="outline"
                              >
                                ⋮
                              </MenuButton>
                              <MenuList>
                                <MenuItem onClick={() => handleEdit(user)}>
                                  Edit Profile
                                </MenuItem>
                                <MenuItem
                                  onClick={() =>
                                    user.is_active
                                      ? deactivateMutation.mutate(user.id)
                                      : activateMutation.mutate(user.id)
                                  }
                                >
                                  {user.is_active ? "Deactivate" : "Activate"}
                                </MenuItem>
                                <MenuItem
                                  color="red.500"
                                  onClick={() => setDeleteId(user.id)}
                                >
                                  Delete (Deactivate)
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              {/* Pagination */}
              <HStack justify="space-between" mt={4}>
                <Button
                  size="sm"
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page! - 1 })
                  }
                  isDisabled={filters.page === 1}
                >
                  Previous
                </Button>
                <Text fontSize="sm">
                  Page {usersData.pagination.page} of{" "}
                  {usersData.pagination.total_pages}
                </Text>
                <Button
                  size="sm"
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page! + 1 })
                  }
                  isDisabled={filters.page === usersData.pagination.total_pages}
                >
                  Next
                </Button>
              </HStack>
            </>
          ) : (
            <Box textAlign="center" py={10}>
              <Text color="gray.500">
                No users found. Create one to get started.
              </Text>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <UserForm
        user={selectedUser}
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
            <AlertDialogHeader>Deactivate User</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure? The user will be deactivated and cannot login.
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
                Deactivate
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
}
