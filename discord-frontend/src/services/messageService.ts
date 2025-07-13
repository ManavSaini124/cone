const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export interface ForwardMessageRequest {
  messageIds: string[];
  targetRoomIds: string[];
  content?: string;
}

export interface ForwardMessageResponse {
  success: boolean;
  data: any[];
  message: string;
}

export const messageService = {
  // Forward messages via API
  forwardMessages: async (data: ForwardMessageRequest): Promise<ForwardMessageResponse> => {
    const response = await fetch(`${BASE_URL}/messages/forward`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to forward messages');
    }

    return response.json();
  },

  // Get messages for a room
  getMessages: async (roomId: string, page: number = 1, limit: number = 50) => {
    const response = await fetch(`${BASE_URL}/messages/room/${roomId}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch messages');
    }

    return response.json();
  },

  // Send a message
  sendMessage: async (roomId: string, content: string, messageType: string = 'text', replyTo?: string) => {
    const response = await fetch(`${BASE_URL}/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        roomId,
        content,
        messageType,
        replyTo,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send message');
    }

    return response.json();
  },

  // Edit a message
  editMessage: async (messageId: string, content: string) => {
    const response = await fetch(`${BASE_URL}/messages/${messageId}/edit`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to edit message');
    }

    return response.json();
  },

  // Delete a message
  deleteMessage: async (messageId: string) => {
    const response = await fetch(`${BASE_URL}/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete message');
    }

    return response.json();
  },

  // Mark messages as read
  markAsRead: async (roomId: string, messageIds: string[]) => {
    const response = await fetch(`${BASE_URL}/messages/room/${roomId}/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ messageIds }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to mark messages as read');
    }

    return response.json();
  },

  // Get unread count for a room
  getUnreadCount: async (roomId: string) => {
    const response = await fetch(`${BASE_URL}/messages/room/${roomId}/unread-count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get unread count');
    }

    return response.json();
  },
};
