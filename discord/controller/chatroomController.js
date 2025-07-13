const ApiError = require('../utils/errorHandler');
const ApiResponse = require('../utils/apiResponse');
const async_handler = require('../utils/asyncHandler');
const User = require('../models/userModel');
const ChatRoom = require('../models/chatRoomModel');

const createChatRoom = async_handler(async (req, res) => {
    const { name, description, type = 'private', participants = [] } = req.body;

    if (!name || !name.trim()) {
        throw new ApiError(400, "Room name is required");
    }

    if (type === 'private' && participants.length !== 1) {
        throw new ApiError(400, "Private rooms must have exactly 2 participants");
    }

    if (type === 'private') {
        const existingRoom = await ChatRoom.findOne({
            type: 'private',
            'participants.user': { $all: [req.user._id, participants[0]] }
        });
        if (existingRoom) {
            return res.status(200).json(
                new ApiResponse(200, existingRoom, "Private room already exists")
            );
        }
    }

    const participantUsers = await User.find({ _id: { $in: participants } });
    if (participantUsers.length !== participants.length) {
        throw new ApiError(400, "Some participants don't exist");
    }

    const chatRoom = await ChatRoom.create({
        name: name.trim(),
        description: description?.trim(),
        type,
        createdBy: req.user._id,
        participants: [
            { user: req.user._id, role: 'admin' },
            ...participants.map(userId => ({ user: userId, role: 'member' }))
        ]
    });

    return res
        .status(201)
        .json(new ApiResponse(201, chatRoom, "Chat room created successfully"));

})

const getUserChatRooms = async_handler(async (req, res) => {
    const chatRooms = await ChatRoom.findByUser(req.user._id);
    
    return res.status(200).json(
        new ApiResponse(200, chatRooms, "Chat rooms retrieved successfully")
    );
});

const getChatRoom = async_handler(async (req, res) => {
    const { roomId } = req.params;
    // console.log("Fetching chat room:", roomId);
    const chatRoom = await ChatRoom.findById(roomId);
    // console.log("Participants (raw):", chatRoom.participants);
    if (!chatRoom) {
        throw new ApiError(404, "Chat room not found");
    }
    // console.log("Chat room found:", chatRoom._id);
    // console.log("Chat room type:", chatRoom.type);

    // console.log("user ID:", req.user._id);
    // console.log("Chat room participants:", chatRoom.participants.map(p => p.user.toString()));
    if (!chatRoom.isParticipant(req.user._id)) {
        throw new ApiError(403, "You are not a participant of this chat room");
    }

    await chatRoom.updateLastSeen(req.user._id);
    
    return res
        .status(200)
        .json(new ApiResponse(200, chatRoom, "Chat room retrieved successfully"));

})

const addParticipant = async_handler(async (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.body;
    
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
        throw new ApiError(404, "Chat room not found");
    }

    const userRole = chatRoom.getParticipantRole(req.user._id);
    if (!['admin', 'moderator'].includes(userRole)) {
        throw new ApiError(403, "Only admins and moderators can add participants");
    }

    if (chatRoom.type === 'private') {
        throw new ApiError(400, "Cannot add participants to private rooms");
    }

    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
        throw new ApiError(404, "User not found");
    }

    await chatRoom.addParticipant(userId);

    const socketId = activeUsers.get(userId);
    if (socketId) {
        const io = req.app.get('io');
        io.to(socketId).emit('added_to_room', { roomId });
    }

    
    return res
        .status(200)
        .json(new ApiResponse(200, chatRoom, "Participant added successfully"));
})

const removeParticipant = async_handler(async (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.body;
    
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
        throw new ApiError(404, "Chat room not found");
    }
    
    const userRole = chatRoom.getParticipantRole(req.user._id);
    if (!['admin', 'moderator'].includes(userRole) && req.user._id.toString() !== userId) {
        throw new ApiError(403, "You don't have permission to remove this participant");
    }

    if (chatRoom.type === 'private') {
        throw new ApiError(400, "Cannot remove participants from private rooms");
    }

    await chatRoom.removeParticipant(userId);

    const socketId = activeUsers.get(userId);
    if (socketId) {
        const io = req.app.get('io');
        io.to(socketId).emit('removed_from_room', { roomId });
    }

    return res.status(200).json(
        new ApiResponse(200, chatRoom, "Participant removed successfully")
    );
});

const updateChatRoom = async_handler(async (req, res) => {
    const { roomId } = req.params;
    const { name, description } = req.body;
    
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
        throw new ApiError(404, "Chat room not found");
    }

    const userRole = chatRoom.getParticipantRole(req.user._id);
    if (!['admin', 'moderator'].includes(userRole)) {
        throw new ApiError(403, "Only admins and moderators can update room details");
    }

    if (name) chatRoom.name = name.trim();
    if (description !== undefined) chatRoom.description = description?.trim();
    
    await chatRoom.save();
    
    return res.status(200).json(
        new ApiResponse(200, chatRoom, "Chat room updated successfully")
    );
});

const leaveChatRoom = async_handler(async (req, res) => {
    const { roomId } = req.params;
    
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
        throw new ApiError(404, "Chat room not found");
    }
    
    // Cannot leave private room
    if (chatRoom.type === 'private') {
        throw new ApiError(400, "Cannot leave private rooms");
    }
    
    const leavingUserId = req.user._id.toString();
    
    // Check if user is actually a participant
    const isParticipant = chatRoom.participants.some(
        p => p.user._id.toString() === leavingUserId
    );
    
    if (!isParticipant) {
        throw new ApiError(400, "User is not a participant in this room");
    }
    
    const leavingUserRole = chatRoom.getParticipantRole(leavingUserId);
    
    // Remove user from participants
    await chatRoom.removeParticipant(req.user._id);
    
    // Get fresh data from database
    const updatedChatRoom = await ChatRoom.findById(roomId);
    
    // If no participants left, deactivate room
    if (updatedChatRoom.participants.length === 0) {
        updatedChatRoom.isActive = false;
        await updatedChatRoom.save();
    } else {
        // If leaving user was admin, promote next admin if exists
        if (leavingUserRole === 'admin') {
            // Check if there's any other admin left
            const hasOtherAdmin = updatedChatRoom.participants.some(
                p => p.role === 'admin'
            );

            if (!hasOtherAdmin) {
                // Promote first member to admin (fallback)
                const firstMember = updatedChatRoom.participants.find(p => p.role === 'member');
                if (firstMember) {
                    firstMember.role = 'admin';
                }
            }
        }
        await updatedChatRoom.save();
    }
    
    return res.status(200).json(
        new ApiResponse(200, null, "Left chat room successfully")
    );
});

module.exports = {
    createChatRoom,
    getUserChatRooms,
    getChatRoom,
    addParticipant,
    removeParticipant,
    updateChatRoom,
    leaveChatRoom
};




