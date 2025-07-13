import React, { useState , useEffect} from 'react';
import { Search, X, Plus, UserPlus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/contexts/SocketContext';
import toast from 'react-hot-toast';


interface SelectParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomType: 'private' | 'group' | 'public';
  roomName: string;
  onCreateRoom?: (participants: User[]) => void;
}

// Mock users data
// const mockUsers: User[] = [
//   { id: '1', name: 'Sarah Chen', username: '@sarah_chen', avatar: '👩‍💼', online: true },
//   { id: '2', name: 'Mike Rodriguez', username: '@mike_dev', avatar: '👨‍💻', online: true },
//   { id: '3', name: 'Emma Watson', username: '@emma_w', avatar: '👩‍🎨', online: false },
//   { id: '4', name: 'David Kim', username: '@david_k', avatar: '👨‍🔬', online: true },
//   { id: '5', name: 'Lisa Johnson', username: '@lisa_j', avatar: '👩‍🚀', online: false },
//   { id: '6', name: 'Alex Thompson', username: '@alex_t', avatar: '👨‍🎭', online: true },
//   { id: '7', name: 'Rachel Green', username: '@rachel_g', avatar: '👩‍🏫', online: true },
//   { id: '8', name: 'John Smith', username: '@john_s', avatar: '👨‍🎯', online: false },
// ];

interface User {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  online?: boolean;
}



const SelectParticipantsModal: React.FC<SelectParticipantsModalProps> = ({
  isOpen,
  onClose,
  roomType,
  roomName,
  onCreateRoom
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
//   // Filter users based on search query
    const filteredUsers = searchResults.filter(
        (user) => !selectedUsers.some((u) => u._id === user._id)
    );

    const socket = useSocket();


  // Add user to selection
  const addUser = (user: User) => {
    if (roomType === 'private' && selectedUsers.length >= 1) return;
    if (selectedUsers.find(u => u._id === user._id)) return;
    setSelectedUsers([...selectedUsers, user]);
  };

  // Remove user from selection
  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };

  // Validation logic
  const canCreate = () => {
    if (roomType === 'private') return selectedUsers.length === 1;
    if (roomType === 'group') return selectedUsers.length >= 1;
    if (roomType === 'public') return true;
    return false;
  };

  const getValidationMessage = () => {
    if (roomType === 'private') {
      return selectedUsers.length === 0 
        ? 'Select exactly 1 participant for private chat'
        : selectedUsers.length > 1 
        ? 'Private chats can only have 1 participant'
        : '';
    }
    if (roomType === 'group') {
      return selectedUsers.length === 0 ? 'Select at least 1 participant to create group' : '';
    }
    return '';
  };

  const handleCreate = async () => {
    if (!canCreate()) return;
    
    setIsCreating(true);
    try {
      socket.emit("create_room", {
        name: roomName,
        type: roomType,
        participants: selectedUsers.map(u => u._id),
    });
      
      // Reset and close
      setSelectedUsers([]);
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.error('Failed to create room:', error);
      toast.error('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setSelectedUsers([]);
      setSearchQuery('');
      onClose();
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
    }

    const delay = setTimeout(async () => {
        try {
        setIsSearching(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/search?query=${encodeURIComponent(searchQuery.trim())}`,{
            credentials: 'include', 
        });
        const json = await res.json();
        setSearchResults(json?.data || []);
        } catch (err) {
        console.error('User search failed', err);
        toast.error('User search failed.');
        } finally {
        setIsSearching(false);
        }
    }, 400);

    return () => clearTimeout(delay);
    }, [searchQuery]);


  // Skip modal for public rooms if no participants needed
  if (roomType === 'public') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="bg-[#121212] border border-white/10 text-white font-['Inter',_sans-serif] max-w-md mx-auto">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Create Public Room
            </DialogTitle>
            <DialogDescription className="text-white/60 text-sm mt-2">
              "{roomName}" will be created as a public room. Anyone can discover and join.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
              className="flex-1 bg-transparent border-white/20 text-white/80 hover:bg-white/10"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="flex-1 bg-[#9cbc9c] text-black font-medium hover:bg-[#9cbc9c]/90"
            >
              {isCreating ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Room'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#121212] border border-white/10 text-white font-['Inter',_sans-serif] max-w-xl mx-auto max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Add Participants
          </DialogTitle>
          <DialogDescription className="text-white/60 text-sm mt-2">
            {roomType === 'private' 
              ? 'Select 1 person for your private conversation'
              : 'Choose people to invite to your group'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1">
          {/* Search Field */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/40 border-white/20 text-white placeholder:text-white/40 focus:border-[#9cbc9c] focus:ring-2 focus:ring-[#9cbc9c]/20"
              disabled={isCreating}
            />
            {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 animate-spin" size={16} />
            )}
          </div>

          {/* Search Results */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[#c9a896] mb-3">Available Users</h3>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {filteredUsers.map((user) => {
                const isSelected = selectedUsers.find(u => u._id === user._id);
                const canAdd = roomType !== 'private' || selectedUsers.length === 0;
                
                return (
                  <div
                    key={user._id}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg transition-all duration-200
                      ${isSelected 
                        ? 'bg-[#9cbc9c]/20 border border-[#9cbc9c]/30' 
                        : 'bg-black/20 hover:bg-black/30 border border-transparent'
                      }
                      ${!canAdd && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    onClick={() => !isSelected && canAdd && addUser(user)}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-lg">
                        {user.avatar ?? user.name.charAt(0).toUpperCase()}
                      </div>
                      {user.online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#121212]" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{user.name}</p>
                      <p className="text-xs text-white/50 truncate">{user.username}</p>
                    </div>

                    {isSelected ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeUser(user._id);
                        }}
                        className="bg-transparent border-white/20 text-white/60 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400"
                        disabled={isCreating}
                      >
                        <X size={14} />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canAdd) addUser(user);
                        }}
                        disabled={!canAdd || isCreating}
                        className="bg-[#9cbc9c] text-black hover:bg-[#9cbc9c]/80 disabled:opacity-50"
                      >
                        <Plus size={14} />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-[#c9a896]">
                Selected ({selectedUsers.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <Badge
                    key={user._id}
                    variant="secondary"
                    className="bg-[#9cbc9c]/20 text-white border border-[#9cbc9c]/30 flex items-center gap-2 pr-1"
                  >
                    <span className="text-sm">{user.avatar}</span>
                    <span className="text-sm">{user.name}</span>
                    <button
                      onClick={() => removeUser(user._id)}
                      disabled={isCreating}
                      className="ml-1 p-0.5 hover:bg-red-500/20 rounded-sm transition-colors"
                    >
                      <X size={12} className="text-white/60 hover:text-red-400" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Validation Message */}
          {getValidationMessage() && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-amber-400 text-sm">{getValidationMessage()}</p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isCreating}
            className="flex-1 bg-transparent border-white/20 text-white/80 hover:bg-white/10"
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleCreate}
            disabled={!canCreate() || isCreating}
            className="flex-1 bg-[#9cbc9c] text-black font-medium hover:bg-[#9cbc9c]/90 disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus size={16} className="mr-2" />
                Create {roomType === 'private' ? 'Chat' : 'Group'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectParticipantsModal;