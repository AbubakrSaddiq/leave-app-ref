import React, { useState, useEffect, useRef } from "react";
import {
  Box, Button, Table, Thead, Tbody, Tr, Th, Td, Badge,
  IconButton, useToast, VStack, HStack, Text, Spinner,
  Card, CardHeader, CardBody, Heading, useDisclosure,
  Avatar, Input, InputGroup, InputLeftElement,
  Menu, MenuButton, MenuList, MenuItem,
  AlertDialog, AlertDialogOverlay, AlertDialogContent, 
  AlertDialogHeader, AlertDialogBody, AlertDialogFooter
} from "@chakra-ui/react";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiMoreVertical, FiPower } from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import { UserForm } from "./UserForm";

export function UserManagement() {
  const toast = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal Controls
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const cancelRef = useRef<any>(null);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("full_name", { ascending: true });
    if (!error) setUsers(data || []);
    setLoading(false);
  };

  const fetchDepartments = async () => {
    const { data } = await supabase.from("departments").select("id, name, code");
    if (data) setDepartments(data);
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", userToDelete.id);
      if (error) throw error;
      toast({ title: "User deleted", status: "success" });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, status: "error" });
    } finally {
      setUserToDelete(null);
    }
  };

  const handleToggleStatus = async (user: any) => {
    const { error } = await supabase
      .from("users")
      .update({ is_active: !user.is_active })
      .eq("id", user.id);
    if (!error) fetchUsers();
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <VStack align="stretch" spacing={6}>
      <Card borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100">
        <CardHeader borderBottomWidth="1px">
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <Heading size="md">Staff Directory</Heading>
              <Text fontSize="xs" color="gray.500">Manage account access and departmental assignments</Text>
            </VStack>
            <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={() => { setSelectedUser(null); onOpen(); }}>
              New User
            </Button>
          </HStack>
        </CardHeader>

        <CardBody>
          <InputGroup mb={6} maxW="400px">
            <InputLeftElement children={<FiSearch color="gray.400" />} />
            <Input 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>

          {loading ? (
            <Center py={20}><Spinner color="blue.500" /></Center>
          ) : (
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Name & Profile</Th>
                  <Th>Role</Th>
                  <Th>Department</Th>
                  <Th>Status</Th>
                  <Th textAlign="right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredUsers.map((user) => (
                  <Tr key={user.id} _hover={{ bg: "gray.25" }}>
                    <Td>
                      <HStack spacing={3}>
                        <Avatar size="xs" name={user.full_name} src={user.avatar_url} />
                        <Box>
                          <Text fontWeight="bold" fontSize="xs">{user.full_name}</Text>
                          <Text fontSize="10px" color="gray.500">{user.email}</Text>
                        </Box>
                      </HStack>
                    </Td>
                    <Td>
                      <Badge variant="subtle" colorScheme={user.role === 'admin' ? 'purple' : 'gray'}>
                        {user.role}
                      </Badge>
                    </Td>
                    <Td fontSize="xs" color="gray.600">
                      {departments.find(d => d.id === user.department_id)?.code || "—"}
                    </Td>
                    <Td>
                      <Badge variant="dot" colorScheme={user.is_active ? "green" : "red"}>
                        {user.is_active ? "Active" : "Disabled"}
                      </Badge>
                    </Td>
                    <Td textAlign="right">
                      <Menu>
                        <MenuButton as={IconButton} icon={<FiMoreVertical />} size="xs" variant="ghost" />
                        <MenuList fontSize="sm">
                          <MenuItem icon={<FiEdit2 />} onClick={() => { setSelectedUser(user); onOpen(); }}>Edit Profile</MenuItem>
                          <MenuItem icon={<FiPower />} onClick={() => handleToggleStatus(user)}>
                            {user.is_active ? "Deactivate Account" : "Activate Account"}
                          </MenuItem>
                          <MenuItem icon={<FiTrash2 />} color="red.500" onClick={() => setUserToDelete(user)}>Delete User</MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <UserForm 
        key={selectedUser?.id || "new-user"}
        user={selectedUser}
        departments={departments}
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={fetchUsers}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog isOpen={!!userToDelete} leastDestructiveRef={cancelRef} onClose={() => setUserToDelete(null)}>
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">Remove Staff Member</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure? This will permanently delete <b>{userToDelete?.full_name}</b> and all their records. This cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setUserToDelete(null)} variant="ghost">Cancel</Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>Delete Forever</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
}

// Helper Center component
const Center = ({ children, ...props }: any) => <Box display="flex" justifyContent="center" alignItems="center" {...props}>{children}</Box>;