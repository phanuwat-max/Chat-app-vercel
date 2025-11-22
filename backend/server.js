import express from 'express';
import cors from 'cors';
import { 
    users, 
    findUserById, 
    findUserByName,
    findConversationBetween, 
    createConversation, 
    getConversationsForUser,
    getConversationById,
    addMessageToConversation,
    getMessagesInConversation,
    registerUser,
    loginUser,
    createFriendRequest,
    getPendingRequestsForUser,
    acceptFriendRequest,
    rejectFriendRequest
} from './data.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors()); 
app.use(express.json()); 

const getCurrentUser = (req, res, next) => {
    const currentUserId = req.headers['x-user-id']; 
    req.currentUser = currentUserId ? findUserById(currentUserId) : null;
    next();
};

app.use(getCurrentUser);

const authorize = (req, res, next) => {
    if (!req.currentUser) {
        return res.status(401).json({ error: 'Unauthorized. Please login.' });
    }
    next();
};

// --- AUTH Endpoints ---

app.post('/register', (req, res) => {
    const { name, password } = req.body;
    if (!name || !password) return res.status(400).json({ error: 'Missing fields' });
    
    const result = registerUser(name, password);
    if (!result.success) return res.status(409).json({ error: result.error });
    
    res.status(201).json({ userId: result.user.id, userName: result.user.name });
});

app.post('/login', (req, res) => {
    const { name, password } = req.body;
    if (!name || !password) return res.status(400).json({ error: 'Missing fields' });

    const result = loginUser(name, password);
    if (!result.success) return res.status(401).json({ error: result.error });
    
    res.status(200).json({ userId: result.user.id, userName: result.user.name });
});

app.get('/', (req, res) => res.json({ status: 'API Running', port: PORT }));
app.get('/users/me', authorize, (req, res) => res.json(req.currentUser));


// --- FRIEND REQUESTS API ---

// 1. ส่งคำขอเป็นเพื่อน (Add Friend)
app.post('/friends/request', authorize, (req, res) => {
    const currentUserId = req.currentUser.id;
    const { targetUsername } = req.body;

    if (!targetUsername) return res.status(400).json({ error: 'Target username required.' });

    const targetUser = findUserByName(targetUsername);
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });
    if (targetUser.id === currentUserId) return res.status(400).json({ error: 'Cannot add yourself.' });

    const result = createFriendRequest(currentUserId, targetUser.id);
    if (!result.success) return res.status(400).json({ error: result.error });

    res.status(201).json({ message: 'Friend request sent successfully.' });
});

// 2. ดูคำขอที่รออยู่ (Inbox)
app.get('/friends/requests', authorize, (req, res) => {
    const requests = getPendingRequestsForUser(req.currentUser.id);
    res.json(requests);
});

// 3. รับแอดเพื่อน (Accept)
app.post('/friends/requests/:id/accept', authorize, (req, res) => {
    const result = acceptFriendRequest(req.params.id);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: 'Friend request accepted.', conversation: result.conversation });
});

// 4. ปฏิเสธแอดเพื่อน (Reject)
app.post('/friends/requests/:id/reject', authorize, (req, res) => {
    const result = rejectFriendRequest(req.params.id);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ message: 'Friend request rejected.' });
});


// --- CONVERSATION API ---

app.get('/conversations', authorize, (req, res) => {
    const userConversations = getConversationsForUser(req.currentUser.id); 
    const formattedConversations = userConversations.map(conv => {
        const otherParticipantId = conv.participants.find(id => id !== req.currentUser.id);
        const otherParticipant = findUserById(otherParticipantId);
        return {
            id: conv.id,
            otherParticipant: { id: otherParticipant?.id, name: otherParticipant?.name },
            lastMessageText: conv.lastMessage?.content || null, 
            lastMessageTimestamp: conv.lastMessage?.timestamp || null, 
        };
    });
    res.json(formattedConversations);
});

app.get('/conversations/:id/messages', authorize, (req, res) => {
    const conversation = getConversationById(req.params.id);
    if (!conversation || !conversation.participants.includes(req.currentUser.id)) {
        return res.status(403).json({ error: 'Access denied.' });
    }
    res.json(getMessagesInConversation(req.params.id));
});

app.post('/conversations/:id/messages', authorize, (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required.' });
    const conversation = getConversationById(req.params.id);
    if (!conversation || !conversation.participants.includes(req.currentUser.id)) {
        return res.status(403).json({ error: 'Access denied.' });
    }
    const newMessage = addMessageToConversation(req.params.id, req.currentUser.id, content);
    res.status(201).json(newMessage);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});