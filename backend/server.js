// -------------------------------
// 📦 Core Dependencies
// -------------------------------
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const passport = require('passport');
const session = require('express-session');
const cloudinary = require('cloudinary').v2;
const rateLimit = require('express-rate-limit');
const http = require('http');
const path = require('path');

// -------------------------------
// 🔧 Configuration Imports
// -------------------------------
dotenv.config();

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Initialize passport Google OAuth
require('./passport')(passport);

// -------------------------------
// 🚀 Express App Setup
// -------------------------------
const app = express();
const server = http.createServer(app);

// -------------------------------
// 🔌 Socket.io Setup
// -------------------------------
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    },
    pingTimeout: 60000,
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true,
    }
});

// -------------------------------
// 🕵️‍♂️ Middleware Configuration
// -------------------------------
// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Basic middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(limiter);

// Session configuration
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Request logging in development
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.url}`);
        next();
    });
}

// -------------------------------
// 📱 Socket.io Event Handlers
// -------------------------------
let onlineUsers = new Map();
let activeStudySessions = new Map();

// Socket middleware for authentication
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        // You can add JWT verification here using your JWT_SECRET
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // socket.user = decoded;
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
});

// Debug middleware for development
if (process.env.NODE_ENV === 'development') {
    io.use((socket, next) => {
        console.log('Socket Debug:', {
            id: socket.id,
            handshake: socket.handshake,
            rooms: socket.rooms
        });
        next();
    });
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User comes online
    socket.on('user_online', (userId) => {
        socket.data.userId = userId;
        onlineUsers.set(userId, socket.id);
        io.emit('user_status', { userId, status: 'online' });
    });

    // Chat message handling
    socket.on('send_message', async (messageData) => {
        const recipientSocket = onlineUsers.get(messageData.receiverId);
        if (recipientSocket) {
            io.to(recipientSocket).emit('receive_message', messageData);
        }
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
        const recipientSocket = onlineUsers.get(data.receiverId);
        if (recipientSocket) {
            io.to(recipientSocket).emit('typing_indicator', {
                userId: data.userId,
                status: 'typing'
            });
        }
    });

    // Video call signaling
    socket.on('video_call_offer', (data) => {
        const recipientSocket = onlineUsers.get(data.receiverId);
        if (recipientSocket) {
            io.to(recipientSocket).emit('video_call_offer', {
                offer: data.offer,
                callerId: data.callerId
            });
        }
    });

    socket.on('video_call_answer', (data) => {
        const callerSocket = onlineUsers.get(data.callerId);
        if (callerSocket) {
            io.to(callerSocket).emit('video_call_answer', {
                answer: data.answer,
                answererId: data.answererId
            });
        }
    });

    socket.on('ice_candidate', (data) => {
        const recipientSocket = onlineUsers.get(data.recipientId);
        if (recipientSocket) {
            io.to(recipientSocket).emit('ice_candidate', {
                candidate: data.candidate,
                senderId: data.senderId
            });
        }
    });

    // Study session events
    socket.on('join_study_session', (sessionId) => {
        const roomId = `study_${sessionId}`;
        socket.join(roomId);
        
        // Track active sessions
        if (!activeStudySessions.has(sessionId)) {
            activeStudySessions.set(sessionId, new Set());
        }
        activeStudySessions.get(sessionId).add(socket.data.userId);

        // Emit join event
        io.to(roomId).emit('user_joined_study', {
            userId: socket.data.userId,
            sessionId,
            participantCount: activeStudySessions.get(sessionId).size
        });

        // Handle study session specific events
        socket.on('study_session_activity', (data) => {
            io.to(roomId).emit('study_update', {
                ...data,
                userId: socket.data.userId
            });
        });

        // Cleanup when leaving session
        socket.on('leave_study_session', () => {
            leaveStudySession(socket, sessionId);
        });
    });

    // Function to handle leaving study session
    const leaveStudySession = (socket, sessionId) => {
        const roomId = `study_${sessionId}`;
        socket.leave(roomId);
        
        if (activeStudySessions.has(sessionId)) {
            const session = activeStudySessions.get(sessionId);
            session.delete(socket.data.userId);
            
            if (session.size === 0) {
                activeStudySessions.delete(sessionId);
            } else {
                io.to(roomId).emit('user_left_study', {
                    userId: socket.data.userId,
                    sessionId,
                    participantCount: session.size
                });
            }
        }
    };

    // Ping check
    socket.on('ping_check', () => {
        socket.emit('pong_response');
    });

    // Error handling for socket events
    socket.on('error', (error) => {
        console.error('Socket error:', error);
        socket.emit('error_occurred', {
            message: 'An error occurred',
            code: error.code
        });
    });

    // Disconnect handling
    socket.on('disconnect', (reason) => {
        let userId;
        for (const [key, value] of onlineUsers.entries()) {
            if (value === socket.id) {
                userId = key;
                break;
            }
        }
        if (userId) {
            // Clean up user's presence
            onlineUsers.delete(userId);
            io.emit('user_status', { 
                userId, 
                status: 'offline',
                reason: reason 
            });

            // Clean up from any study sessions
            for (const [sessionId, participants] of activeStudySessions.entries()) {
                if (participants.has(userId)) {
                    leaveStudySession(socket, sessionId);
                }
            }
        }

        console.log(`User disconnected: ${socket.id}, Reason: ${reason}`);
    });
});

// -------------------------------
// 📈 Database Connection
// -------------------------------
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    retryWrites: true
})
.then(() => {
    console.log('✅ Connected to MongoDB');
})
.catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

mongoose.connection.on('error', err => {
    console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
});

// -------------------------------
// 🚣️ Routes
// -------------------------------
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Study Buddy API' });
});


// User routes
app.use('/api/users', require('./routes/userRoutes'));
// Interaction routes
app.use('/api/interactions', require('./routes/interactionRoutes'));
// Message routes
app.use('/api/messages', require('./routes/messageRoutes'));
// TODO: Add match and message routes if present
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/matches', require('./routes/matchRoutes'));
// app.use('/api/chat', require('./routes/chatRoutes'));
// app.use('/api/study-sessions', require('./routes/studySessionRoutes'));
// app.use('/api/upload', require('./routes/uploadRoutes'));

// -------------------------------
// ❌ Error Handling Middleware
// -------------------------------
app.use((err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: Object.values(err.errors).map(val => val.message)
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }

    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
});

// -------------------------------
// 🚀 Server Launch
// -------------------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`
🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}
📱 Socket.io ready for real-time communication
🔐 Security measures active
� API endpoints available
🔄 Auto-reconnection enabled
    `);
});
