import React from 'react';
import { Reply, Copy, Forward, Star, Delete, Info, Share, Plus,  Trash,Share2,ArrowRight, Pencil, Edit} from 'lucide-react';
import {isEditable} from '@/utils/time';
import { toast } from 'react-hot-toast';

interface UserStatus {
  name: string;
  timestamp: string;
}

interface MessageInfoProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  messageId: string;
  message: string;
  deliveredTo: UserStatus[]; 
  readBy: UserStatus[];   
  isOwn: boolean; 
  timestamp: string; // Added timestamp prop
  onAction: (action: string) => void;
}

const emojiReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const MessageInfo : React.FC<MessageInfoProps> = ({ isOpen, onClose, position, messageId, message, deliveredTo, readBy,isOwn,timestamp ,onAction }) => {
  if (!isOpen) return null;

  const stillDeliveredTo = deliveredTo.filter(d => !readBy.some(r => r.name === d.name));
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message);
      console.log("📋 Copied:", message);
      toast.success("📋 Copied to clipboard!");
    } catch (error) {
      console.error("❌ Failed to copy:", error);
      toast.error("❌ Failed to copy message.");
    }
  };

  

  const actions = [
      ...(isOwn && isEditable(timestamp)? [{ icon: Edit, label: 'Edit', action: 'edit' }] : []),
    { icon: Reply, label: 'Reply', action: 'reply' },
    { icon: Copy, label: 'Copy', action: 'copy' },    
    { icon: Forward, label: 'Forward', action: 'forward' },
      // ...(isOwn ? [{ icon: Edit, label: 'Edit', action: 'edit' }] : []), // ✅ Only if own message
    { icon: Star, label: 'Star', action: 'star' },
    { icon: Delete, label: 'Delete', action: 'delete' },
    { icon: Share, label: 'Share', action: 'share' },
    { icon: Info, label: 'Info', action: 'info' },
  ];

  return (
    <div
      className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-start justify-center"
      onClick={onClose}
    >
      <div
        className="w-[300px] bg-[#111] rounded-xl shadow-2xl text-white"
        style={{
          position: 'absolute',
          top: position.y,
          left: position.x,
          zIndex: 50,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          {/* ACTIONS */}
          <div className="text-xs text-white/40 uppercase mb-2">Actions</div>
          <div className="flex flex-col gap-2 mb-4">
            {[
              ...(isOwn && isEditable(timestamp)? [{ icon: <Edit size={16} />, label: 'Edit', action: 'edit' }] : []),
              { icon: <Reply size={16} />, label: 'Reply', action: 'reply' },
              { icon: <Copy size={16} />, label: 'Copy', action: 'copy' },
              { icon: <ArrowRight size={16} />, label: 'Forward', action: 'forward' },
              { icon: <Star size={16} />, label: 'Star', action: 'star' },
              { icon: <Trash size={16} />, label: 'Delete', action: 'delete' },
              { icon: <Share2 size={16} />, label: 'Share', action: 'share' },
              { icon: <Info size={16} />, label: 'Info', action: 'info' },
            ].map(({ icon, label, action }) => (
              <button
              
                key={action}
                className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-white/10 rounded-md"
                onClick={() => {
                  if (action === 'copy') {
                    handleCopyToClipboard();
                  } 
                  else {
                    onAction?.(action);
                  }
                  onClose();
                }}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* REACT EMOJIS */}
          <div className="text-xs text-white/40 uppercase mb-2">React</div>
          <div className="flex gap-2 mb-4">
            {['👍', '❤️', '😂', '😮', '🥲', '🙏'].map((emoji, idx) => (
              <button key={idx} className="text-lg hover:scale-110 transition-transform">
                {emoji}
              </button>
            ))}
          </div>

          {/* MESSAGE INFO */}
          <div className="text-xs text-white/40 uppercase mb-1">Message Info</div>
          <div className="text-sm text-white/80">
            <div>
              <span className="text-white/50">Delivered To</span>{' '}
                {deliveredTo.length ? deliveredTo.join(', ') : 'Not delivered yet'}
            </div>
            <div>
              <span className="text-white/50">Read By</span>{' '}
                {readBy.length ? readBy.join(', ') : 'Not read yet'}
          </div>
        </div>
      </div>
    </div>
            

    </div>

  );
};


export default MessageInfo;
