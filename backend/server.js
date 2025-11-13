// server.js

import express from 'express';
import cors from 'cors';
import { 
    users, 
    findUserById, 
    findConversationBetween, 
    createConversation, 
    getConversationsForUser,
    getConversationById,
    addMessageToConversation,
    getMessagesInConversation,
    registerUser, // <-- NEW
    loginUser     // <-- NEW
} from './data.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors()); 
app.use(express.json()); 

/**
 * Middleware สำหรับดึง Current User และยืนยันตัวตน
 * Note: ตอนนี้เราจะดึง User ID จาก 'x-user-id' header หรือ 'token'
 * ในการใช้งานจริงควรใช้ JWT
 */
const getCurrentUser = (req, res, next) => {
    // เรายังคงใช้ x-user-id เป็น ID ของผู้ใช้ปัจจุบัน
    const currentUserId = req.headers['x-user-id']; 

    if (!currentUserId) {
        req.currentUser = null;
    } else {
        const user = findUserById(currentUserId);
        req.currentUser = user;
    }
    next();
};

app.use(getCurrentUser);


// --- Utility for Authorization ---
const authorize = (req, res, next) => {
    if (!req.currentUser) {
        // แก้ไขข้อความ Error ให้สอดคล้องกับการ Login
        return res.status(401).json({ error: 'Unauthorized. Please login by providing a valid x-user-id header.' });
    }
    next();
};


// --- AUTH Endpoints ---

// NEW: Endpoint สำหรับ Register
app.post('/register', (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const result = registerUser(name, password);

    if (!result.success) {
        return res.status(409).json({ error: result.error }); // 409 Conflict
    }

    // ในโลกจริงควรคืนค่า Token
    res.status(201).json({ 
        message: 'User registered successfully.', 
        userId: result.user.id,
        userName: result.user.name
    });
});

// NEW: Endpoint สำหรับ Login
app.post('/login', (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const result = loginUser(name, password);

    if (!result.success) {
        return res.status(401).json({ error: result.error }); // 401 Unauthorized
    }

    // ในโลกจริงควรคืนค่า Token
    res.status(200).json({ 
        message: 'Login successful.', 
        userId: result.user.id,
        userName: result.user.name 
    });
});


// --- USER/CONVERSATION Endpoints (ต้องผ่าน authorize) ---

// 1. Get current user (GET /users/me)
app.get('/users/me', authorize, (req, res) => {
    res.json(req.currentUser);
});

// 2. List conversations (GET /conversations)
app.get('/conversations', authorize, (req, res) => {
    const currentUserId = req.currentUser.id;
    const userConversations = getConversationsForUser(currentUserId);
    
    // จัดรูปแบบข้อมูล
    const formattedConversations = userConversations.map(conv => {
        const otherParticipantId = conv.participants.find(id => id !== currentUserId);
        const otherParticipant = findUserById(otherParticipantId);

        return {
            id: conv.id,
            otherParticipant: {
                id: otherParticipant?.id,
                name: otherParticipant?.name,
            },
            lastMessage: conv.lastMessage?.content || null,
            lastMessageTimestamp: conv.lastMessage?.timestamp || null,
        };
    });

    res.json(formattedConversations);
});

// 3. Start conversation (POST /conversations)
app.post('/conversations', authorize, (req, res) => {
    const currentUserId = req.currentUser.id;
    const { otherUserId } = req.body;

    // Validation & Logic... (โค้ดเดิม)
    if (!otherUserId) {
        return res.status(400).json({ error: 'Missing otherUserId in request body.' }); 
    }
    if (currentUserId === otherUserId) {
        return res.status(400).json({ error: 'Cannot start conversation with yourself.' }); 
    }
    const otherUser = findUserById(otherUserId);
    if (!otherUser) {
        return res.status(404).json({ error: 'The specified otherUserId does not exist.' }); 
    }

    const existingConv = findConversationBetween(currentUserId, otherUserId);
    if (existingConv) {
        return res.status(200).json({ 
            message: 'Conversation already exists.', 
            conversationId: existingConv.id 
        });
    }

    const newConversation = createConversation(currentUserId, otherUserId);
    
    res.status(201).json({ 
        message: 'Conversation created successfully.', 
        conversationId: newConversation.id 
    });
});

// 4. List messages (GET /conversations/:id/messages)
app.get('/conversations/:id/messages', authorize, (req, res) => {
    const currentUserId = req.currentUser.id;
    const convId = req.params.id;

    // Authorization & Logic... (โค้ดเดิม)
    const conversation = getConversationById(convId);
    if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found.' });
    }
    if (!conversation.participants.includes(currentUserId)) {
        return res.status(403).json({ error: 'Forbidden. You are not a participant in this conversation.' }); 
    }

    const messages = getMessagesInConversation(convId);
    res.json(messages);
});


// 5. Send message (POST /conversations/:id/messages)
app.post('/conversations/:id/messages', authorize, (req, res) => {
    const currentUserId = req.currentUser.id;
    const convId = req.params.id;
    const { content } = req.body;

    // Validation & Logic... (โค้ดเดิม)
    if (!content || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ error: 'Message content is required and must not be empty.' }); 
    }

    const conversation = getConversationById(convId);
    if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found.' });
    }
    if (!conversation.participants.includes(currentUserId)) {
        return res.status(403).json({ error: 'Forbidden. You cannot send messages to a conversation you are not in.' }); 
    }

    const newMessage = addMessageToConversation(convId, currentUserId, content);

    res.status(201).json(newMessage);
});


// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Available users: ${users.map(u => u.name).join(', ')} (IDs: ${users.map(u => u.id).join(', ')})`);
    console.log(`Use 'x-user-id' header with the ID after successful login.`);
});