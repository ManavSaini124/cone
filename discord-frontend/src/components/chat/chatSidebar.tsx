'use client';
import { useState } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { Bell, Settings, User as UserIcon ,Plus} from 'lucide-react';
import CreateRoomModal from './CreateRoomModal';

interface Room {
  _id: string;
  name: string;
  icon?: string;
  lastMessage?: string;
  time?: string;
  unread?: number;
}

interface User {
  name: string;
  email: string;
}

interface Props {
  rooms: Room[];
  selectedRoomId: string | null;
  onRoomSelect: (id: string) => void;
  user: User | null;
  onOpenSettings: () => void;
}


const ChatSidebar: React.FC<Props> = ({ rooms ,selectedRoomId, onRoomSelect , onOpenSettings}) => {
  const router = useRouter();
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);



  return (
    <div className="w-80 h-full bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-semibold text-white">Cone Chat</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex justify-between mb-4 text-white/50 text-xs uppercase">
          <span>Rooms</span>
          <button className="text-[#9cbc9c] text-sm" onClick={() => setIsModalOpen(true)}>
            <Plus size={20} /></button>
          <CreateRoomModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onCreateRoom={(newRoom) => {
              // Optional: Push to room list or refetch rooms
            }}

          />

        </div>
        <div className="space-y-1">
          {rooms.map((room) => (
            <button
              key={room._id}
            //   room ={room}
              onClick={() => {
                onRoomSelect(room._id);
                router.push(`/chat/${room._id}`);
              }}
              className={`w-full p-3 rounded-xl text-left transition ${
                selectedRoomId === room._id
                  ? 'bg-[#9cbc9c]/20 border border-[#9cbc9c]/30'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-sm">
                  {room.icon || '💬'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">{room.name}</h3>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar Footer - User Info */}
      <div className="p-4 border-t border-white/10 flex items-center justify-between">
      <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9cbc9c] to-[#7da87d] flex items-center justify-center text-black text-sm font-medium">
      {user?.name?.[0] || 'U'}
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-white">{user?.name || 'Unknown User'}</p>
      <p className="text-xs text-white/50">Online</p>
    </div>
      </div>
      <div className="flex gap-2">
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200">
          <Bell size={16} className="text-white/60" />
        </button>
        <button 
        className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
        onClick={onOpenSettings}>
          <Settings size={16} className="text-white/60" />
        </button>
      </div>
    </div>

    </div>
  );
};

export default ChatSidebar;
