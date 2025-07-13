const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const async_handler = require('../utils/asyncHandler');
const ApiError = require('../utils/errorHandler');
const ApiResponse = require('../utils/apiResponse');

const protect = async_handler(async(req,res,next) =>{
    const token = req.cookies?.accessToken||
                    req.header("Authorization")?.replace("Bearer ","")||
                    req.body?.accessToken;
    // console.log("Token:", token); 
    // console.log("Cookies:", req.cookies);
    // console.log("Authorization header:", req.header("Authorization"));
    // console.log("Body token:", req.body?.accessToken);
    
    if(!token){
        return next(new ApiError(401,"Not authorized to access this route"));
    }

    const decode = jwt.verify(token, process.env.ACCESS_TOKEN_JWT_SECRET);
    req.user = await User.findById(decode._id).select("-password");
    if(!req.user){
        return next(new ApiError(401,"Not authorized to access this route"));
    }
    next();
})

module.exports = {protect};

