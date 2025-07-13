const express = require('express');
const{
    getMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    getUnreadCount,
    ForwardMessage
} = require("../controller/messageController")

const { protect } = require("../middleware/authMiddleware");
const { generalLimiter } = require("../middleware/rateLimiter");

const router = express.Router();
router.use(protect);
router.use(generalLimiter); 

router.route('/room/:roomId').get(getMessages)
router.route('/send').post(sendMessage)
router.route('/:messageId/edit').put(editMessage)
router.route('/:messageId').delete(deleteMessage)
router.route('/room/:roomId/read').post(markAsRead)
router.route('/room/:roomId/unread-count').get(getUnreadCount)
router.route('/forward').post(ForwardMessage)

module.exports = router;
