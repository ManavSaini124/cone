import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeleteMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageContent: string;
  messageId: string;
  onDeleteForMe: (messageId: string) => void;
  onDeleteForEveryone: (messageId: string) => void;
  canDeleteForEveryone: boolean;
  currentUserId: string;

}

const DeleteMessageModal: React.FC<DeleteMessageModalProps> = ({
  isOpen,
  onClose,
  messageContent,
  messageId,
  onDeleteForMe,
  onDeleteForEveryone,
  canDeleteForEveryone,
  currentUserId

  
}) => {
//   if (!isOpen) return null;

  const handleDeleteForMe = () => {
    onDeleteForMe(messageId);
    onClose();
  };

  const handleDeleteForEveryone = () => {
    onDeleteForEveryone(messageId);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Truncate message preview if too long
  const messagePreview = messageContent.length > 100 
    ? messageContent.substring(0, 100) + '...' 
    : messageContent;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleBackdropClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Modal Container */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-full max-w-md bg-[#121212] rounded-xl shadow-xl border border-white/10 backdrop-blur-lg">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">
                  Delete Message
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                >
                  <X size={18} className="text-white/60 hover:text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <p className="text-sm text-white/80">
                    What would you like to do with this message?
                  </p>
                  <div className="p-4 bg-black/40 rounded-lg border border-white/10">
                    <p className="text-sm text-white/70 italic">
                      "{messagePreview}"
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleDeleteForMe}
                    className="w-full px-4 py-3 border border-[#c9a896] text-[#c9a896] rounded-lg font-medium hover:bg-[#c9a896]/10 hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c9a896]/50"
                  >
                    Delete for Me
                  </button>

                 {canDeleteForEveryone && (
                    <button
                        onClick={handleDeleteForEveryone}
                        className="w-full px-4 py-3 bg-[#9cbc9c] text-black rounded-lg font-medium hover:bg-[#9cbc9c]/90 hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#9cbc9c]/50"
                    >
                        Delete for Everyone
                    </button>
                )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={onClose}
                    className="w-full text-white/60 hover:text-white text-sm py-2 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};


export default DeleteMessageModal;