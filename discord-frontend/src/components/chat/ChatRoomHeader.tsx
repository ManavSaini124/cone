import React from 'react';
import { ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';

interface ChatRoomHeaderProps {
  roomName: string;
  roomType: 'Private' | 'Group' | 'Public';
  onlineCount: number;
  onBack?: () => void;
  onClickRoomHeader: () => void;

}

const ChatRoomHeader: React.FC<ChatRoomHeaderProps> = ({ roomName, roomType, onlineCount, onBack , onClickRoomHeader}) => (
  <div className="p-4 border-b border-white/10 bg-black/20 backdrop-blur-xl">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="lg:hidden p-2 hover:bg-white/10 rounded-lg">
          <ArrowLeft size={18} className="text-white/80" />
        </button>
        <div
          onClick={onClickRoomHeader}
          className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-1 rounded-lg transition"
        >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9cbc9c]/20 to-[#9cbc9c]/10 flex items-center justify-center">
            <span className="text-lg">💬</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">{roomName}</h1>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 text-xs rounded-full font-medium ${
                  roomType === 'Private'
                    ? 'bg-[#c9a896]/20 text-[#c9a896]'
                    : roomType === 'Public'
                    ? 'bg-[#f5c86e]/20 text-[#f5c86e]'
                    : 'bg-[#9cbc9c]/20 text-[#9cbc9c]'
                }`}
              >
                {roomType}
              </span>
              <span className="text-xs text-white/50">{onlineCount} online</span>
            </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="p-2 hover:bg-white/10 rounded-lg"><Phone size={18} /></button>
        <button className="p-2 hover:bg-white/10 rounded-lg"><Video size={18} /></button>
        <button className="p-2 hover:bg-white/10 rounded-lg"><MoreVertical size={18} /></button>
      </div>
    </div>
  </div>
);

export default ChatRoomHeader; 