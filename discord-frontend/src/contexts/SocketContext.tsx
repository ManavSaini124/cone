'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from './UserContext';
import { useRouter } from 'next/navigation';

type SocketContextType = Socket | null;
const SocketContext = createContext<SocketContextType>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user?._id) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      withCredentials: true,
      autoConnect: true,
      auth: {
        token: localStorage.getItem('accessToken') || '',
      },
    });
    newSocket.on('connect', () => console.log('✅ Connected to socket.io'));
    newSocket.on('disconnect', () => console.log('❌ Disconnected from socket.io'));
    
    setSocket(newSocket);
    
    newSocket.on('new_room', (newRoom) => {
      console.log('📦 Received new_room event:', newRoom);

      // ✅ Navigate if you created the room
      if (newRoom.createdBy._id === user._id) {
        router.push(`/chat/${newRoom._id}`);
      }
    })
    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]);

  // ⚠️ Delay rendering until socket is available
  if (!socket) return null;

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
