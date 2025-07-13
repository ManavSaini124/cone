
import React from 'react';
import { X, Download, Users, Image, FileText, Bell, BellOff } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ParticipantActionsPopup from '@/components/chat/ParticipantActionsPopup ';
import { useSocket } from '@/contexts/SocketContext';
import { useRef } from 'react';
interface Member {
  id: string;
  name: string;
  avatar?: string;
  role?: 'admin' | 'member';
  online?: boolean;
}

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

interface FileItem {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

interface ChatInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string; 
  currentUserRole: 'admin' | 'moderator' | 'member';
  roomName: string;
  roomDescription?: string;
  roomType: 'Private' | 'group' | 'Public';
  createdAt: string;
  members?: Member[];
  media?: MediaItem[];
  files?: FileItem[];
  isMuted?: boolean;
  onToggleMute?: () => void;
}

const ChatInfoPanel: React.FC<ChatInfoPanelProps> = ({
  isOpen,
  onClose,
  roomId,
  currentUserRole,
  roomName,
  roomDescription,
  roomType,
  createdAt,
  members = [],
  media = [],
  files = [],
  isMuted = false,
  onToggleMute
}) => {
  const [popupOpen, setPopupOpen] = React.useState(false);
  const [popupPosition, setPopupPosition] = React.useState({ x: 0, y: 0 });
  const [selectedMember, setSelectedMember] = React.useState<Member | null>(null);

  const socket = useSocket();
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatFileSize = (size: string) => {
    return size;
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <Image size={16} />;
    return <FileText size={16} />;
  };
    console.log(
    "📌 PopupOpen:", popupOpen,
    "Selected Member:", selectedMember,
    "Position:", popupPosition
  );


  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div className={`fixed right-0 top-0 z-50 h-screen w-full lg:w-[340px] bg-[#121212] border-l border-white/10 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Room Info</h2>
          {/* Close Panel Logic */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
          >
            <X size={20} className="text-white/60 hover:text-white" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="h-full overflow-y-auto pb-20">
          
          {/* Overview Section */}
          <div className="p-4 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#9cbc9c]/20 to-[#9cbc9c]/10 flex items-center justify-center">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold text-white">{roomName}</h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  roomType === 'Private' 
                    ? 'bg-[#c9a896]/20 text-[#c9a896]' 
                    : 'bg-[#9cbc9c]/20 text-[#9cbc9c]'
                }`}>
                  {roomType}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-xs uppercase text-white/40 tracking-wider mb-2">Description</h4>
                <p className="text-sm text-white/80">
                  {roomDescription || "No description"}
                </p>
              </div>

              <div>
                <h4 className="text-xs uppercase text-white/40 tracking-wider mb-2">Created</h4>
                <p className="text-sm text-white/80">{createdAt}</p>
              </div>

              {/* Mute Notifications Toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  {isMuted ? (
                    <BellOff size={16} className="text-white/60" />
                  ) : (
                    <Bell size={16} className="text-white/60" />
                  )}
                  <span className="text-sm text-white/80">
                    {isMuted ? 'Notifications muted' : 'Notifications on'}
                  </span>
                </div>
                <Button
                  onClick={onToggleMute}
                  variant="ghost"
                  size="sm"
                  className="text-[#9cbc9c] hover:bg-[#9cbc9c]/10"
                >
                  {isMuted ? 'Unmute' : 'Mute'}
                </Button>
              </div>
            </div>
          </div>

          {/* Members List */}
          {roomType === 'group' && members.length > 0 && (
            <div className="border-t border-white/10 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-white/60" />
                <h4 className="text-xs uppercase text-white/40 tracking-wider">
                  Members ({members.length})
                </h4>
              </div>
              
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {members.map((member) => {
                  const rowRef = useRef<HTMLDivElement>(null);
                  return <div
      key={member.id}
      ref={rowRef}
      onContextMenu={(e) => {
        e.preventDefault();

        const popupWidth = 240;
        const popupHeight = 200;
        const padding = 12;

        const rect = rowRef.current?.getBoundingClientRect();
        if (!rect) return;

        let x = rect.left - popupWidth - padding;
        let y = rect.top;

        // Flip right if not enough space to the left
        if (x < padding) {
          x = rect.right + padding;
        }

        // Ensure it stays in viewport vertically
        if (y + popupHeight + padding > window.innerHeight) {
          y = window.innerHeight - popupHeight - padding;
        }

        console.log("📦 Rect:", rect);
        console.log("✅ Popup Position:", { x, y });

        setPopupPosition({ x, y });
        setSelectedMember(member);
        setPopupOpen(true);
      }}

                  className="flex items-center gap-3 hover:bg-white/5 rounded-lg p-2 transition-all duration-150 ease-in-out cursor-pointer"
                >
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-[#9cbc9c]/20 text-[#9cbc9c] text-xs">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    {member.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#9cbc9c] rounded-full border-2 border-[#121212]"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90 truncate">{member.name}</p>
                    {member.role === 'admin' && (
                      <span className="text-xs text-[#c9a896]">Admin</span>
                    )}
                  </div>
                </div>
                })}

              </div>
            </div>
          )}

          {/* Media Grid */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Image size={16} className="text-white/60" />
              <h4 className="text-xs uppercase text-white/40 tracking-wider">
                MeDia
              </h4>
            </div>
            
            {media.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {media.slice(0, 9).map((item) => (
                  <div key={item.id} className="aspect-square rounded-lg bg-black/40 overflow-hidden">
                    <img 
                      src={item.thumbnail || item.url} 
                      alt="Media" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/50 text-center py-8">No media yet</p>
            )}
          </div>

          {/* Files List */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} className="text-white/60" />
              <h4 className="text-xs uppercase text-white/40 tracking-wider">
                Files
              </h4>
            </div>
            
            {files.length > 0 ? (
              <div className="space-y-3">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors duration-200">
                    <div className="p-2 bg-black/40 rounded-lg">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/90 truncate">{file.name}</p>
                      <p className="text-xs text-white/50">{formatFileSize(file.size)}</p>
                    </div>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200">
                      <Download size={16} className="text-white/60 hover:text-[#9cbc9c]" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/50 text-center py-8">No files yet</p>
            )}
          </div>
        </div>
        {popupOpen && selectedMember &&(
          <ParticipantActionsPopup
            isOpen={true}
            onClose={() => setPopupOpen(false)}
            position={popupPosition}
            currentUserRole={currentUserRole} // ✅ from props
            currentRoomId={roomId} 
            targetUser={{
              id: selectedMember.id,
              name: selectedMember.name,
              username: selectedMember.name.toLowerCase().replace(/\s+/g, ''), // fallback
              role: selectedMember.role || 'member'
            }}
            onViewProfile={(id) => console.log("View profile of", id)}
            onMakeAdmin={(id) => socket.emit('make_admin', { roomId, userId: id })}
            onRevokeAdmin={(id) => socket.emit('revoke_admin', { roomId, userId: id })}
            onRemoveFromRoom={(id) => socket.emit('remove_user_from_room', { roomId, userId: id })}
          />
        )}
      </div>
    </>
  );
};

export default ChatInfoPanel;
