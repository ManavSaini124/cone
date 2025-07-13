const express = require('express');

const {
    createChatRoom,
    getUserChatRooms,
    getChatRoom,
    addParticipant,
    removeParticipant,
    updateChatRoom,
    leaveChatRoom
} = require('../controller/chatroomController');
const { protect } = require('../middleware/authMiddleware');
const { generalLimiter } = require('../middleware/rateLimiter')

const router = express.Router();
router.use(protect);
router.use(generalLimiter)

router.route('/create').post(createChatRoom)
router.route('/my-rooms').get(getUserChatRooms)
router.route('/:roomId').get(getChatRoom).put(updateChatRoom)

router.route('/:roomId/add-participant').post(addParticipant)
router.route('/:roomId/remove-participant').post(removeParticipant)
router.route('/:roomId/leave').post(leaveChatRoom)

module.exports = router;
