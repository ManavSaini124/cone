'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatRoom from '@/components/chat/ChatRoom';

type RoomType = 'Private' | 'Group' | 'Public';

type RoomInfo = {
  name: string;
  type: RoomType;
};

export default function ChatRoomPage() {
  const params = useParams();
  const roomId = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId;

  const [roomInfo, setRoomInfo] = useState<RoomInfo>({
    name: 'Loading...',
    type: 'Group',
  });

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat-rooms/${roomId}`, {
          credentials: 'include',
        });
        const json = await res.json();

        const rawType = json?.data?.type;

        const normalizedType: RoomType =
          rawType === 'Private' || rawType === 'private'
            ? 'Private'
            : rawType === 'Public' || rawType === 'public'
            ? 'Public'
            : 'Group';

        setRoomInfo({
          name: json.data?.name || 'Unknown Room',
          type: normalizedType,
        });
      } catch (error) {
        console.error('Room fetch failed:', error);
        setRoomInfo({ name: 'Unknown Room', type: 'Group' });
      }
    };

    if (roomId) fetchRoom();
  }, [roomId]);

  return (
    <ChatRoom
      roomId={roomId as string}
      roomName={roomInfo.name}
      roomType={roomInfo.type}
      onlineCount={5}
    />
  );
}