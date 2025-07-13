export default function ChatRoomItem({ room, selected, onClick }: {
  room: any;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-xl text-left transition-all duration-200 ease-in-out
        ${selected ? 'bg-[#9cbc9c]/20 border border-[#9cbc9c]/30' : 'hover:bg-white/10'}
      `}
    >
      <div className="text-white font-medium">{room.name}</div>
      <div className="text-xs text-white/50 capitalize">{room.type}</div>
    </button>
  );
}
