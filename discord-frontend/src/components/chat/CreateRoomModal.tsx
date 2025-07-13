import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { createRoom } from '@/services/roomService';
import SelectParticipantsModal from './SelectParticipantsModal';
import { useSocket } from '@/contexts/SocketContext';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom?: (roomData: RoomData) => void;
}

interface RoomData {
  _id: string;
  name: string;
  description: string;
  type: 'private' | 'group' | 'Public';
  createdAt?: string;
  lastMessage?: string;

}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreateRoom 
}) => {
  const [roomName, setRoomName] = useState('');
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [roomDescription, setRoomDescription] = useState('');
  const [roomType, setRoomType] = useState<'private' | 'group' | 'Public'>('group');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomName.trim()) {
      setNameError('Room name is required');
      return;
    }

    setNameError('');

    if (roomType === 'Public') {
      // Create public room immediately
      setIsSubmitting(true);
      createRoom({
        name: roomName.trim(),
        description: roomDescription.trim(),
        type: 'Public',
      })
        .then((newRoom) => {
          onCreateRoom?.(newRoom);
          handleClose();
        })
        .catch((err) => {
          console.error("Room creation failed:", err);
        })
        .finally(() => setIsSubmitting(false));
    } else {
      // Show participants modal for private/group
      setShowParticipantsModal(true);
    }
  };

  const handleClose = () => {
    setRoomName('');
    setRoomDescription('');
    setRoomType('group');
    setShowParticipantsModal(false); // <- just in case
    setNameError('');
    onClose(); // <- this closes the CreateRoomModal from parent
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#121212] border border-white/10 text-white font-['Inter',_sans-serif] max-w-md mx-auto">
        {/* Modal Header */}
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Create New Room
          </DialogTitle>
          <DialogDescription className="text-white/60 text-sm mt-2">
            Set up a new chat space for your conversations
          </DialogDescription>
        </DialogHeader>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Name Input */}
          <div className="space-y-2">
            <Label htmlFor="room-name" className="text-sm font-medium text-[#c9a896]">
              Room Name *
            </Label>
            <Input
              id="room-name"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name..."
              className={`
                bg-black/40 border-white/20 text-white placeholder:text-white/40
                focus:border-[#9cbc9c] focus:ring-2 focus:ring-[#9cbc9c]/20
                transition-all duration-200
                ${nameError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
              `}
              disabled={isSubmitting}
            />
            {nameError && (
              <p className="text-red-400 text-xs mt-1">{nameError}</p>
            )}
          </div>

          {/* Room Description */}
          <div className="space-y-2">
            <Label htmlFor="room-description" className="text-sm font-medium text-[#c9a896]">
              Description (Optional)
            </Label>
            <Textarea
              id="room-description"
              value={roomDescription}
              onChange={(e) => setRoomDescription(e.target.value)}
              placeholder="Describe what this room is for..."
              className="
                bg-black/40 border-white/20 text-white placeholder:text-white/40
                focus:border-[#9cbc9c] focus:ring-2 focus:ring-[#9cbc9c]/20
                transition-all duration-200 resize-none min-h-[80px]
              "
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Room Type Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-[#c9a896]">
              Room Type
            </Label>
            <RadioGroup
              value={roomType}
              onValueChange={(value) => setRoomType(value as 'private' | 'group' | 'Public')}
              className="space-y-3"
              disabled={isSubmitting}
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-colors">
                <RadioGroupItem value="private" id="private" className="border-white/30 text-[#9cbc9c]" />
                <div className="flex-1">
                  <Label htmlFor="private" className="text-white font-medium cursor-pointer">
                    🔒 Private
                  </Label>
                  <p className="text-white/50 text-xs mt-1">Only invited members can join</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-colors">
                <RadioGroupItem value="group" id="group" className="border-white/30 text-[#9cbc9c]" />
                <div className="flex-1">
                  <Label htmlFor="group" className="text-white font-medium cursor-pointer">
                    👥 Group
                  </Label>
                  <p className="text-white/50 text-xs mt-1">Team members can join with invite link</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-colors">
                <RadioGroupItem value="Public" id="Public" className="border-white/30 text-[#9cbc9c]" />
                <div className="flex-1">
                  <Label htmlFor="Public" className="text-white font-medium cursor-pointer">
                    🌍 Public
                  </Label>
                  <p className="text-white/50 text-xs mt-1">Anyone can discover and join</p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Submit Logic Hook Here */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="
                flex-1 bg-transparent border-white/20 text-white/80 
                hover:bg-white/10 hover:text-white hover:border-white/30
                transition-all duration-200
              "
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isSubmitting || !roomName.trim()}
              className="
                flex-1 bg-[#9cbc9c] text-black font-medium
                hover:bg-[#9cbc9c]/90 hover:scale-105
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                transition-all duration-200
                flex items-center justify-center gap-2
              "
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Room'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
        <SelectParticipantsModal
          isOpen={showParticipantsModal}
          onClose={() => setShowParticipantsModal(false)}
          roomType={roomType.toLowerCase() as 'private' | 'group' | 'public'}
          roomName={roomName}
          onCreateRoom={(participants) => {
            setIsSubmitting(true);
            setShowParticipantsModal(false);

            const socket = useSocket(); // or pass socket via props/context
            socket.emit('create_room', {
              name: roomName.trim(),
              description: roomDescription.trim(),
              type: roomType.toLowerCase(),
              participants: participants.map(p => p._id)
            });

            handleClose();
          }}
        />
    </Dialog>
  );
};

export default CreateRoomModal;
