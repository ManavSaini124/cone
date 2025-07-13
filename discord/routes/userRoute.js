const express = require("express")
const {
    registerUser,
    checkUsername,
    sendOTP,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getUser,
    searchUserFuzzy} = require("../controller/userController")
const {protect} = require("../middleware/authMiddleware")
const {
    generalLimiter,
    authLimiter,
    passwordResetLimiter,
    refreshTokenLimiter } = require("../middleware/rateLimiter")

const router = express.Router()

router.route('/check-username').post(generalLimiter, checkUsername);
router.route('/send-otp').post(authLimiter, sendOTP);
router.route('/register').post(authLimiter,registerUser)


router.route("/search").get(protect, generalLimiter, searchUserFuzzy);
router.route('/login').post(authLimiter,loginUser)
router.route('/refresh').get(refreshTokenLimiter,refreshAccessToken)
router.route('/logout').post(protect, logoutUser);
router.route('/me').get(protect, getUser);

 
module.exports = router