const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Message = require('../models/messageModel');
const ChatRoom = require('../models/chatRoomModel');

const activeUsers = new Map();
const userSockets = new Map();

const authenticateSocket = async (socket, next) => {
    try{
        const cookieHeader = socket.handshake.headers.cookie || '';
        const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
            const [k, v] = c.trim().split('=');
            return [k, decodeURIComponent(v)];
        })
        );

        // get token from cookies
        const token = cookies.accessToken;

        if (!token) {
        return next(new Error('Authentication error: No token found in cookies'));
        }

        // console.log('Socket authentication token:', token);

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_JWT_SECRET);
        const user = await User.findById(decoded._id).select('-password');

        if(!user) {
            return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next()
    }
    catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
    }
}

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    io.use(authenticateSocket);

    io.on('connection', async (socket) => {
        console.log(`User ${socket.user.name} connected with socket ${socket.id}`);
        
        //Tracks connected users
        //Creates a private room for the user (for direct notifications like messages or room invites)
        activeUsers.set(socket.userId, socket.id);
        userSockets.set(socket.id, socket.userId);
        
        // Join user to their personal room for direct notifications
        socket.join(`user_${socket.userId}`);
        
        // Join user to all their chat rooms
        try {
            //Finds all chat rooms the user is a part of.
            const userRooms = await ChatRoom.findByUser(socket.userId);
            userRooms.forEach(room => {
                socket.join(`room_${room._id}`);
            });
            
            // Notify user is online
            socket.broadcast.emit('user_online', {
                userId: socket.userId,
                userName: socket.user.name
            });
            
            // Send user their rooms and online status
            socket.emit('user_rooms', userRooms);
            
        } catch (error) {
            console.error('Error joining rooms:', error);
        }

        // Handle joining a specific room
        socket.on('join_room', async (roomId) => {
            try {
                //Verifies room exists and user is a participant
                const chatRoom = await ChatRoom.findById(roomId);
                if (!chatRoom) {
                    socket.emit('error', { message: 'Room not found' });
                    return;
                }
                
                if (!chatRoom.isParticipant(socket.userId)) {
                    socket.emit('error', { message: 'Not authorized to join this room' });
                    return;
                }
                
                // Joins socket to that room
                socket.join(`room_${roomId}`);
                await chatRoom.updateLastSeen(socket.userId);
                
                socket.emit('joined_room', { roomId });
                
                // Notify others in room that user joined
                socket.to(`room_${roomId}`).emit('user_joined_room', {
                    userId: socket.userId,
                    userName: socket.user.name,
                    roomId
                });
                
            } catch (error) {
                console.error('Error joining room:', error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        // Handle leaving a room
        // Leaves socket from room
        socket.on('leave_room', (roomId) => {
            socket.leave(`room_${roomId}`);
            socket.to(`room_${roomId}`).emit('user_left_room', {
                userId: socket.userId,
                userName: socket.user.name,
                roomId
            });
        });

        // Handle sending messages
        socket.on('send_message', async (data) => {
            try {
                console.log('📥 Backend received send_message:', data);
                const { roomId, content, messageType = 'text', replyTo } = data;
                
                if (!content || !content.trim()) {
                    socket.emit('error', { message: 'Message content is required' });
                    return;
                }
                
                // Verify user can send message to this room
                const chatRoom = await ChatRoom.findById(roomId);
                if (!chatRoom) {
                    socket.emit('error', { message: 'Room not found' });
                    return;
                }
                
                if (!chatRoom.isParticipant(socket.userId)) {
                    socket.emit('error', { message: 'Not authorized to send message to this room' });
                    return;
                }
                
                // Create message
                const message = await Message.create({
                    content: content.trim(),
                    sender: socket.userId,
                    chatRoom: roomId,
                    messageType,
                    replyTo: replyTo || null
                });
                console.log('💾 Message created:', message);
                
                // Update chat room's last message and activity
                chatRoom.lastMessage = message._id;
                chatRoom.lastActivity = new Date();
                await chatRoom.save();
                
                // Update user's last seen
                await chatRoom.updateLastSeen(socket.userId);
                
                // Populate message for broadcasting
                await message.populate([
                    { path: 'sender', select: 'name email' },
                    { 
                        path: 'replyTo', 
                        select: 'content sender createdAt',
                        populate: { path: 'sender', select: 'name' }
                    }
                ]);
                
                // Broadcast message to all users in the room
                io.to(`room_${roomId}`).emit('new_message', message);
                console.log('📡 Emitted new_message to room:', `room_${roomId}`);

                
                console.log('📡 Emitting new_message to room:', `room_${roomId}`);
                // Mark as delivered for online users in the room
                const roomParticipants = chatRoom.participants.map(p => p.user.toString());
                roomParticipants.forEach(async (participantId) => {
                    if (participantId !== socket.userId && activeUsers.has(participantId)) {
                        await message.markAsDelivered(participantId);
                    }
                });

                if (!chatRoom.isParticipant(socket.userId)) {
                    socket.emit('error', { message: 'Not authorized to send message to this room' });
                    return;
                }
                
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle message editing
        socket.on('edit_message', async (data) => {
            try {
                const { messageId, content } = data;
                
                if (!content || !content.trim()) {
                    socket.emit('error', { message: 'Message content is required' });
                    return;
                }
                
                const message = await Message.findById(messageId);
                if (!message) {
                    socket.emit('error', { message: 'Message not found' });
                    return;
                }
                console.log('Editing message:', message);
                
                if (message.sender._id.toString() !== socket.userId) {
                    socket.emit('error', { message: 'You can only edit your own messages' });
                    return;
                }
                
                // Check if message is not too old (15 minutes)
                const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
                if (message.createdAt < fifteenMinutesAgo) {
                    socket.emit('error', { message: 'Message is too old to edit' });
                    return;
                }
                
                message.content = content.trim();
                message.isEdited = true;
                message.editedAt = new Date();
                await message.save();
                
                // Broadcast edit to room
                io.to(`room_${message.chatRoom}`).emit('message_edited', {
                    messageId,
                    content: message.content,
                    isEdited: true,
                    editedAt: message.editedAt
                });
                
            } catch (error) {
                console.error('Error editing message:', error);
                socket.emit('error', { message: 'Failed to edit message' });
                process.on('unhandledRejection', (reason) => {
                    console.error('Unhandled rejection:', reason);
                });

                process.on('uncaughtException', (err) => {
                    console.error('Uncaught exception:', err);
                });
            }
        });


        // Handle message deletion
        socket.on('delete_message', async (data) => {
            try {
                const { messageId , forEveryone} = data;
                
                const message = await Message.findById(messageId);
                if (!message) {
                    socket.emit('error', { message: 'Message not found' });
                    return;
                }
                
                const chatRoom = await ChatRoom.findById(message.chatRoom);
                const userRole = chatRoom.getParticipantRole(socket.userId);
                
                if (forEveryone) {
                    // Check permission
                    if (
                        message.sender.toString() !== socket.userId &&
                        !['admin', 'moderator'].includes(userRole)
                    ) {
                        socket.emit('error', { message: "You don't have permission to delete this message" });
                        return;
                    }

                    message.isDeleted = true;
                    message.deletedAt = new Date();
                    message.content = 'This message was deleted';
                    await message.save();

                    io.to(`room_${message.chatRoom}`).emit('message_deleted', {
                        messageId,
                        content: message.content,
                        isDeleted: true,
                        deletedAt: message.deletedAt,
                        forEveryone: true,
                    });

                } else {
                    // ✅ DELETE FOR SELF (Client will just hide it)
                    await message.updateOne({ $addToSet: { deletedFor: socket.userId } });

                    socket.emit('message_deleted', {
                        messageId,
                        forEveryone: false,
                    });
                }
            } catch (error) {
                console.error('Error deleting message:', error);
                socket.emit('error', { message: 'Failed to delete message' });
            }
        });

        // Handle marking messages as read
        socket.on('mark_as_read', async (data) => {
            try {
                const { roomId, messageIds } = data;
                
                if (!messageIds || !Array.isArray(messageIds)) {
                    socket.emit('error', { message: 'Message IDs array is required' });
                    return;
                }
                
                const chatRoom = await ChatRoom.findById(roomId);
                if (!chatRoom || !chatRoom.isParticipant(socket.userId)) {
                    socket.emit('error', { message: 'Not authorized' });
                    return;
                }
                
                const messages = await Message.find({
                    _id: { $in: messageIds },
                    chatRoom: roomId
                });
                
                for (let message of messages) {
                    await message.markAsRead(socket.userId);
                }
                
                // Notify other participants about read status
                socket.to(`room_${roomId}`).emit('messages_read', {
                    userId: socket.userId,
                    userName: socket.user.name,
                    messageIds,
                    roomId
                });
                
            } catch (error) {
                console.error('Error marking messages as read:', error);
                socket.emit('error', { message: 'Failed to mark messages as read' });
            }
        });

        // Handle typing indicators
        socket.on('typing_start', (data) => {
            const { roomId } = data;
            socket.to(`room_${roomId}`).emit('user_typing', {
                userId: socket.userId,
                userName: socket.user.name,
                roomId
            });
        });

        socket.on('typing_stop', (data) => {
            const { roomId } = data;
            socket.to(`room_${roomId}`).emit('user_stop_typing', {
                userId: socket.userId,
                userName: socket.user.name,
                roomId
            });
        });

        // Handle forwarding messages
        socket.on('forward_messages', async (data) => {
            try {
                const { messageIds, targetRoomIds, content } = data;
                
                if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
                    socket.emit('error', { message: 'Message IDs array is required' });
                    return;
                }

                if (!targetRoomIds || !Array.isArray(targetRoomIds) || targetRoomIds.length === 0) {
                    socket.emit('error', { message: 'Target room IDs array is required' });
                    return;
                }

                // Verify all messages exist
                const messages = await Message.find({
                    _id: { $in: messageIds }
                }).populate('sender', 'name email');

                if (messages.length !== messageIds.length) {
                    socket.emit('error', { message: 'Some messages not found' });
                    return;
                }

                // Verify all target rooms exist and user is a participant
                const targetRooms = await ChatRoom.find({
                    _id: { $in: targetRoomIds }
                });

                if (targetRooms.length !== targetRoomIds.length) {
                    socket.emit('error', { message: 'Some target rooms not found' });
                    return;
                }

                // Check if user is participant in all target rooms
                for (const room of targetRooms) {
                    if (!room.isParticipant(socket.userId)) {
                        socket.emit('error', { message: `You are not a participant of room: ${room.name}` });
                        return;
                    }
                }

                const forwardedMessages = [];

                // Forward each message to each target room
                for (const message of messages) {
                    for (const targetRoom of targetRooms) {
                        // Create forwarded message
                        const forwardedMessage = await Message.create({
                            content: content || message.content,
                            sender: socket.userId,
                            chatRoom: targetRoom._id,
                            messageType: message.messageType,
                            isForwarded: true,
                            forwardedFrom: {
                                originalMessage: message._id,
                                originalSender: message.sender._id,
                                originalRoom: message.chatRoom,
                                forwardedBy: socket.userId,
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

                        // Broadcast the forwarded message to the target room
                        io.to(`room_${targetRoom._id}`).emit('new_message', forwardedMessage);
                    }
                }

                // Notify the sender that forwarding was successful
                socket.emit('messages_forwarded', {
                    messageIds,
                    targetRoomIds,
                    forwardedMessages
                });

            } catch (error) {
                console.error('Error forwarding messages:', error);
                socket.emit('error', { message: 'Failed to forward messages' });
            }
        });

        // Handle creating new chat room
        socket.on('create_room', async (data) => {
            try {
                const { name, description, type = 'group', participants = [] } = data;
                
                if (!name || !name.trim()) {
                    socket.emit('error', { message: 'Room name is required' });
                    return;
                }
                
                // For private rooms, ensure only 1 other participant
                if (type === 'private' && participants.length !== 1) {
                    socket.emit('error', { message: 'Private rooms must have exactly 2 participants' });
                    return;
                }
                
                // Check if private room already exists
                if (type === 'private') {
                    const existingRoom = await ChatRoom.findOne({
                        type: 'private',
                        'participants.user': { $all: [socket.userId, participants[0]] }
                    });
                    
                    if (existingRoom) {
                        socket.emit('room_created', existingRoom);
                        return;
                    }
                }
                
                // Verify participants exist
                const participantUsers = await User.find({ 
                    _id: { $in: participants } 
                }).select('name email');
                
                if (participantUsers.length !== participants.length) {
                    socket.emit('error', { message: 'Some participants don\'t exist' });
                    return;
                }
                
                // Create chat room
                const chatRoom = await ChatRoom.create({
                    name: name.trim(),
                    description: description?.trim(),
                    type,
                    createdBy: socket.userId,
                    participants: [
                        { user: socket.userId, role: 'admin' },
                        ...participants.map(userId => ({ user: userId, role: 'member' }))
                    ]
                });
                
                await chatRoom.populate([
                    { path: 'participants.user', select: 'name email' },
                    { path: 'createdBy', select: 'name email' }
                ]);
                
                // Join creator to room
                socket.join(`room_${chatRoom._id}`);
                
                // Notify all participants about new room
                participants.forEach(participantId => {
                    if (activeUsers.has(participantId)) {
                        const participantSocketId = activeUsers.get(participantId);
                        io.to(participantSocketId).emit('new_room', chatRoom);
                        io.sockets.sockets.get(participantSocketId)?.join(`room_${chatRoom._id}`);
                    }
                });
                
                socket.emit('room_created', chatRoom);
                
            } catch (error) {
                console.error('Error creating room:', error);
                socket.emit('error', { message: 'Failed to create room' });
            }
        });

        // Handle getting online users
        socket.on('get_online_users', () => {
            const onlineUserIds = Array.from(activeUsers.keys());
            socket.emit('online_users', onlineUserIds);
        });

        socket.on("get_online_users_in_room", async (roomId) => {
            try {
                const chatRoom = await ChatRoom.findById(roomId).populate('participants.user', 'name email');

                if (!chatRoom) {
                socket.emit("error", { message: "Room not found" });
                return;
                }

                if (!chatRoom.isParticipant(socket.userId)) {
                socket.emit("error", { message: "Not authorized to view this room" });
                return;
                }

                const onlineUsers = chatRoom.participants
                .filter(p => activeUsers.has(p.user._id.toString()))
                .map(p => ({
                    _id: p.user._id,
                    name: p.user.name,
                    email: p.user.email
                }));

                socket.emit("online_users_in_room", {
                roomId,
                users: onlineUsers,
                count: onlineUsers.length
                });
            } catch (err) {
                console.error("Error getting online users in room:", err);
                socket.emit("error", { message: "Failed to get online users" });
            }
        });



        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`User ${socket.user.name} disconnected`);
            
            // Remove from active users
            activeUsers.delete(socket.userId);
            userSockets.delete(socket.id);
            
            // Notify others user is offline
            socket.broadcast.emit('user_offline', {
                userId: socket.userId,
                userName: socket.user.name
            });
        });

        socket.on('remove_user_from_room', async ({ roomId, userIdToRemove }) => {
            try {
                const room = await ChatRoom.findById(roomId);
                if (!room) {
                    return socket.emit('error', { message: 'Room not found' });
                }

                // Only allow admin or moderator to remove members
                const currentUserRole = room.getParticipantRole(socket.userId);
                if (!['admin', 'moderator'].includes(currentUserRole)) {
                    return socket.emit('error', { message: 'Not authorized to remove users' });
                }

                // Can't remove self or another admin unless you're admin
                const targetRole = room.getParticipantRole(userIdToRemove);
                if (targetRole === 'admin' && currentUserRole !== 'admin') {
                    return socket.emit('error', { message: 'Cannot remove another admin unless you are admin' });
                }

                // Remove user from participants
                room.participants = room.participants.filter(p => p.user.toString() !== userIdToRemove);
                await room.save();

                // Kick the user from the room socket
                const targetSocketId = activeUsers.get(userIdToRemove);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('removed_from_room', { roomId });
                    io.sockets.sockets.get(targetSocketId)?.leave(`room_${roomId}`);
                }

                // Notify others in the room
                io.to(`room_${roomId}`).emit('user_removed', {
                    userId: userIdToRemove,
                    roomId,
                });

            } catch (err) {
                console.error('Error removing user from room:', err);
                socket.emit('error', { message: 'Failed to remove user' });
            }
        });

        socket.on('make_admin', async ({ roomId, userId }) => {
            try {
                const room = await ChatRoom.findById(roomId);
                if (!room) return socket.emit('error', { message: 'Room not found' });

                const currentUserRole = room.getParticipantRole(socket.userId);
                if (currentUserRole !== 'admin') {
                return socket.emit('error', { message: 'Only admins can promote others' });
                }

                const participant = room.participants.find(p => p.user.toString() === userId);
                if (participant) {
                participant.role = 'admin';
                await room.save();

                io.to(`room_${roomId}`).emit('user_promoted', { userId, role: 'admin' });
                }
            } catch (err) {
                console.error('Error making admin:', err);
                socket.emit('error', { message: 'Failed to promote user' });
            }
        });

        socket.on('revoke_admin', async ({ roomId, userId }) => {
            try {
                const room = await ChatRoom.findById(roomId);
                if (!room) return socket.emit('error', { message: 'Room not found' });

                const currentUserRole = room.getParticipantRole(socket.userId);
                if (currentUserRole !== 'admin') {
                return socket.emit('error', { message: 'Only admins can revoke admin rights' });
                }

                const participant = room.participants.find(p => p.user.toString() === userId);
                if (participant && participant.role === 'admin') {
                participant.role = 'member';
                await room.save();

                io.to(`room_${roomId}`).emit('user_demoted', { userId, role: 'member' });
                }
            } catch (err) {
                console.error('Error revoking admin:', err);
                socket.emit('error', { message: 'Failed to revoke admin rights' });
            }
        });



        socket.on('added_to_room', async ({ roomId }) => {
            socket.join(`room_${roomId}`);
            socket.emit('joined_room', { roomId });
        });

        socket.on('removed_from_room', async ({ roomId }) => {
            socket.leave(`room_${roomId}`);
            socket.emit('left_room', { roomId });
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    return io;
};

module.exports = initializeSocket;

