'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { MessageSquare, Settings, User, Bell, Plus } from 'lucide-react';
import ChatSidebar from './chatSidebar';
import { chatService } from '@/services/chatService';
import CreateRoomModal from './CreateRoomModal'
import UserSettings from '../settings/UserSettings';
import { useSocket } from '@/contexts/SocketContext';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';


interface ChatLayoutProps {
  children: ReactNode;
}
// const user = {
//   name: "Manav Saini",
//   email: "manav@example.com"
// };
interface ChatRoom {
  _id: string;
  name: string;
  icon?: string;
  lastMessage?: string;
  time?: string;
  unread?: number;
}


const ChatLayout = ({ children }: ChatLayoutProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const router = useRouter();

  const { user } = useUser();

  console.log('ChatLayout rendered'); // Debugging line to check if the component is rendering
  const BASE_URL = process.env.NEXT_PUBLIC_CHATROOMS_API || 'http://localhost:5000/api/v1';
  console.log('[chatService] BASE_URL =', BASE_URL);

  useEffect(() => {
    const fetchRooms = async () => {
        try {
            console.log('[ChatLayout] useEffect: fetching rooms...');
            const roomData = await chatService.getRooms();
            console.log('Fetched rooms:', roomData); // Debugging line to check fetched data
            setRooms(roomData); // ✅ This must happen
        } catch (err) {
            console.error('Error fetching rooms:', err);
        }finally {
          setLoading(false); // ✅ Always reset loading
        }
    };

    fetchRooms();

  }, []);

  useEffect(() => {
  if (!socket || !user) return; // ✅ prevents the TS error

  const handleNewRoom = (newRoom: ChatRoom & { createdBy: { _id: string } }) => {
    setRooms(prev => {
      const exists = prev.some(r => r._id === newRoom._id);
      return exists ? prev : [newRoom, ...prev];
    });

    if (newRoom.createdBy._id === user._id) {
      setSelectedRoomId(newRoom._id);
      router.push(`/chat/${newRoom._id}`);
    }
  };

  socket.on('new_room', handleNewRoom);

  return () => {
    socket.off('new_room', handleNewRoom);
  };
}, [socket, user]);

  const handleRoomSelect = (id: string) => {
    console.log('[ChatLayout] Room selected:', id);
    setSelectedRoomId(id);
    setSidebarOpen(false);
  };

  const handleRoomCreated = (newRoom: ChatRoom) => {
    setRooms((prev) => [newRoom, ...prev]);
  };


  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white font-['Inter',_sans-serif]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => {
            console.log('[ChatLayout] Sidebar overlay clicked');
            setSidebarOpen(false)}
        }
        />
      )}
      

      {/* Sidebar */}
      <div
        className={`fixed lg:relative z-50 w-80 h-full transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* <button onClick={() => setIsModalOpen(true)}>+ New</button> */}
        <ChatSidebar
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onRoomSelect={ handleRoomSelect }
          user={user}
          onOpenSettings={() => setShowSettings(true)}
        />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                console.log('[ChatLayout] Sidebar open button clicked');
                setSidebarOpen(true)
            }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
            >
              <MessageSquare size={20} className="text-white/80" />
            </button>
            <h1 className="text-lg font-semibold">
              {selectedRoomId ? rooms.find((r) => r._id === selectedRoomId)?.name : 'Cone Chat'}
            </h1>
          </div>
        </div>
        {showSettings && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSettings(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <UserSettings
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
              />
            </div>
          </>
        )}

        {/* Page Content */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-full text-white/40">
              Loading rooms...
            </div>
          ) : (
            children
          )}
        </div>
      </div>
      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateRoom={handleRoomCreated}
      />
    </div>
  );
};

export default ChatLayout;
