import { useState, useCallback } from 'react';

interface MessageInfoState {
  isOpen: boolean;
  position: { x: number; y: number };
  messageId: string;
  message: string;
  deliveredTo: Array<{ name: string; timestamp: string }>;
  readBy: Array<{ name: string; timestamp: string }>;
  timestamp: string;
  isDeleted?: boolean;
  deletedFor?: string[];
}

export const useMessageInfo = () => {
  const [messageInfo, setMessageInfo] = useState<MessageInfoState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    messageId: '',
    message: '',
    deliveredTo: [],
    readBy: [],
    timestamp: '',
    isDeleted: false,
    deletedFor: []
  });

const openMessageInfo = useCallback(
  (
    e: React.MouseEvent,
    messageId: string,
    message: string,
    deliveredTo: Array<{ name: string; timestamp: string }> = [],
    readBy: Array<{ name: string; timestamp: string }> = [],
    timestamp: string,
  isDeleted: boolean = false,
    deletedFor: string[] = []
  ) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setMessageInfo({
      isOpen: true,
      position: { x: rect.left + rect.width / 2, y: rect.top },
      messageId,
      message,
      deliveredTo,
      readBy,
      timestamp,
      isDeleted,
      deletedFor,
    });
  },
  []
);

  const closeMessageInfo = useCallback(() => {
    setMessageInfo((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleAction = useCallback((action: string) => {
    console.log(`Action triggered: ${action} for message ${messageInfo.messageId}`);
  }, [messageInfo.messageId]);

  return {
    messageInfo,
    openMessageInfo,
    closeMessageInfo,
    handleAction
  };
};
