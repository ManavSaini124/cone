const {Schema, model} = require('mongoose');

const messageSchema = new Schema({
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    chatRoom: {
        type: Schema.Types.ObjectId,
        ref: 'ChatRoom',
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'system'],
        default: 'text'
    },

    isForwarded: {
        type: Boolean,
        default: false
    },

    forwardedFrom: {
        originalMessage: {
            type: Schema.Types.ObjectId,
            ref: 'Message'
        },
        originalSender: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        originalRoom: {
            type: Schema.Types.ObjectId,
            ref: 'ChatRoom'
        },
        forwardedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        forwardedAt: {
            type: Date
        }
    },
    
    // 
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    // message reffered to
    replyTo: {
        type: Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    // Date.now -> runs immediately at schema definition time, and all documents get the same timestamp
    readBy: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    deliveredTo: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        deliveredAt: {
            type: Date,
            default: Date.now
        }
    }],
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    },
    deletedAt: { type: Date },
    deletedFor: 
    [{ 
        type: Schema.Types.ObjectId,
         ref: 'User' 
    }],

},{timestamps: true});

messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

// runs before every find query and populates the sender and replyTo fields
messageSchema.pre(/^find/, function(next) {
    // const userId = this.getQuery().userIdToFilter;

    // if (userId) {
    //     this.where({ deletedFor: { $ne: userId } });
    //     delete this.getQuery().userIdToFilter; // clean up
    // }
    this.populate({
        path: 'sender',
        select: 'name email'
    }).populate({
        path: 'replyTo',
        select: 'content sender createdAt',
        populate: {
            path: 'sender',
            select: 'name'
        }
    });
    next();
});

// mark a message as read
messageSchema.methods.markAsRead = function(userId) {
    const alreadyRead = this.readBy.some(read => read.user.toString() === userId.toString());
    if (!alreadyRead) {
        this.readBy.push({ user: userId });
    }
    return this.save();
};

// checks if a message has already been delivered to a user with the given userId
messageSchema.methods.markAsDelivered = function(userId) {
    const alreadyDelivered = this.deliveredTo.some(delivered => delivered.user.toString() === userId.toString());
    if (!alreadyDelivered) {
        this.deliveredTo.push({ user: userId });
    }
    return this.save();
};

const Message = model('Message', messageSchema);
module.exports = Message;