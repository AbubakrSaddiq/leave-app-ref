// ============================================
// Approval Modal Component
// Modal for approve/reject with comments
// ============================================

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
  Textarea,
  VStack,
  Text,
} from "@chakra-ui/react";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comments: string) => void;
  type: "approve" | "reject";
  applicationNumber: string;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  applicationNumber,
}) => {
  const [comments, setComments] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (type === "reject" && !comments.trim()) {
      setError("Comments are required when rejecting");
      return;
    }

    onConfirm(comments.trim());
    setComments("");
    setError("");
  };

  const handleClose = () => {
    setComments("");
    setError("");
    onClose();
  };

  const isApprove = type === "approve";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isApprove ? "Approve" : "Reject"} Leave Application
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text>
              Application: <strong>{applicationNumber}</strong>
            </Text>

            <Text color="gray.600">
              {isApprove
                ? "Are you sure you want to approve this leave application?"
                : "Please provide a reason for rejection:"}
            </Text>

            <FormControl isInvalid={!!error}>
              <FormLabel>
                Comments{" "}
                {type === "reject" && <span style={{ color: "red" }}>*</span>}
              </FormLabel>
              <Textarea
                value={comments}
                onChange={(e) => {
                  setComments(e.target.value);
                  setError("");
                }}
                placeholder={
                  isApprove
                    ? "Optional comments..."
                    : "Reason for rejection (required)"
                }
                rows={4}
              />
              {error && (
                <Text color="red.500" fontSize="sm" mt={2}>
                  {error}
                </Text>
              )}
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            colorScheme={isApprove ? "green" : "red"}
            onClick={handleConfirm}
          >
            {isApprove ? "Approve" : "Reject"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
