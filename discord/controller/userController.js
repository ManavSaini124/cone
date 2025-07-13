const User = require('../models/userModel');
const async_handler = require('../utils/asyncHandler');
const ApiError = require('../utils/errorHandler');
const ApiResponse = require('../utils/apiResponse');
const jwt = require('jsonwebtoken');
const { sendOTPEmail, testEmailConnection } = require('../utils/emailService');

const generateTokens = async (user) => {
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
};

const setCookie = (res, accessToken, refreshToken) => {
    const cookieOptions = {
        httpOnly: true,
        secure: false,
        // secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/'
    };

    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

const checkUsername = async_handler(async (req, res) => {
    const { username } = req.body;
    
    if (!username || username.trim() === '') {
        throw new ApiError(400, "Username is required");
    }

    const normalizedUsername = username.trim();
    
    // Check if username exists (case-insensitive)
    const existingUser = await User.findOne({ 
        name: { $regex: new RegExp(`^${normalizedUsername}$`, 'i') } 
    });
    
    return res
        .status(200)
        .json(new ApiResponse(200, { available: !existingUser }, "Username availability checked"));
});

const sendOTP = async_handler(async (req, res) => {
    const { username, email, password } = req.body;
    console.log("Received registration data:", { username, email, password });
    console.log("Request body:", req.body);

    if([username, email, password].some((field)=> field.trim() === '')){
        throw new ApiError(400, "All fields are reqired");
    }

    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
        throw new ApiError(409, "User already exists and is verified");
    }

    const existingUsername = await User.findOne({ 
        name: { $regex: new RegExp(`^${username.trim()}$`, 'i') },
        isVerified: true 
    });

    if (existingUsername) {
        throw new ApiError(409, "Username is already taken");
    }

    let user;
    if (existingUser && !existingUser.isVerified) {
        // Update existing unverified user
        user = existingUser;
        user.name = username;
        user.password = password; // Will be hashed by pre-save hook
        user.tempRegistrationData = { username, email, password };
    } else {
        // Create new user (unverified)
        user = new User({
            name: username,
            email,
            password, // Will be hashed by pre-save hook
            isVerified: false,
            tempRegistrationData: { username, email, password }
        });
    }
    
    // Generate and set OTP
    const otp = user.generateOTP();
    await user.save();
    
    // Send OTP email
    try {
        // Ensure email service is connected
        console.log("Testing email connection...");
        await sendOTPEmail(email, otp, username);
        console.log(`OTP sent to ${email}: ${otp}`);
    } catch (error) {
        // Clean up user if email fails
        if (!existingUser) {
            await User.findByIdAndDelete(user._id);
        }
        throw new ApiError(500, "Failed to send OTP email");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, { email }, "OTP sent successfully"));

})


const registerUser = async_handler(async (req, res) => {
    
    const { email, otp } = req.body;
    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required");
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found. Please request a new OTP.");
    }
    
    // Verify OTP
    if (!user.verifyOTP(otp)) {
        throw new ApiError(400, "Invalid or expired OTP");
    }
    
    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.clearOTP();
    user.tempRegistrationData = null;
    await user.save();
    
    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user);
    setCookie(res, accessToken, refreshToken);
    
    const userData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
    
    return res
        .status(201)
        .json(new ApiResponse(201, userData, "User registered successfully"));
})

const loginUser = async_handler(async (req, res) => {
    const { email, password } = req.body;


    if([email, password].some((field)=> field.trim() === '')){
        throw new ApiError(400, "All fields are reqired");
    }

    const user = await User.findOne({ email });
    if(!user){
        throw new ApiError(404, "User not found");
    }

    if (!user.isVerified) {
        throw new ApiError(403, "Please verify your email first");
    }

    // console.log("User found:", user);
    const isMatch = await user.comparePassword(password);
    if(!isMatch){
        throw new ApiError(400, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateTokens(user);
    setCookie(res, accessToken, refreshToken);

    const UserData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    }
    // console.log("User logged in successfully:", UserData);

    return res
        .status(200)
        .json(new ApiResponse(200, UserData, "User logged in successfully"));
})

const logoutUser = async_handler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { 
        $unset: { refreshToken: 1 } 
    });

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res
        .status(200)
        .json(new ApiResponse(200, null, "User logged out successfully"));
})

const refreshAccessToken = async_handler(async(req, res) => {
    // console.log(req.cookies);
    const refreshToken = req.cookies?.refreshToken || 
                   req.header('Authorization')?.replace('Bearer ', '') ||
                   req.header('x-refresh-token') ||
                   req.body.refreshToken;

    if(!refreshToken){
        console.log("No refresh token found");
        throw new ApiError(401, "Unauthorized");
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_JWT_SECRET);
    if(!decoded || !decoded._id){
        console.log("Invalid refresh token");
        throw new ApiError(401, "Unauthorized");
    }
    const user = await User.findById(decoded._id);
    if(!user || user.refreshToken !== refreshToken){
        console.log("User not found or refresh token mismatch");
        throw new ApiError(401, "Unauthorized");
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);
    setCookie(res, accessToken, newRefreshToken);

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Access token refreshed successfully"));

})

const getUser = async_handler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if(!user){
        throw new ApiError(404, "User not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, user, "User found successfully"));
})

const searchUserFuzzy = async_handler(async (req, res) => {
    const { query, exact = false } = req.query;

    if (!query) {
        throw new ApiError(400, "Query parameter is required");
    }

    try {
        let users;

        if (exact === 'true') {
            // Exact match only
            users = await User.find({
                name: { $regex: `^${query}$`, $options: 'i' },
                isVerified: true
            }).select('-password -refreshToken').limit(15);;
        } else {
            // Create a flexible regex pattern
            // This allows for partial matches and some typos
            const searchPattern = query
                .split('')
                .map(char => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                .join('.*');

            users = await User.find({
                name: { $regex: searchPattern, $options: 'i' },
                isVerified: true
            }).select('-password -refreshToken');

            // Sort by relevance (closer matches first)
            users.sort((a, b) => {
                const aScore = calculateRelevanceScore(a.name, query);
                const bScore = calculateRelevanceScore(b.name, query);
                return bScore - aScore;
            });
        }

        if(!users || users.length === 0){
            return res.status(404).json(
                new ApiResponse(404, [], "No users found matching the search criteria")
            );
        }

        return res.status(200).json(
            new ApiResponse(200, users, `Found ${users.length} user(s) matching the search criteria`)
        );

    } catch (error) {
        throw new ApiError(500, "Error occurred while searching users");
    }
});

function calculateRelevanceScore(username, searchTerm) {
    const lowerUsername = username.toLowerCase();
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    // Exact match gets highest score
    if (lowerUsername === lowerSearchTerm) return 100;
    
    // Starts with search term gets high score
    if (lowerUsername.startsWith(lowerSearchTerm)) return 80;
    
    // Contains search term gets medium score
    if (lowerUsername.includes(lowerSearchTerm)) return 60;
    
    // Calculate character similarity
    let matches = 0;
    for (let i = 0; i < lowerSearchTerm.length; i++) {
        if (lowerUsername.includes(lowerSearchTerm[i])) {
            matches++;
        }
    }
    
    return (matches / lowerSearchTerm.length) * 40;
}




module.exports = {
    registerUser,
    checkUsername,
    sendOTP,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getUser,
    searchUserFuzzy
}