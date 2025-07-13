const {Schema, model} = require('mongoose');

const chatRoomSchema = new Schema({
    name:{
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },

    description:{
        type: String,
        trim: true,
        maxlength: 500
    },

    type:{
        type: String,
        enum: ['private', 'group', 'Public'],
        default: 'private'
    },

    participants:[{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        lastSeen: {
            type: Date,
            default: Date.now
        }
    }],
    
    createdBy:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    lastMessage:{
        type: Schema.Types.ObjectId,
        ref: 'Message'
    },

    lastActivity:{
        type: Date,
        default: Date.now
    },
    
    avatar:{
        type: String,
        default: null,
        trim: true
    },

    isActive:{
        type: Boolean,
        default: true
    },

    settings:{
        allowMessagesFrom: {
            type: String,
            enum: ['everyone', 'participants', 'admins'],
            default: 'participants'
        },
        muteNotifications: {
            type: Boolean,
            default: false
        }
    }
},{ timestamps: true });

// indexing
chatRoomSchema.index({ 'participants.user': 1})
chatRoomSchema.index({ type: 1, isActive: 1})
chatRoomSchema.index({ lastActivity: -1 });

// pre-save hook Populate participants when querying
// for user fetch name and email
// for message fetch content, sender, createdAt and messageType
chatRoomSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'participants.user',
        select: 'name email'
    }).populate({
        path: 'lastMessage',
        select: 'content sender createdAt messageType'
    }).populate({
        path: 'createdBy',
        select: 'name email'
    });
    next();
});

chatRoomSchema.methods.addParticipant = function(userId, role = 'member') {
    const existingParticipant = this.participants.find(p => p.user._id.toString() === userId.toString());
    if (!existingParticipant) {
        this.participants.push({
            user: userId,
            role: role
        });
    }
    return this.save(); 
}

chatRoomSchema.methods.removeParticipant = function(userId) {
    this.participants = this.participants.filter(p => p.user._id.toString() !== userId.toString());
    return this.save();
};

chatRoomSchema.methods.updateParticipantRole = function(userId, newRole) {
    const participant = this.participants.find(p => p.user._id.toString() === userId.toString());
    if (participant) {
        participant.role = newRole;
    }
    return this.save();
};

chatRoomSchema.methods.updateLastSeen = function(userId) {
    const participant = this.participants.find(p => p.user._id.toString() === userId.toString());
    if (participant) {
        participant.lastSeen = new Date();
    }
    this.lastActivity = new Date();
    return this.save();
};

chatRoomSchema.methods.isParticipant = function(userId) {
    return this.participants.some((p) => {
        const uid = p.user._id ? p.user._id.toString() : p.user.toString();
        // console.log("Checking participant:", uid , "against userId:", userId.toString());
        return uid === userId.toString()
    });
};

chatRoomSchema.methods.getParticipantRole = function(userId) {
    const participant = this.participants.find(p => p.user._id.toString() === userId.toString());
    return participant ? participant.role : null;
};

chatRoomSchema.statics.findByUser = function(userId) {
    return this.find({
        'participants.user': userId,
        isActive: true
    }).sort({ lastActivity: -1 });
};



const ChatRoom = model('ChatRoom', chatRoomSchema);
module.exports = ChatRoom;