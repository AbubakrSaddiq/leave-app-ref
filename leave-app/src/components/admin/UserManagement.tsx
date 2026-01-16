// ============================================
// USER MANAGEMENT - COMPLETE FRESH START
// File: src/components/admin/UserManagement.tsx
// ============================================

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  Text,
  Spinner,
  Card,
  CardHeader,
  CardBody,
  Heading,
} from "@chakra-ui/react";
import { EditIcon, DeleteIcon, AddIcon } from "@chakra-ui/icons";
import { supabase } from "@/lib/supabase";

// ============================================
// TYPES
// ============================================

type UserRole = "staff" | "director" | "hr" | "admin";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id: string | null;
  hire_date: string;
  is_active: boolean;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

// ============================================
// USER MANAGEMENT COMPONENT
// ============================================

export function UserManagement() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    password: "",
    role: "staff" as UserRole,
    department_id: "",
    hire_date: new Date().toISOString().split("T")[0],
  });

  // ============================================
  // FETCH DATA
  // ============================================

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("Fetched users:", data);
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error loading users",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name, code")
        .order("name");

      if (error) throw error;
      setDepartments(data || []);
    } catch (error: any) {
      console.error("Error fetching departments:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();

    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  // ============================================
  // CREATE USER
  // ============================================

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.full_name || !formData.password) {
      toast({
        title: "Missing required fields",
        description: "Email, name, and password are required",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      console.log("Step 1: Creating auth user...");

      // Step 1: Create authentication user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: undefined, // Prevent email confirmation
        },
      });

      if (authError) {
        console.error("Auth error:", authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error("No user returned from signup");
      }

      const userId = authData.user.id;
      console.log("Auth user created with ID:", userId);

      // Step 2: Insert user profile into database
      console.log("Step 2: Creating database profile...");

      const { error: dbError } = await supabase.from("users").insert([
        {
          id: userId,
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          department_id: formData.department_id || null,
          hire_date: formData.hire_date,
          is_active: true,
        },
      ]);

      if (dbError) {
        console.error("Database error:", dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log("User profile created successfully");

      // Step 3: Allocate leave balances
      console.log("Step 3: Allocating leave balances...");

      try {
        const { error: allocateError } = await supabase.rpc(
          "allocate_leave_for_user",
          {
            p_user_id: userId,
            p_year: new Date().getFullYear(),
          }
        );

        if (allocateError) {
          console.warn("Leave allocation warning:", allocateError);
        } else {
          console.log("Leave balances allocated");
        }
      } catch (allocError) {
        console.warn("Non-critical: Failed to allocate leave", allocError);
      }

      // Success!
      toast({
        title: "✅ User created successfully",
        description: `${formData.full_name} has been added`,
        status: "success",
        duration: 4000,
      });

      // Reset form and close modal
      setFormData({
        email: "",
        full_name: "",
        password: "",
        role: "staff",
        department_id: "",
        hire_date: new Date().toISOString().split("T")[0],
      });
      setShowCreateModal(false);

      // Refresh user list
      fetchUsers();
    } catch (error: any) {
      console.error("Create user error:", error);
      toast({
        title: "❌ Failed to create user",
        description: error.message || "Unknown error occurred",
        status: "error",
        duration: 6000,
      });
    }
  };

  // ============================================
  // UPDATE USER
  // ============================================

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: formData.full_name,
          role: formData.role,
          department_id: formData.department_id || null,
          hire_date: formData.hire_date,
        })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast({
        title: "✅ User updated",
        status: "success",
        duration: 3000,
      });

      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "❌ Update failed",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    }
  };

  // ============================================
  // DELETE USER
  // ============================================

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Delete ${user.full_name}? This cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase.from("users").delete().eq("id", user.id);

      if (error) throw error;

      toast({
        title: "✅ User deleted",
        status: "success",
        duration: 3000,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "❌ Delete failed",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    }
  };

  // ============================================
  // TOGGLE ACTIVE STATUS
  // ============================================

  const handleToggleActive = async (user: User) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_active: !user.is_active })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: `User ${user.is_active ? "deactivated" : "activated"}`,
        status: "success",
        duration: 2000,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Failed to update status",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    }
  };

  // ============================================
  // HELPERS
  // ============================================

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "purple";
      case "hr":
        return "blue";
      case "director":
        return "green";
      default:
        return "gray";
    }
  };

  const getDepartmentName = (deptId: string | null) => {
    if (!deptId) return "-";
    const dept = departments.find((d) => d.id === deptId);
    return dept ? `${dept.name} (${dept.code})` : "-";
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      password: "",
      role: user.role,
      department_id: user.department_id || "",
      hire_date: user.hire_date,
    });
    setShowEditModal(true);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card>
      <CardHeader>
        <HStack justify="space-between">
          <Heading size="md">👥 User Management</Heading>
          <HStack>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={() => setShowCreateModal(true)}
            >
              Create User
            </Button>
          </HStack>
        </HStack>
      </CardHeader>

      <CardBody>
        {loading ? (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" />
            <Text mt={4}>Loading users...</Text>
          </Box>
        ) : users.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Text fontSize="lg" color="gray.500" mb={4}>
              No users found
            </Text>
            <Button colorScheme="blue" onClick={() => setShowCreateModal(true)}>
              Create Your First User
            </Button>
          </Box>
        ) : (
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
                {users.map((user) => (
                  <Tr key={user.id}>
                    <Td fontWeight="medium">{user.full_name}</Td>
                    <Td>{user.email}</Td>
                    <Td>
                      <Badge colorScheme={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </Td>
                    <Td>{getDepartmentName(user.department_id)}</Td>
                    <Td>{new Date(user.hire_date).toLocaleDateString()}</Td>
                    <Td>
                      <Badge
                        colorScheme={user.is_active ? "green" : "red"}
                        cursor="pointer"
                        onClick={() => handleToggleActive(user)}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Edit user"
                          icon={<EditIcon />}
                          size="sm"
                          onClick={() => openEditModal(user)}
                        />
                        <IconButton
                          aria-label="Delete user"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleDeleteUser(user)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </CardBody>

      {/* CREATE USER MODAL */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New User</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleCreateUser}>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="user@company.com"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Full Name</FormLabel>
                  <Input
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Minimum 6 characters"
                  />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Password must be at least 6 characters
                  </Text>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as UserRole,
                      })
                    }
                  >
                    <option value="staff">Staff</option>
                    <option value="director">Director</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Department (Optional)</FormLabel>
                  <Select
                    value={formData.department_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        department_id: e.target.value,
                      })
                    }
                  >
                    <option value="">No Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Hire Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) =>
                      setFormData({ ...formData, hire_date: e.target.value })
                    }
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button
                variant="ghost"
                mr={3}
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button colorScheme="blue" type="submit">
                Create User
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit User</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleUpdateUser}>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input value={formData.email} isReadOnly bg="gray.50" />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Email cannot be changed
                  </Text>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Full Name</FormLabel>
                  <Input
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as UserRole,
                      })
                    }
                  >
                    <option value="staff">Staff</option>
                    <option value="director">Director</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Department</FormLabel>
                  <Select
                    value={formData.department_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        department_id: e.target.value,
                      })
                    }
                  >
                    <option value="">No Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Hire Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) =>
                      setFormData({ ...formData, hire_date: e.target.value })
                    }
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button
                variant="ghost"
                mr={3}
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button colorScheme="blue" type="submit">
                Update User
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Card>
  );
}
