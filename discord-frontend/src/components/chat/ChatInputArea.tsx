import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Smile, Send } from 'lucide-react';

interface ChatInputAreaProps {
  message: string;
  onSend: () => void;
  onTyping: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  editingMessageId: string | null;
  replyingTo: null | { _id: string; content: string; sender: { name: string } };
  onCancelReply: () => void;
  scrollToMessage: (messageId: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  disabled?: boolean;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  message,
  onSend,
  onTyping,
  onKeyPress,
  editingMessageId,
  replyingTo,
  onCancelReply,
  scrollToMessage,
  textareaRef,
  disabled,
}) => (
  <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-xl">
    <div className="flex items-end gap-3">
      <button className="p-2 hover:bg-white/10 rounded-lg"><Paperclip size={18} /></button>
      <div className="flex-1 relative">
        {replyingTo && (
          <div className="flex justify-between items-center">
            <div
              className="px-3 py-2 border-l-4 border-[#9cbc9c] bg-white/5 rounded-md mb-2 cursor-pointer hover:bg-white/10"
              onClick={() => scrollToMessage(replyingTo._id)}
            >
              <div className="text-xs text-white/50 font-medium">
                Replying to {replyingTo.sender.name || 'Someone'}
              </div>
              <p className="text-sm italic text-white/60 line-clamp-2">
                {replyingTo.content}
              </p>
            </div>
            <button
              className="text-white/50 hover:text-white ml-2"
              onClick={onCancelReply}
            >
              ×
            </button>
          </div>
        )}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={onTyping}
          onKeyPress={onKeyPress}
          placeholder="Type a message..."
          className={`w-full resize-none text-sm px-4 py-3 bg-black/40 border ${
            editingMessageId ? 'border-[#f5c86e]' : 'border-white/10'
          } rounded-2xl text-white placeholder:text-white/40 focus:border-[#9cbc9c]/50 focus:ring-[#9cbc9c]/20`}
          rows={1}
        />
        <button className="absolute right-3 bottom-3 p-1 hover:bg-white/10 rounded-md"><Smile size={16} /></button>
      </div>
      <Button
        onClick={onSend}
        disabled={disabled}
        className={`p-3 rounded-xl transition-all duration-200 ${
          disabled 
            ? 'bg-white/10 text-white/40 cursor-not-allowed' 
            : 'bg-[#9cbc9c] hover:bg-[#9cbc9c]/90 text-black hover:scale-105'
        }`}
        title={disabled ? "Type a message to send" : "Send message"}
      >
        <Send size={16} />
      </Button>
    </div>
  </div>
);

export default ChatInputArea; 