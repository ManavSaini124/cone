import React from 'react';
import { User, Copy, Shield, ShieldOff, UserMinus, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/contexts/SocketContext';


interface ParticipantActionsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  currentUserRole: 'member' | 'moderator' | 'admin';
  targetUser: {
    id: string;
    name: string;
    username: string;
    role: 'member' | 'moderator' | 'admin';
  };
  currentRoomId: string
  onViewProfile: (userId: string) => void;
  onMakeAdmin: (userId: string) => void;
  onRevokeAdmin: (userId: string) => void;
  onRemoveFromRoom: (userId: string) => void;
}



const ParticipantActionsPopup: React.FC<ParticipantActionsPopupProps> = ({
  isOpen,
  onClose,
  position,
  currentUserRole,
  targetUser,
  currentRoomId,
  onViewProfile,
  onMakeAdmin,
  onRevokeAdmin,
  onRemoveFromRoom,
}) => {
  const { toast } = useToast();
  const socket = useSocket();
  
  const [adjustedPosition, setAdjustedPosition] = React.useState(position);
  // if (!isOpen) return null;

React.useEffect(() => {
  if (!isOpen) return;

  const popupWidth = 240;
  const popupHeight = 200;
  const margin = 16;

  let adjustedX = position.x;
  let adjustedY = position.y;

  if (adjustedX + popupWidth > window.innerWidth - margin) {
    adjustedX = window.innerWidth - popupWidth - margin;
  }

  if (adjustedX < margin) {
    adjustedX = margin;
  }

  if (adjustedY + popupHeight > window.innerHeight - margin) {
    adjustedY = window.innerHeight - popupHeight - margin;
  }

  if (adjustedY < margin) {
    adjustedY = margin;
  }

  setAdjustedPosition({ x: adjustedX, y: adjustedY });
}, [position, isOpen]);

  const handleCopyUsername = async () => {
    try {
      await navigator.clipboard.writeText(targetUser.username);
      toast({
        title: "Username copied",
        description: `@${targetUser.username} copied to clipboard`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy username to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  // Role permission checks
  const canMakeAdmin = currentUserRole === 'admin' && targetUser.role !== 'admin';
  const canRevokeAdmin = currentUserRole === 'admin' && targetUser.role === 'admin';
  const canRemove = currentUserRole === 'moderator' || currentUserRole === 'admin';

  

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-transparent"
        onClick={onClose}
      />

      {/* Desktop Popup */}
      {/* <div
        className="fixed z-999 w-60 bg-[#121212] rounded-lg shadow-xl shadow-black/30 p-3 space-y-1 animate-scale-in "
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            border: '2px solid red', // 🔥 Debug line
          }}      
        > */}

      <div
        className="fixed z-50 w-60 bg-[#121212] rounded-lg shadow-xl shadow-black/30 p-3 space-y-1 animate-scale-in hidden md:block"
        style={{
            left: `${adjustedPosition.x}px`,
            top: `${adjustedPosition.y}px`,
            visibility: isOpen ? 'visible' : 'hidden', 
        }}
      >
        {/* View Profile */}
        <button
          onClick={(e) =>{ 
            e.stopPropagation();
            handleAction(() => onViewProfile(targetUser.id))
        }}
          className="w-full flex items-center gap-3 px-2 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-[#9cbc9c] rounded transition-all duration-150 ease-in-out"
        >
          <Eye className="w-4 h-4" />
          View Profile
        </button>

        {/* Copy Username */}
        <button
          onClick={handleCopyUsername}
          className="w-full flex items-center gap-3 px-2 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-[#9cbc9c] rounded transition-all duration-150 ease-in-out"
        >
          <Copy className="w-4 h-4" />
          Copy Username
        </button>

        {/* Role Conditional Rendering - Admin Actions */}
        {canMakeAdmin && (
          <button
            onClick={(e) => {
                e.stopPropagation();
                handleAction(() => socket.emit('make_admin', { roomId: currentRoomId, userId: targetUser.id }));
            }}
            className="w-full flex items-center gap-3 px-2 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-[#9cbc9c] rounded transition-all duration-150 ease-in-out"
          >
            <Shield className="w-4 h-4" />
            Make Admin
          </button>
        )}

        {canRevokeAdmin && (
          <button
            onClick={(e) => {
                e.stopPropagation();
                handleAction(() => 
                    socket.emit('revoke_admin', {
                    roomId: currentRoomId,
                    userId: targetUser.id,
                    })
                )
            }}
            className="w-full flex items-center gap-3 px-2 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-orange-400 rounded transition-all duration-150 ease-in-out"
          >
            <ShieldOff className="w-4 h-4" />
            Revoke Admin
          </button>
        )}

        {/* Separator */}
        {canRemove && (
          <div className="border-t border-white/10 my-1" />
        )}

        {/* Remove from Room */}
        {canRemove && (
          <button
            onClick={(e) => {
                e.stopPropagation();
                handleAction(() => socket.emit('remove_user_from_room', {
                    roomId: currentRoomId,
                    userIdToRemove: targetUser.id,
                    })
                )
            }}
            className="w-full flex items-center gap-3 px-2 py-2 text-sm text-white/80 hover:bg-red-500/10 hover:text-red-400 rounded transition-all duration-150 ease-in-out"
          >
            <UserMinus className="w-4 h-4" />
            Remove from Room
          </button>
        )}
      </div>

      {/* Mobile Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 w-full bg-[#121212] rounded-t-xl shadow-xl shadow-black/30 p-4 space-y-2 animate-slide-up">
        {/* Handle Bar */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        {/* User Info Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
          <div className="w-10 h-10 bg-[#9cbc9c] rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-black" />
          </div>
          <div>
            <p className="text-white font-medium">{targetUser.name}</p>
            <p className="text-white/60 text-sm">@{targetUser.username}</p>
          </div>
        </div>

        {/* View Profile */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAction(() => onViewProfile(targetUser.id))
        }}
          className="w-full flex items-center gap-3 px-3 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-[#9cbc9c] rounded transition-all duration-150 ease-in-out"
        >
          <Eye className="w-5 h-5" />
          View Profile
        </button>

        {/* Copy Username */}
        <button
          onClick={handleCopyUsername}
          className="w-full flex items-center gap-3 px-3 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-[#9cbc9c] rounded transition-all duration-150 ease-in-out"
        >
          <Copy className="w-5 h-5" />
          Copy Username
        </button>

        {/* Role Conditional Rendering - Admin Actions */}
        {canMakeAdmin && (
          <button
            onClick={(e) =>{
                e.stopPropagation();
                handleAction(() => socket.emit('make_admin', { roomId: currentRoomId, userId: targetUser.id }))}}
            className="w-full flex items-center gap-3 px-3 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-[#9cbc9c] rounded transition-all duration-150 ease-in-out"
          >
            <Shield className="w-5 h-5" />
            Make Admin
          </button>
        )}

        {canRevokeAdmin && (
          <button
            onClick={(e) =>{
                e.stopPropagation();
                handleAction(() => 
                    socket.emit('revoke_admin', {
                        roomId: currentRoomId,
                        userId: targetUser.id,
                    })
                )}}
            className="w-full flex items-center gap-3 px-3 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-orange-400 rounded transition-all duration-150 ease-in-out"
          >
            <ShieldOff className="w-5 h-5" />
            Revoke Admin
          </button>
        )}

        {/* Remove from Room */}
        {canRemove && (
          <button
            onClick={(e) =>{
                e.stopPropagation();
                handleAction(() => 
                    socket.emit('remove_user_from_room', {
                        roomId: currentRoomId,
                        userIdToRemove: targetUser.id,
                    })
                )
            }}
            className="w-full flex items-center gap-3 px-3 py-3 text-sm text-white/80 hover:bg-red-500/10 hover:text-red-400 rounded transition-all duration-150 ease-in-out"
          >
            <UserMinus className="w-5 h-5" />
            Remove from Room
          </button>
        )}

        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 px-3 py-3 text-sm text-white/60 hover:bg-white/10 rounded transition-all duration-150 ease-in-out"
        >
          Cancel
        </button>
      </div>
    </>
  );
};

export default ParticipantActionsPopup;