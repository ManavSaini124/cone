import React from 'react';
import MessageInfo from '@/components/chat/MessageInfo';

interface Message {
  _id: string;
  sender: { _id: string; name: string } | string;
  content: string;
  timestamp: string;
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

interface ChatMessageListProps {
  groupedMessages: { [key: string]: Message[] };
  messageRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  openMessageInfo: (
    e: React.MouseEvent,
    messageId: string,
    content: string,
    deliveredTo: { name: string; timestamp: string }[],
    readBy: { name: string; timestamp: string }[],
    timestamp: string
  ) => void;
  getDeliveryStatus: (messageId: string) => {
    deliveredTo: { name: string; timestamp: string }[];
    readBy: { name: string; timestamp: string }[];
  };
  scrollToMessage: (messageId: string) => void;
  userId?: string;
  selectionMode?: boolean;
  selectedMessageIds?: string[];
  onSelectMessage?: (id: string) => void;
}

const formatMessageTime = (timestamp: string) => {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ChatMessageList: React.FC<ChatMessageListProps> = ({
  groupedMessages,
  messageRefs,
  openMessageInfo,
  getDeliveryStatus,
  scrollToMessage,
  userId,
  selectionMode,
  selectedMessageIds,
  onSelectMessage,
}) => (
  <>
    {Object.entries(groupedMessages).map(([date, dateMessages]) => (
      <div key={date} className="space-y-4">
        <div className="flex items-center justify-center">
          <span className="px-3 py-1 text-xs text-white/40 bg-black/40 rounded-full">{date}</span>
        </div>
        <div className="space-y-4">
          {dateMessages.map((msg) => (
            <div
              key={msg._id}
              ref={(el: HTMLDivElement | null) => {
                messageRefs.current[msg._id] = el;
              }}
              className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'} ${selectionMode && selectedMessageIds?.includes(msg._id) ? 'ring-2 ring-[#9cbc9c] bg-[#1a2a1a]' : ''}`}
              onClick={selectionMode ? () => onSelectMessage && onSelectMessage(msg._id) : undefined}
            >
              {selectionMode && (
                <input type="checkbox" checked={selectedMessageIds?.includes(msg._id)} readOnly className="mr-2 accent-[#9cbc9c]" />
              )}
              <div
                className={`max-w-[70%] ${msg.isOwn ? 'order-2' : 'order-1'}`}
                onContextMenu={(e) => {
                  const status = getDeliveryStatus(msg._id);
                  openMessageInfo(e, msg._id, msg.content, status.deliveredTo, status.readBy, msg.timestamp);
                }}
              >
                {msg.replyTo && (
                  <div className="px-3 py-2 border-l-4 border-[#9cbc9c] bg-black/30 rounded-t-lg text-sm text-white/60 italic mb-1">
                    Replying to {msg.replyTo.sender?.name || 'someone'}: "{msg.replyTo.content.slice(0, 50)}..."
                  </div>
                )}
                {!msg.isOwn && (
                  <div className="mb-1 text-xs text-white/60 font-medium">
                    {typeof msg.sender === 'string' ? msg.sender : msg.sender.name}
                  </div>
                )}
                <div className={`px-4 py-3 rounded-2xl ${msg.isOwn ? 'bg-[#9cbc9c]/20' : 'bg-black/40'}`}>
                  {msg.isDeleted ? (
                    <p className="italic text-white/40">This message was deleted</p>
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  )}
                  <div
                    title={new Date(msg.timestamp).toLocaleString()}
                    className={`mt-2 text-[10px] text-white/40 ${msg.isOwn ? 'text-right' : 'text-left'}`}
                  >
                    {formatMessageTime(msg.timestamp)}
                    {msg.edited && <span className="ml-1 italic">edited</span>}
                    {msg.isOwn && (
                      <span className="ml-1 inline-block">
                        {Array.isArray(msg.readBy) && msg.readBy.length > 1 ? (
                          <span className="text-blue-400">✅✅</span>
                        ) : (
                          <span className="text-white/40">✅</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </>
);

export default ChatMessageList; 