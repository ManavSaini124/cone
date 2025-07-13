require("dotenv").config();
const express = require("express")
const http = require("http");
const cors = require("cors");
const cookieParser = require('cookie-parser');

const rateLimit = require("express-rate-limit");
const connectDB = require("./config/connect");
const userRoute = require("./routes/userRoute");
const messageRoutes = require("./routes/messageRoute");
const chatRoomRoutes = require("./routes/chatroomRoute");
const initializeSocket = require("./sockets/socket");

console.log("✅ EMAIL_USER loaded:", process.env.EMAIL_USER);
console.log("✅ EMAIL_PASSWORD exists:", !!process.env.EMAIL_PASSWORD);

const app = express();
const server = http.createServer(app);

// Initialize socket.io
const io = initializeSocket(server);

// Make io available in req object for controllers
app.use((req, res, next) => {
    req.io = io;
    next();
});
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    // sameSite: 'Lax',
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"]
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs globally  
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
}))

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});


app.use("/api/v1/user", userRoute);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/chat-rooms", chatRoomRoutes);

const start = async()=>{
    try{
        connectDB(process.env.DB_STRING);
        const port = process.env.PORT || 3000;
        server.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    }catch(err){
        console.error("Error starting the server:", err);
        process.exit(1);
    }
}

start()
