// backend/data.js


let userIdCounter = 4;
let friendRequestIdCounter = 0;
let conversationIdCounter = 100;
let messageIdCounter = 200;

// --- SEED DATA (ข้อมูลผู้ใช้เริ่มต้น) ---
export const users = [
    { id: 'user1', name: 'Alice', password: 'password1' },
    { id: 'user2', name: 'Bob', password: 'password2' },
    { id: 'user3', name: 'Charlie', password: 'password3' },
];

export const conversations = [
    
    {
        id: 'conv1',
        participants: ['user1', 'user2'],
        lastMessage: { content: 'Hey Bob!', timestamp: Date.now() - 60000 },
    }
];

export let messages = [
    { id: 'msg1', conversationId: 'conv1', senderId: 'user1', content: 'Hey Bob!', timestamp: Date.now() - 60000 },
];

export const friendRequests = [];


// --- Utility Functions ---

export const findUserById = (userId) => users.find(u => u.id === userId);
export const findUserByName = (name) => users.find(u => u.name.toLowerCase() === name.toLowerCase());

export const registerUser = (name, password) => {
    if (findUserByName(name)) return { success: false, error: 'Username already exists.' };
    
    // ใช้ userIdCounter เพื่อสร้าง ID ใหม่ที่ไม่ซ้ำกับ Seed Data
    const newUserId = 'user' + (++userIdCounter); 
    const newUser = { id: newUserId, name, password };
    users.push(newUser);
    return { success: true, user: newUser };
};

export const loginUser = (name, password) => {
    const user = findUserByName(name);
    if (!user) return { success: false, error: 'User not found.' };
    if (user.password !== password) return { success: false, error: 'Invalid password.' };
    return { success: true, user };
};

export const findConversationBetween = (userAId, userBId) => {
    return conversations.find(conv =>
        conv.participants.includes(userAId) && 
        conv.participants.includes(userBId) && 
        conv.participants.length === 2
    );
};

export const createConversation = (userAId, userBId) => {
    const newConvId = 'conv' + (++conversationIdCounter);
    const newConversation = {
        id: newConvId,
        participants: [userAId, userBId].sort(),
        lastMessage: null,
    };
    conversations.push(newConversation);
    return newConversation;
};

export const getConversationById = (convId) => conversations.find(c => c.id === convId);

export const getConversationsForUser = (userId) => {
    return conversations
        .filter(conv => conv.participants.includes(userId))
        .sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));
};

export const getMessagesInConversation = (convId) => {
    return messages
        .filter(msg => msg.conversationId === convId)
        .sort((a, b) => a.timestamp - b.timestamp);
};

export const addMessageToConversation = (convId, senderId, content) => {
    const message = {
        id: 'msg' + (++messageIdCounter),
        conversationId: convId,
        senderId: senderId,
        content: content,
        timestamp: Date.now()
    };
    messages.push(message);
    const conversation = getConversationById(convId);
    if (conversation) {
        conversation.lastMessage = { content: content, timestamp: message.timestamp };
    }
    return message;
};

// --- Friend Requests Functions ---

export const createFriendRequest = (fromUserId, toUserId) => {
    // เช็คว่าเคยขอไปแล้วและยัง pending อยู่ไหม
    const existingReq = friendRequests.find(r => 
        r.fromUserId === fromUserId && r.toUserId === toUserId && r.status === 'pending'
    );
    if (existingReq) return { success: false, error: 'Request already sent.' };

    // เช็คว่าเป็นเพื่อนกันหรือยัง (มี conversation แล้ว)
    const existingConv = findConversationBetween(fromUserId, toUserId);
    if (existingConv) return { success: false, error: 'Already friends.' };

    const newReq = {
        id: 'req' + (++friendRequestIdCounter),
        fromUserId,
        toUserId,
        status: 'pending',
        timestamp: Date.now()
    };
    friendRequests.push(newReq);
    return { success: true, request: newReq };
};

export const getPendingRequestsForUser = (userId) => {
    return friendRequests
        .filter(r => r.toUserId === userId && r.status === 'pending')
        .map(r => ({
            ...r,
            fromUser: findUserById(r.fromUserId) 
        }));
};


export const acceptFriendRequest = (requestId) => {
    const req = friendRequests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Request not found' };
    
    req.status = 'accepted';
    
    
    const newConv = createConversation(req.fromUserId, req.toUserId);
    
    return { success: true, conversation: newConv };
};

export const rejectFriendRequest = (requestId) => {
    const req = friendRequests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Request not found' };
    req.status = 'rejected';
    return { success: true };
};