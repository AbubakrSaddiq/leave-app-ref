// ============================================
// Profile Page Component
// ============================================

import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Avatar,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  useToast,
  Badge,
  Divider,
  Icon,
  Spinner,
  Center,
  IconButton,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import {
  FiUser,
  FiShield,
  FiMail,
  FiBriefcase,
  FiCalendar,
  FiEdit,
  FiCamera,
  FiTrash2,
  FiSave,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import {
  useUpdateProfile,
  useChangePassword,
  useUploadAvatar,
  useDeleteAvatar,
} from '@/hooks/useProfile';
import { ChangePasswordForm } from './ChangePasswordForm';

export const ProfilePage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const toast = useToast();

  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const deleteAvatarMutation = useDeleteAvatar();

  const {
    isOpen: isDeleteAvatarOpen,
    onOpen: onDeleteAvatarOpen,
    onClose: onDeleteAvatarClose,
  } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      full_name: profile?.full_name || '',
    },
  });

  // Update form when profile loads
  React.useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name || '',
      });
    }
  }, [profile, reset]);

//   const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     // Validate file size (max 2MB)
//     if (file.size > 2 * 1024 * 1024) {
//       toast({
//         title: 'File too large',
//         description: 'Avatar must be less than 2MB',
//         status: 'error',
//         duration: 5000,
//       });
//       return;
//     }

//     // Validate file type
//     if (!file.type.startsWith('image/')) {
//       toast({
//         title: 'Invalid file type',
//         description: 'Please upload an image file',
//         status: 'error',
//         duration: 5000,
//       });
//       return;
//     }

//     // Show preview
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       setAvatarPreview(reader.result as string);
//     };
//     reader.readAsDataURL(file);

//     // Upload
//     try {
//       const avatarUrl = await uploadAvatarMutation.mutateAsync(file);
//       await updateProfileMutation.mutateAsync({ avatar_url: avatarUrl });
//       await refreshProfile();
//       setAvatarPreview(null);
//     } catch (error) {
//       setAvatarPreview(null);
//     }
//   };

// Handle delete avatar
//   const handleDeleteAvatar = async () => {
//     if (!profile?.avatar_url) return;

//     try {
//       await deleteAvatarMutation.mutateAsync(profile.avatar_url);
//       await updateProfileMutation.mutateAsync({ avatar_url: '' });
//       await refreshProfile();
//       onDeleteAvatarClose();
//     } catch (error) {
//       // Error handled by mutation
//     }
//   };

  const onSubmit = async (data: any) => {
    try {
      await updateProfileMutation.mutateAsync({
        full_name: data.full_name,
      });
      await refreshProfile();
      setIsEditing(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (!profile) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text>Loading profile...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            My Profile
          </Heading>
          <Text color="gray.600">Manage your account settings and preferences</Text>
        </Box>

        <Tabs colorScheme="blue" variant="enclosed">
          <TabList>
            <Tab>
              <Icon as={FiUser} mr={2} />
              General
            </Tab>
            <Tab>
              <Icon as={FiShield} mr={2} />
              Security
            </Tab>
          </TabList>

          <TabPanels>
            {/* GENERAL TAB */}
            <TabPanel p={0} pt={6}>
              <Card>
                <CardBody>
                  <VStack spacing={8} align="stretch">
                    {/* Avatar Section */}
                    {/* <VStack spacing={4}>
                      <Box position="relative">
                        <Avatar
                          size="2xl"
                          name={profile.full_name || undefined}
                          src={avatarPreview || profile.avatar_url || undefined}
                        />
                        <IconButton
                          aria-label="Change avatar"
                          icon={<FiCamera />}
                          size="sm"
                          colorScheme="blue"
                          borderRadius="full"
                          position="absolute"
                          bottom={0}
                          right={0}
                          onClick={() => fileInputRef.current?.click()}
                          isLoading={uploadAvatarMutation.isPending}
                        />
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleAvatarChange}
                          style={{ display: 'none' }}
                        />
                      </Box>

                      {profile.avatar_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          leftIcon={<FiTrash2 />}
                          onClick={onDeleteAvatarOpen}
                        >
                          Remove Avatar
                        </Button>
                      )}

                      <Text fontSize="sm" color="gray.500">
                        Click camera icon to upload new photo (max 2MB)
                      </Text>
                    </VStack> */}

                    {/* <Divider /> */}

                    {/* Profile Information */}
                    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
                      <VStack spacing={6} align="stretch">
                        <HStack justify="space-between">
                          <Heading size="md">Profile Information</Heading>
                            {/* Edit button */}
                          {/* {!isEditing ? (
                            <Button
                              leftIcon={<FiEdit />}
                              size="sm"
                              onClick={() => setIsEditing(true)}
                            >
                              Edit Profile
                            </Button>
                          ) : (
                            <HStack>
                              <Button
                                leftIcon={<FiX />}
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setIsEditing(false);
                                  reset();
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                leftIcon={<FiSave />}
                                size="sm"
                                colorScheme="blue"
                                type="submit"
                                isLoading={updateProfileMutation.isPending}
                              >
                                Save Changes
                              </Button>
                            </HStack>
                          )} */}
                        </HStack>

                        <FormControl isInvalid={!!errors.full_name}>
                          <FormLabel>Full Name</FormLabel>
                          {isEditing ? (
                            <Input
                              {...register('full_name', {
                                required: 'Name is required',
                                minLength: {
                                  value: 2,
                                  message: 'Name must be at least 2 characters',
                                },
                              })}
                              size="lg"
                            />
                          ) : (
                            <HStack spacing={2}>
                              <Icon as={FiUser} color="gray.400" />
                              <Text fontSize="lg">{profile.full_name}</Text>
                            </HStack>
                          )}
                          <FormErrorMessage>
                            {errors.full_name?.message}
                          </FormErrorMessage>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Email Address</FormLabel>
                          <HStack spacing={2}>
                            <Icon as={FiMail} color="gray.400" />
                            <Text fontSize="lg" color="gray.700">
                              {profile.email}
                            </Text>
                            <Badge colorScheme="gray" ml={2}>
                              Cannot be changed
                            </Badge>
                          </HStack>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Role</FormLabel>
                          <HStack spacing={2}>
                            <Icon as={FiShield} color="gray.400" />
                            <Badge
                              colorScheme={
                                profile.role === 'admin'
                                  ? 'purple'
                                  : profile.role === 'hr'
                                  ? 'blue'
                                  : profile.role === 'director'
                                  ? 'green'
                                  : 'gray'
                              }
                              fontSize="md"
                              px={3}
                              py={1}
                            >
                              {profile.role.toUpperCase()}
                            </Badge>
                          </HStack>
                        </FormControl>

                        {profile.department && (
                          <FormControl>
                            <FormLabel>Department</FormLabel>
                            <HStack spacing={2}>
                              <Icon as={FiBriefcase} color="gray.400" />
                              <Text fontSize="lg">
                                {profile.department.name} ({profile.department.code})
                              </Text>
                            </HStack>
                          </FormControl>
                        )}
                      </VStack>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            {/* SECURITY TAB */}
            <TabPanel p={0} pt={6}>
              <ChangePasswordForm />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Delete Avatar Confirmation */}
      {/* <AlertDialog
        isOpen={isDeleteAvatarOpen}
        leastDestructiveRef={cancelRef as React.RefObject<HTMLButtonElement>}
        onClose={onDeleteAvatarClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Remove Profile Picture</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to remove your profile picture?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteAvatarClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteAvatar}
                ml={3}
                isLoading={deleteAvatarMutation.isPending}
              >
                Remove
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog> */}
    </Container>
  );
};