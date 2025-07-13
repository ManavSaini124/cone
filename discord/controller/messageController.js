const async_handler = require('../utils/asyncHandler');
const ApiError = require('../utils/errorHandler');
const ApiResponse = require('../utils/apiResponse');
const Message = require('../models/messageModel');
const ChatRoom = require('../models/chatRoomModel');

const getMessages = async_handler(async(req,res)=>{
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // console.log("Room ID from params:", roomId);
    // console.log("All params:", req.params);

    const chatRoom = await ChatRoom.findById(roomId);
    // console.log("Chat Room:", chatRoom);
    if (!chatRoom) {
        throw new ApiError(404, "Chat room not found");
    }

    if (!chatRoom.isParticipant(req.user._id)) {
        throw new ApiError(403, "You are not a participant of this chat room");
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({
        chatRoom: roomId,
        isDeleted: false
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const undeliveredMessages = messages.filter(msg => 
        !msg.deliveredTo.some(d => d.user.toString() === req.user._id.toString()) &&
        msg.sender.toString() !== req.user._id.toString()
    );

    for (let message of undeliveredMessages) {
        await message.markAsDelivered(req.user._id);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, messages.reverse(), "Messages retrieved successfully"));
})

const sendMessage = async_handler(async(req,res)=>{
    const { roomId, content, messageType = 'text', replyTo } = req.body;
    if (!content || !content.trim()) {
        throw new ApiError(400, "Message content is required");
    }

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
        throw new ApiError(404, "Chat room not found");
    }

    if (!chatRoom.isParticipant(req.user._id)) {
        throw new ApiError(403, "You are not a participant of this chat room");
    }

    const message = await Message.create({
        content: content.trim(),
        sender: req.user._id,
        chatRoom: roomId,
        messageType,
        replyTo: replyTo || null
    });

    chatRoom.lastMessage = message._id;
    chatRoom.lastActivity = new Date();
    await chatRoom.save();

    await chatRoom.updateLastSeen(req.user._id);

    await message.populate([
        { path: 'sender', select: 'name email' },
        { path: 'replyTo', select: 'content sender createdAt' }
    ]);

    return res.status(201).json(
        new ApiResponse(201, message, "Message sent successfully")
    );
}) 

const editMessage = async_handler(async (req, res) => {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
        throw new ApiError(400, "Message content is required");
    }

    console.log("Current user ID:", req.user._id);
    console.log("Current user ID type:", typeof req.user._id);

    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(404, "Message not found");
    }

    console.log("Message sender:", message.sender._id);
    console.log("Message sender type:", typeof message.sender);
    console.log("Are they equal?", message.sender.toString() === req.user._id.toString());

    if (message.sender._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only edit your own messages");
    }

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
        throw new ApiError(400, "Message is too old to edit");
    }

    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    return res
        .status(200)
        .json(new ApiResponse(200, message, "Message edited successfully"));

})

const deleteMessage = async_handler(async (req, res) => {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(404, "Message not found");
    }

    const chatRoom = await ChatRoom.findById(message.chatRoom);
    const userRole = chatRoom.getParticipantRole(req.user._id);

    if (message.sender.toString() !== req.user._id.toString() && 
        !['admin', 'moderator'].includes(userRole)) {
        throw new ApiError(403, "You don't have permission to delete this message");
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = "This message was deleted";
    await message.save();

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Message deleted successfully"));

})

const markAsRead = async_handler(async (req, res) => {
    const { roomId } = req.params;
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds)) {
        throw new ApiError(400, "Message IDs array is required");
    }

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
        throw new ApiError(404, "Chat room not found");
    }
    
    if (!chatRoom.isParticipant(req.user._id)) {
        throw new ApiError(403, "You are not a participant of this chat room");
    }

    const messages = await Message.find({
        _id: { $in: messageIds },
        chatRoom: roomId
    });
    
    for (let message of messages) {
        await message.markAsRead(req.user._id);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Messages marked as read"));

})

const getUnreadCount = async_handler(async (req, res) => {
    const { roomId } = req.params;

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
        throw new ApiError(404, "Chat room not found");
    }
    
    if (!chatRoom.isParticipant(req.user._id)) {
        throw new ApiError(403, "You are not a participant of this chat room");
    }
    
    const unreadCount = await Message.countDocuments({
        chatRoom: roomId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id },
        isDeleted: false
    });
    
    return res.status(200).json(
        new ApiResponse(200, { unreadCount }, "Unread count retrieved successfully")
    );
});

const ForwardMessage = async_handler(async(req,res)=>{
    const { messageIds, targetRoomIds, content } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
        throw new ApiError(400, "Message IDs array is required");
    }

    if (!targetRoomIds || !Array.isArray(targetRoomIds) || targetRoomIds.length === 0) {
        throw new ApiError(400, "Target room IDs array is required");
    }

    // Verify all messages exist and user has access to them
    const messages = await Message.find({
        _id: { $in: messageIds }
    }).populate('sender', 'name email');

    if (messages.length !== messageIds.length) {
        throw new ApiError(404, "Some messages not found");
    }

    // Verify all target rooms exist and user is a participant
    const targetRooms = await ChatRoom.find({
        _id: { $in: targetRoomIds }
    });

    if (targetRooms.length !== targetRoomIds.length) {
        throw new ApiError(404, "Some target rooms not found");
    }

    // Check if user is participant in all target rooms
    for (const room of targetRooms) {
        if (!room.isParticipant(req.user._id)) {
            throw new ApiError(403, `You are not a participant of room: ${room.name}`);
        }
    }

    const forwardedMessages = [];

    // Forward each message to each target room
    for (const message of messages) {
        for (const targetRoom of targetRooms) {
            // Create forwarded message
            const forwardedMessage = await Message.create({
                content: content || message.content,
                sender: req.user._id,
                chatRoom: targetRoom._id,
                messageType: message.messageType,
                isForwarded: true,
                forwardedFrom: {
                    originalMessage: message._id,
                    originalSender: message.sender._id,
                    originalRoom: message.chatRoom,
                    forwardedBy: req.user._id,
                    forwardedAt: new Date()
                }
            });

            // Update target room's last message and activity
            targetRoom.lastMessage = forwardedMessage._id;
            targetRoom.lastActivity = new Date();
            await targetRoom.save();

            // Populate the forwarded message
            await forwardedMessage.populate([
                { path: 'sender', select: 'name email' },
                { 
                    path: 'forwardedFrom.originalMessage', 
                    select: 'content sender createdAt',
                    populate: { path: 'sender', select: 'name' }
                },
                { 
                    path: 'forwardedFrom.originalSender', 
                    select: 'name email' 
                },
                { 
                    path: 'forwardedFrom.originalRoom', 
                    select: 'name' 
                }
            ]);

            forwardedMessages.push(forwardedMessage);
        }
    }

    return res.status(201).json(
        new ApiResponse(201, forwardedMessages, "Messages forwarded successfully")
    );
})

module.exports = {
    getMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    getUnreadCount,
    ForwardMessage
};