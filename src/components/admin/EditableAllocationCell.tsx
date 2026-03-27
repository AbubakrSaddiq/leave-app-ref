// ============================================
// EditableAllocationCell
// Click-to-edit allocated_days for one balance row
// ============================================

import React, { useState, useRef, useEffect } from "react";
import {
  HStack,
  NumberInput,
  NumberInputField,
  IconButton,
  Text,
  Spinner,
  Tooltip,
} from "@chakra-ui/react";
import { FiEdit2, FiCheck, FiX } from "react-icons/fi";
import { useUpdateAllocatedDays } from "@/hooks/useLeaveAllocation";
import type { BalanceRow } from "@/api/leaveAllocation.api";

interface Props {
  balance: BalanceRow;
}

export const EditableAllocationCell: React.FC<Props> = ({ balance }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(balance.allocated_days);
  const inputRef = useRef<HTMLInputElement>(null);
  const mutation = useUpdateAllocatedDays();

  // Re-sync draft if balance changes externally
  useEffect(() => {
    setDraft(balance.allocated_days);
  }, [balance.allocated_days]);

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (draft === balance.allocated_days) {
      setIsEditing(false);
      return;
    }
    await mutation.mutateAsync({
      balance_id: balance.id,
      allocated_days: draft,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(balance.allocated_days);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  if (mutation.isPending) {
    return (
      <HStack spacing={2} minW="80px">
        <Spinner size="xs" color="blue.500" />
        <Text fontSize="sm" color="gray.500">
          Saving…
        </Text>
      </HStack>
    );
  }

  if (isEditing) {
    return (
      <HStack spacing={1} minW="120px">
        <NumberInput
          value={draft}
          onChange={(_, val) => setDraft(isNaN(val) ? 0 : val)}
          min={0}
          max={365}
          size="sm"
          w="70px"
        >
          <NumberInputField
            ref={inputRef}
            onKeyDown={handleKeyDown}
            px={2}
            textAlign="center"
          />
        </NumberInput>
        <Tooltip label="Save (Enter)">
          <IconButton
            aria-label="Save"
            icon={<FiCheck />}
            size="xs"
            colorScheme="green"
            variant="solid"
            onClick={handleSave}
          />
        </Tooltip>
        <Tooltip label="Cancel (Esc)">
          <IconButton
            aria-label="Cancel"
            icon={<FiX />}
            size="xs"
            variant="ghost"
            colorScheme="red"
            onClick={handleCancel}
          />
        </Tooltip>
      </HStack>
    );
  }

  return (
    <HStack spacing={2} minW="80px" role="group">
      <Text fontSize="sm" fontWeight="bold" minW="30px" textAlign="center">
        {balance.allocated_days}
      </Text>
      <Tooltip label="Edit allocation">
        <IconButton
          aria-label="Edit"
          icon={<FiEdit2 />}
          size="xs"
          variant="ghost"
          colorScheme="blue"
          opacity={0}
          _groupHover={{ opacity: 1 }}
          onClick={() => setIsEditing(true)}
        />
      </Tooltip>
    </HStack>
  );
};
