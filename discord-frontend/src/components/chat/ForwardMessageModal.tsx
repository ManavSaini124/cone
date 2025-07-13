import React, { useState, useEffect } from 'react';
import { X, Check, Forward, Users, MessageSquare } from 'lucide-react';
import { messageService } from '@/services/messageService';
import { chatService } from '@/services/chatService';
import { toast } from 'react-hot-toast';

interface ChatRoom {
  _id: string;
  name: string;
  avatar?: string;
  type: 'private' | 'group';
  lastActivity?: string;
}

interface Message {
  _id: string;
  content: string;
  sender: {
    name: string;
  };
  createdAt?: string;
  timestamp?: string;
}

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onForward?: (selectedRoomIds: string[], messageIds: string[]) => void;
  availableRooms?: ChatRoom[];
  currentRoomId?: string; // To exclude current room from the list
}

const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  isOpen,
  onClose,
  messages,
  onForward,
  availableRooms = [],
  currentRoomId
}) => {
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [customContent, setCustomContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>(availableRooms);

  // Initialize selected messages with all provided messages
  useEffect(() => {
    if (messages.length > 0) {
      setSelectedMessages(new Set(messages.map(msg => msg._id)));
    }
  }, [messages]);

  // Fetch available rooms if not provided
  useEffect(() => {
    if (availableRooms.length === 0) {
      console.log('ForwardMessageModal: Fetching available rooms...');
      fetchAvailableRooms();
    }
  }, []);

  const fetchAvailableRooms = async () => {
    try {
      setIsLoadingRooms(true);
      const response = await chatService.getRooms();
      console.log('Fetched rooms for forwarding:', response);
      
      // Transform the response to match our ChatRoom interface
      const transformedRooms = response.map((room: any) => ({
        _id: room._id,
        name: room.name,
        type: room.type || 'group',
        lastActivity: room.lastActivity ? new Date(room.lastActivity).toLocaleString() : 'No activity',
        avatar: room.avatar
      }));
      
      // Filter out the current room if specified
      const filteredRooms = currentRoomId 
        ? transformedRooms.filter((room: ChatRoom) => room._id !== currentRoomId)
        : transformedRooms;
      
      setRooms(filteredRooms);
      console.log('ForwardMessageModal: Successfully loaded', filteredRooms.length, 'rooms');
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      toast.error('Failed to load available rooms');
      
      // Fallback to sample data if API fails
      setRooms([
        { _id: '1', name: 'Marketing Team', type: 'group', lastActivity: '2 hours ago' },
        { _id: '2', name: 'John Doe', type: 'private', lastActivity: '30 minutes ago' },
        { _id: '3', name: 'Product Development', type: 'group', lastActivity: '1 hour ago' },
        { _id: '4', name: 'Sarah Chen', type: 'private', lastActivity: '5 minutes ago' },
        { _id: '5', name: 'Customer Support', type: 'group', lastActivity: '3 hours ago' },
      ]);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  if (!isOpen) return null;

  const handleRoomToggle = (roomId: string) => {
    const newSelected = new Set(selectedRooms);
    if (newSelected.has(roomId)) {
      newSelected.delete(roomId);
    } else {
      newSelected.add(roomId);
    }
    setSelectedRooms(newSelected);
  };

  const handleMessageToggle = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const handleForward = async () => {
    if (selectedRooms.size === 0) {
      toast.error('Please select at least one room');
      return;
    }

    if (selectedMessages.size === 0) {
      toast.error('Please select at least one message');
      return;
    }

    setIsLoading(true);

    try {
      const messageIds = Array.from(selectedMessages);
      const roomIds = Array.from(selectedRooms);

      // Use API method
      await messageService.forwardMessages({
        messageIds,
        targetRoomIds: roomIds,
        content: customContent || undefined
      });

      toast.success(`Forwarded ${messageIds.length} message(s) to ${roomIds.length} room(s)`);
      
      // Call the onForward callback if provided
      if (onForward) {
        onForward(roomIds, messageIds);
      }

      onClose();
      setSelectedRooms(new Set());
      setSelectedMessages(new Set());
      setCustomContent('');
    } catch (error) {
      console.error('Forward error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to forward messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const selectedMessageCount = selectedMessages.size;
  const selectedRoomCount = selectedRooms.size;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={handleBackdropClick}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="w-full max-w-2xl bg-[#121212] rounded-xl shadow-xl border border-white/10 backdrop-blur-lg max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Forward size={20} />
                Forward Messages
              </h2>
              <p className="text-sm text-white/60 mt-1">
                Select messages and chats you want to forward to
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
            >
              <X size={18} className="text-white/60 hover:text-white" />
            </button>
          </div>

          {/* Main content (scrollable) */}
          <div className="flex-1 flex h-[60vh] overflow-y-auto">
            {/* Left Panel - Messages */}
            <div className="w-1/2 p-6 border-r border-white/10 overflow-y-auto">
              <h3 className="text-sm font-medium text-white/80 mb-4 flex items-center gap-2">
                <MessageSquare size={16} />
                Messages to Forward ({selectedMessageCount})
              </h3>
              
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-white/50">No messages to forward</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => {
                    const isSelected = selectedMessages.has(message._id);
                    return (
                      <div
                        key={message._id}
                        onClick={() => handleMessageToggle(message._id)}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'bg-[#9cbc9c]/10 ring-1 ring-[#9cbc9c] text-white' 
                            : 'hover:bg-white/5 text-white/80'
                        }`}
                      >
                        {/* Selection Indicator */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 mt-1 ${
                          isSelected 
                            ? 'border-[#9cbc9c] bg-[#9cbc9c]' 
                            : 'border-white/30'
                        }`}>
                          {isSelected && (
                            <Check size={12} className="text-black" />
                          )}
                        </div>
                        
                        {/* Message Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-white/50">
                              {typeof message.sender === 'string' ? message.sender : message.sender.name}
                            </span>
                            <span className="text-xs text-white/30">
                              {new Date(message.createdAt || message.timestamp || '').toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-white/70 line-clamp-2">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Panel - Rooms */}
            <div className="w-1/2 p-6 overflow-y-auto">
              <h3 className="text-sm font-medium text-white/80 mb-4 flex items-center gap-2">
                <Users size={16} />
                Available Chats ({selectedRoomCount})
              </h3>
              
              {isLoadingRooms ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9cbc9c] mx-auto mb-2"></div>
                  <p className="text-xs text-white/50">Loading available chats...</p>
                </div>
              ) : rooms.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-white/50">No available chats</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rooms.map((room) => {
                    const isSelected = selectedRooms.has(room._id);
                    return (
                      <div
                        key={room._id}
                        onClick={() => handleRoomToggle(room._id)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'bg-[#9cbc9c]/10 ring-1 ring-[#9cbc9c] text-white' 
                            : 'hover:bg-white/5 text-white/80'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9cbc9c]/20 to-[#c9a896]/20 flex items-center justify-center">
                          {room.type === 'group' ? (
                            <span className="text-sm">👥</span>
                          ) : (
                            <span className="text-sm">👤</span>
                          )}
                        </div>
                        
                        {/* Room Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{room.name}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              room.type === 'private' 
                                ? 'bg-[#c9a896]/20 text-[#c9a896]' 
                                : 'bg-[#9cbc9c]/20 text-[#9cbc9c]'
                            }`}>
                              {room.type}
                            </span>
                          </div>
                          {room.lastActivity && (
                            <p className="text-xs text-white/50 mt-1">
                              {room.lastActivity}
                            </p>
                          )}
                        </div>
                        
                        {/* Selection Indicator */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          isSelected 
                            ? 'border-[#9cbc9c] bg-[#9cbc9c]' 
                            : 'border-white/30'
                        }`}>
                          {isSelected && (
                            <Check size={12} className="text-black" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Custom Content Input */}
          <div className="p-6 border-t border-white/10">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Custom Message (Optional)
            </label>
            <textarea
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              placeholder="Add a custom message to accompany the forwarded messages..."
              className="w-full p-3 bg-black/40 rounded-lg border border-white/10 text-white placeholder-white/40 resize-none"
              rows={2}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-white/10 bg-[#181818]">
            <div className="text-sm text-white/60">
              {selectedMessageCount} message(s) • {selectedRoomCount} room(s)
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-white/60 hover:text-white font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleForward}
                disabled={selectedRooms.size === 0 || selectedMessages.size === 0 || isLoading}
                className={`px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 shadow
                  ${selectedRooms.size > 0 && selectedMessages.size > 0 && !isLoading
                    ? 'bg-[#9cbc9c] text-black hover:bg-[#7ca87c] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#9cbc9c]/50'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'}
                `}
              >
                <Forward size={18} />
                {isLoading ? 'Forwarding...' : 'Forward'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForwardMessageModal;
