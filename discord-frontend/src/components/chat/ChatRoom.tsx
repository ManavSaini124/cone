import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Smile, Paperclip, MoreVertical, Phone, Video, User, Check, Forward, Square } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/contexts/UserContext';
import { useSocket } from '@/contexts/SocketContext';
import MessageInfo from '@/components/chat/MessageInfo';
import { useMessageInfo } from '@/hooks/useMessageInfo';
import DeleteMessageModal from '@/components/modals/DeleteMessageModal';
import { userInfo } from 'os';
import ChatRoomHeader from './ChatRoomHeader';
import ChatMessageList from './ChatMessageList';
import TypingIndicator from './TypingIndicator';
import ChatInputArea from './ChatInputArea';
import ChatInfoPanel from './ChatroomInfo';
import ForwardMessageModal from './ForwardMessageModal';
import { m } from 'framer-motion';

interface Message {
  _id: string;
  sender: { _id: string; name: string } | string;
  content: string;
  timestamp: string;
  createdAt?: string;
  isOwn: boolean;
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
}

interface ChatRoomProps {
  roomId: string;
  roomName: string;
  roomType?:'Private' | 'Group' | 'Public';
  onlineCount?: number;
  onBack?: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({
  roomId,
  roomName,
  roomType = 'Group',
  onlineCount = 5,
  onBack,
}) => {
  
  const [message, setMessage] = useState('');
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const { user } = useUser(); 
  const { messageInfo, openMessageInfo, closeMessageInfo, handleAction } = useMessageInfo();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [replyingTo, setReplyingTo] = useState<null | { _id: string; content: string; sender: { name: string } }>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardingMessages, setForwardingMessages] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<{ _id: string; name: string; email: string }[]>([]);
  const [selectedMessageForDelete, setSelectedMessageForDelete] = useState<{ id: string; content: string; senderId: string; } | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [roomDetails, setRoomDetails] = useState<{
    name: string;
    description?: string;
    createdAt: string;
    type: 'Private' | 'group' | 'Public';
    members: {
      id: string;
      name: string;
      avatar?: string;
      role?: 'admin' | 'member';
      online?: boolean;
    }[];
  } | null>(null);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);

  // if (!roomDetails) return null;

  // Fetch messages
  const socket = useSocket();


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat-rooms/${roomId}`, {
          credentials: 'include',
        });
        const data = await res.json();
        console.log('📂 Room details fetched:', data);

        if (!data.success || !data.data) {
          return
        };

        const room = data.data;

        setRoomDetails({
          name: room.name,
          description: room.description,
          createdAt: room.createdAt,
          type: room.type,
          members: room.participants.map((p: any) => ({
            id: p.user._id,
            name: p.user.name,
            avatar: p.user.avatar || '', // optional, if available
            role: p.role,
            online: false, // will handle this later
          })),
        });
      } catch (err) {
        console.error("Failed to load room details:", err);
      }
    };

    fetchRoomDetails();
  }, [roomId]);
  
  useEffect(() => {
    if (!socket || !roomId) return;
    
    const joinRoom = () => {
      console.log('🔁 Emitting join_room for:', roomId);
      socket.emit('join_room', roomId);
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.on('connect', joinRoom);
    }
    
    
    socket.on('new_message', (message) => {
      console.log('📨 Received new_message:', message);
      const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
      setMessages((prev) => [
        ...prev,
        {
          ...message,
          timestamp: message.createdAt || new Date().toISOString(),
          isOwn: senderId === user?._id,
        },
      ]);
    });

    socket.on('message_edited', ({ messageId, content, editedAt }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, content, edited: true, timestamp: editedAt } : msg
        )
      );
    });

    socket.on('user_typing', ({ userName }) => {
      setTypingUsers((prev) =>
        prev.includes(userName) ? prev : [...prev, userName]
      );
    });
    
    socket.on('user_stop_typing', ({ userName }) => {
      setTypingUsers((prev) => prev.filter((name) => name !== userName));
    });

    socket?.on("message_deleted", ({ messageId, forEveryone }) => {
      if (forEveryone) {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === messageId
              ? { ...msg, content: "This message was deleted", isDeleted: true }
              : msg
          )
        );
      } else {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      }
    });
    
    socket.on('error', (error) => {
      console.error('⚠️ Socket error from server:', error?.message || error || 'Unknown error');
    });
    
    return () => {
      socket.emit('leave_room', roomId);
      socket.off('new_message');
      socket.off('message_edited');
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('message_deleted');
      socket.off('error');
    };
  }, [socket, roomId]);

  useEffect(() => {
    if (!socket || !roomId) return;

    // ✅ Ask backend for online users in the current room
    socket.emit("get_online_users_in_room", roomId);

    // ✅ Receive and update state
    socket.on("online_users_in_room", ({ roomId: incomingRoomId, users }) => {
      if (incomingRoomId === roomId) {
        setOnlineUsers(users);
      }
    });

    return () => {
      socket.off("online_users_in_room");
    };
  }, [socket, roomId]);


  useEffect(() => {
    if (!socket || !messages.length || !user || !user._id) return; // ✅ Safe guard

    const unreadMessages = messages
      .filter((m) => Array.isArray(m.readBy) && !m.readBy.includes(user._id))
      .map((m) => m._id);

    if (unreadMessages.length) {
      socket.emit('mark_as_read', {
        roomId,
        messageIds: unreadMessages,
      });
      console.log('📬 Marked as read:', unreadMessages);
    }
  }, [messages, socket, roomId, user]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        console.log('ChatRoom fetching for roomId:', roomId);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/room/${roomId}`, {
          credentials: 'include',
        });

        const data = await res.json();

        if (!data.success || !Array.isArray(data.data)) {
          setMessages([]);
          return;
        }
          

        const messageList = data.data.map((msg: any) => ({
          _id: msg._id,
          sender: typeof msg.sender === 'object' ? msg.sender.name : msg.sender,
          content: msg.content,
          timestamp: msg.createdAt,
          isOwn: msg.sender._id === user?._id, // Use AuthContext later to check ownership
          edited: msg.isEdited,
          readBy: msg.readBy,
        }));


        setMessages(messageList);
      } catch (err) {
        console.error('Failed to load messages:', err);
        setMessages([]);
      }
    };

    fetchMessages();
  }, [roomId]);
  console.log('🧾 roomType:', roomType);

  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    if (socket) {
      socket.emit('typing_start', { roomId });

      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('typing_stop', { roomId });
      }, 1500);
    }
  };
  const getDeliveryStatus = (messageId: string): {
    deliveredTo: { name: string; timestamp: string }[];
    readBy: { name: string; timestamp: string }[];
  } => ({
    deliveredTo: [{ name: 'Marcus Johnson', timestamp: '10:33 AM' }],
    readBy: [{ name: 'Sarah Chen', timestamp: '10:35 AM' }]
  });

  const handleSendMessage = () => {
    console.log('Send button clicked! Message:', message, 'Socket:', !!socket);
    if (!message.trim() || !socket) {
      console.log('Cannot send: message empty or socket not connected');
      return;
    }

    if (editingMessageId) {
      socket.emit('edit_message', {
        messageId: editingMessageId,
        content: message.trim(),
      });
      setEditingMessageId(null);
    } else {
      socket.emit('send_message', {
        roomId,
        content: message.trim(),
        messageType: 'text',
        ...(replyingTo && { replyTo: replyingTo._id }), // ✅ only include if replying
      });
      setReplyingTo(null);
    }

    setMessage('');
  };

  
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // const formatMessageTime = (timestamp: string) => timestamp;
  const formatMessageTime = (timestamp: string) => {
    if (!timestamp) return '—';

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '—';

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const scrollToMessage = (messageId: string) => {
    const target = messageRefs.current[messageId];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('ring', 'ring-[#9cbc9c]', 'rounded-lg');
      setTimeout(() => {
        target.classList.remove('ring', 'ring-[#9cbc9c]', 'rounded-lg');
      }, 1500);
    }
  };

  const getMessageDate = (timestamp: string) => {
    const msgDate = new Date(timestamp);
    const today = new Date();

    const isToday = msgDate.toDateString() === today.toDateString();
    const isYesterday = msgDate.toDateString() === new Date(today.setDate(today.getDate() - 1)).toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    return msgDate.toLocaleDateString(); // e.g., 6/26/2024
  };
  
  const currentUserRole = roomDetails?.members?.find(
    (p: any) => p.user?._id === user?._id
  )?.role || 'member';

  const canDeleteForEveryone =
    selectedMessageForDelete?.id === user!._id 
    ||
    ['admin', 'moderator'].includes(currentUserRole);

  const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, msg) => {
    const date = getMessageDate(msg.timestamp);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  const startSelectionMode = () => setSelectionMode(true);
  const stopSelectionMode = () => {
    setSelectionMode(false);
    setSelectedMessageIds([]);
  };
  const toggleMessageSelection = (id: string) => {
    setSelectedMessageIds(prev =>
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };
  const handleForwardSelected = () => {
    const selectedMessages = messages.filter(m => selectedMessageIds.includes(m._id));
    setForwardingMessages(selectedMessages);
    setShowForwardModal(true);
    stopSelectionMode();
  };

  const handleMessageClick = (e: React.MouseEvent, id: string) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      if (!selectionMode) setSelectionMode(true);
      toggleMessageSelection(id);
    } else if (selectionMode) {
      toggleMessageSelection(id);
    } else {
      // Find the message object
      const msg = messages.find(m => m._id === id);
      if (!msg) return;
      const status = getDeliveryStatus(id);
      openMessageInfo(
        e,
        id,
        msg.content,
        status.deliveredTo,
        status.readBy,
        msg.timestamp || msg.createdAt || '',
        msg.isDeleted,
        msg.deletedFor
      );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] text-white relative">
      {/* Header */}
      <ChatRoomHeader
        roomName={roomName}
        roomType={roomType}
        onlineCount={onlineUsers.length}
        onBack={onBack}
        onClickRoomHeader={() => setShowInfoPanel(true)}
      />
      
      {roomDetails &&(
        <ChatInfoPanel
          isOpen={showInfoPanel}
          onClose={() => setShowInfoPanel(false)}
          roomId={roomId}
          currentUserRole={currentUserRole}
          roomName={roomDetails.name} 
          roomDescription={roomDetails.description || ''}
          roomType={roomDetails.type}
          createdAt={new Date(roomDetails.createdAt).toLocaleDateString()} // Placeholder, replace with actual creation date
          members={roomDetails.members} // integrate real members later
          media={[]}   // future-proof
          files={[]}
          isMuted={false}
          onToggleMute={() => console.log('Toggle mute functionality not implemented yet')}
        />
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-white/40 text-sm py-12">No messages yet</div>
          )}
          <ChatMessageList
            groupedMessages={groupedMessages}
            messageRefs={messageRefs}
            openMessageInfo={handleMessageClick}
            getDeliveryStatus={getDeliveryStatus}
            scrollToMessage={scrollToMessage}
            userId={user?._id}
            selectionMode={selectionMode}
            selectedMessageIds={selectedMessageIds}
            onSelectMessage={toggleMessageSelection}
          />
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <TypingIndicator typingUsers={typingUsers} />
      <ChatInputArea
        message={message}
        onSend={handleSendMessage}
        onTyping={handleTyping}
        onKeyPress={handleKeyPress}
        editingMessageId={editingMessageId}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        scrollToMessage={scrollToMessage}
        textareaRef={textareaRef}
        disabled={!message.trim()}
      />
      <MessageInfo
        isOpen={messageInfo.isOpen}
        onClose={closeMessageInfo}
        position={messageInfo.position}
        messageId={messageInfo.messageId}
        message={messageInfo.message}
        deliveredTo={messageInfo.deliveredTo}
        readBy={messageInfo.readBy}
        timestamp={messageInfo.timestamp}
        isOwn={!!messages.find(m => m._id === messageInfo.messageId)?.isOwn}
        onAction={(action) => {
          if (action === 'edit') {
            // const { messageId, message } = messageInfo;
            setEditingMessageId(messageInfo.messageId);
            setMessage(messageInfo.message); // Populate the textarea
            closeMessageInfo(); // Close popup
          }
          if (action === 'reply') {
            const original = messages.find((m) => m._id === messageInfo.messageId);
            if (original) {
              setReplyingTo({
                _id: original._id,
                content: original.content,
                sender: typeof original.sender === 'string' ? { name: original.sender } : original.sender // Pass actual sender name here
              });
            }
          }
          if (action === 'forward') {
            const original = messages.find(m => m._id === messageInfo.messageId);
            if (!original) return;
            setForwardingMessages([original]);
            setShowForwardModal(true);
          }
          if (action === 'delete') {
            const originalMsg = messages.find(m => m._id === messageInfo.messageId);
            if (!originalMsg) return;
            setSelectedMessageForDelete({
              id: originalMsg._id,
              content: originalMsg.content,
              senderId:
                typeof originalMsg.sender === 'string'
                  ? originalMsg.sender
                  : (originalMsg.sender as { _id: string })._id,
          });
            setShowDeleteModal(true);
            closeMessageInfo();
          }
      }}
      />
      {selectedMessageForDelete && (
        <DeleteMessageModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          messageId={selectedMessageForDelete.id}
          messageContent={selectedMessageForDelete.content}
          onDeleteForMe={(id) => socket?.emit("delete_message", { messageId: id , forEveryone: false})}
          onDeleteForEveryone={(id) => socket?.emit("delete_message", { messageId: id , forEveryone: true})}
          canDeleteForEveryone={canDeleteForEveryone}
          currentUserId={user?._id ?? ''}
        />
      )}
      {forwardingMessages.length > 0 && (
        <ForwardMessageModal
          isOpen={showForwardModal}
          onClose={() => setShowForwardModal(false)}
          messages={forwardingMessages as any}
          availableRooms={[]} // Will be fetched by the modal itself
          currentRoomId={roomId} // Exclude current room from the list
          onForward={(selectedRoomIds, messageIds) => {
            // Use socket for real-time forwarding
            socket?.emit('forward_messages', {
              messageIds,
              targetRoomIds: selectedRoomIds,
            });
          }}
        />
      )}
      {selectionMode && selectedMessageIds.length > 0 && (
        <button
          onClick={handleForwardSelected}
          className="fixed top-6 right-8 z-50 px-5 py-2 rounded-lg font-medium flex items-center gap-2 bg-[#9cbc9c] text-black hover:bg-[#7ca87c] hover:scale-105 shadow-lg transition-all duration-200"
          style={{ minWidth: 120 }}
        >
          <Forward size={18} />
          Forward
        </button>
      )}
      {selectionMode && (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-[#181818] border-t border-white/10 p-4 z-[120]">
          <div className="flex gap-2">
            <button
              onClick={stopSelectionMode}
              className="px-4 py-2 text-white/60 hover:text-white font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <span className="text-white/60 text-sm">{selectedMessageIds.length} selected</span>
          </div>
        </div>
      )}
    </div>
    
  );
};

export default ChatRoom;
