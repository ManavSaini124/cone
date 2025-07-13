export interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
  } | string;
  timestamp?: string;
  createdAt?: string;
  isOwn?: boolean;
  edited?: boolean;
  readBy?: string[];
  deliveredTo?: string[];
  replyTo?: {
    _id: string;
    content: string;
    sender: { name: string };
  };
  isDeleted?: boolean;
  deletedFor?: string[];
  isForwarded?: boolean;
  forwardedFrom?: {
    originalMessage: string;
    originalSender: {
      _id: string;
      name: string;
    };
    originalRoom: {
      _id: string;
      name: string;
    };
    forwardedBy: {
      _id: string;
      name: string;
    };
    forwardedAt: string;
  };
}

export interface ForwardMessageRequest {
  messageIds: string[];
  targetRoomIds: string[];
  content?: string;
}

export interface ForwardMessageResponse {
  success: boolean;
  data: Message[];
  message: string;
}
