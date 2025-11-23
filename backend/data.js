// backend/data.js
import db from './database.js';

// --- Counter Management ---
let userIdCounter = 4;
let friendRequestIdCounter = 0;
let conversationIdCounter = 100;
let messageIdCounter = 200;

// Initialize counters from database
const initCounters = () => {
    // Get max user ID
    const maxUser = db.prepare("SELECT id FROM users ORDER BY id DESC LIMIT 1").get();
    if (maxUser) {
        const match = maxUser.id.match(/\d+$/);
        if (match) userIdCounter = parseInt(match[0]);
    }

    // Get max conversation ID
    const maxConv = db.prepare("SELECT id FROM conversations ORDER BY id DESC LIMIT 1").get();
    if (maxConv) {
        const match = maxConv.id.match(/\d+$/);
        if (match) conversationIdCounter = parseInt(match[0]);
    }

    // Get max message ID
    const maxMsg = db.prepare("SELECT id FROM messages ORDER BY id DESC LIMIT 1").get();
    if (maxMsg) {
        const match = maxMsg.id.match(/\d+$/);
        if (match) messageIdCounter = parseInt(match[0]);
    }

    // Get max friend request ID
    const maxReq = db.prepare("SELECT id FROM friend_requests ORDER BY id DESC LIMIT 1").get();
    if (maxReq) {
        const match = maxReq.id.match(/\d+$/);
        if (match) friendRequestIdCounter = parseInt(match[0]);
    }
};

initCounters();

// --- Utility Functions ---

export const findUserById = (userId) => {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
};

export const findUserByName = (name) => {
    return db.prepare('SELECT * FROM users WHERE LOWER(name) = LOWER(?)').get(name);
};

export const findUserByEmail = (email) => {
    return db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
};

export const registerUser = (name, password, email = null) => {
    if (findUserByName(name)) {
        return { success: false, error: 'Username already exists.' };
    }

    if (email && findUserByEmail(email)) {
        return { success: false, error: 'Email already exists.' };
    }

    const newUserId = 'user' + (++userIdCounter);

    try {
        const stmt = db.prepare('INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)');
        stmt.run(newUserId, name, email, password);

        const newUser = findUserById(newUserId);
        return { success: true, user: newUser };
    } catch (error) {
        console.error('Error registering user:', error);
        return { success: false, error: 'Failed to register user.' };
    }
};

export const loginUser = (name, password) => {
    const user = findUserByName(name);
    if (!user) return { success: false, error: 'User not found.' };
    if (user.password !== password) return { success: false, error: 'Invalid password.' };
    return { success: true, user };
};

export const findConversationBetween = (userAId, userBId) => {
    const query = `
    SELECT c.* FROM conversations c
    INNER JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
    INNER JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
    WHERE cp1.user_id = ? AND cp2.user_id = ?
    AND (
      SELECT COUNT(*) FROM conversation_participants 
      WHERE conversation_id = c.id
    ) = 2
  `;
    return db.prepare(query).get(userAId, userBId);
};

export const createConversation = (userAId, userBId) => {
    const newConvId = 'conv' + (++conversationIdCounter);

    const insertConv = db.prepare('INSERT INTO conversations (id) VALUES (?)');
    const insertParticipant = db.prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)');

    const transaction = db.transaction(() => {
        insertConv.run(newConvId);
        insertParticipant.run(newConvId, userAId);
        insertParticipant.run(newConvId, userBId);
    });

    transaction();

    return db.prepare('SELECT * FROM conversations WHERE id = ?').get(newConvId);
};

export const getConversationById = (convId) => {
    return db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId);
};

export const getConversationsForUser = (userId) => {
    const query = `
    SELECT c.* FROM conversations c
    INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
    WHERE cp.user_id = ?
    ORDER BY c.last_message_timestamp DESC NULLS LAST
  `;
    return db.prepare(query).all(userId);
};

export const getMessagesInConversation = (convId) => {
    const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC').all(convId);

    // Convert snake_case to camelCase
    return messages.map(msg => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.content,
        timestamp: msg.timestamp
    }));
};

export const addMessageToConversation = (convId, senderId, content) => {
    const messageId = 'msg' + (++messageIdCounter);
    const timestamp = Date.now();

    const insertMessage = db.prepare('INSERT INTO messages (id, conversation_id, sender_id, content, timestamp) VALUES (?, ?, ?, ?, ?)');
    const updateConv = db.prepare('UPDATE conversations SET last_message_content = ?, last_message_timestamp = ? WHERE id = ?');

    const transaction = db.transaction(() => {
        insertMessage.run(messageId, convId, senderId, content, timestamp);
        updateConv.run(content, timestamp, convId);
    });

    transaction();

    const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);

    // Convert snake_case to camelCase
    return {
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.content,
        timestamp: msg.timestamp
    };
};

// --- Friend Requests Functions ---

export const createFriendRequest = (fromUserId, toUserId) => {
    // Check if request already exists
    const existingReq = db.prepare(
        'SELECT * FROM friend_requests WHERE from_user_id = ? AND to_user_id = ? AND status = ?'
    ).get(fromUserId, toUserId, 'pending');

    if (existingReq) {
        return { success: false, error: 'Request already sent.' };
    }

    // Check if already friends
    const existingConv = findConversationBetween(fromUserId, toUserId);
    if (existingConv) {
        return { success: false, error: 'Already friends.' };
    }

    const newReqId = 'req' + (++friendRequestIdCounter);
    const timestamp = Date.now();

    try {
        const stmt = db.prepare('INSERT INTO friend_requests (id, from_user_id, to_user_id, status, timestamp) VALUES (?, ?, ?, ?, ?)');
        stmt.run(newReqId, fromUserId, toUserId, 'pending', timestamp);

        const newReq = db.prepare('SELECT * FROM friend_requests WHERE id = ?').get(newReqId);
        return { success: true, request: newReq };
    } catch (error) {
        console.error('Error creating friend request:', error);
        return { success: false, error: 'Failed to create friend request.' };
    }
};

export const getPendingRequestsForUser = (userId) => {
    const requests = db.prepare(
        'SELECT * FROM friend_requests WHERE to_user_id = ? AND status = ? ORDER BY timestamp DESC'
    ).all(userId, 'pending');

    return requests.map(r => ({
        ...r,
        fromUser: findUserById(r.from_user_id)
    }));
};

export const acceptFriendRequest = (requestId) => {
    const req = db.prepare('SELECT * FROM friend_requests WHERE id = ?').get(requestId);
    if (!req) return { success: false, error: 'Request not found' };

    // Check for existing conversation
    const existingConv = findConversationBetween(req.from_user_id, req.to_user_id);

    const updateReq = db.prepare('UPDATE friend_requests SET status = ? WHERE id = ?');
    updateReq.run('accepted', requestId);

    if (existingConv) {
        return { success: true, conversation: existingConv };
    }

    const newConv = createConversation(req.from_user_id, req.to_user_id);
    return { success: true, conversation: newConv };
};

export const rejectFriendRequest = (requestId) => {
    const req = db.prepare('SELECT * FROM friend_requests WHERE id = ?').get(requestId);
    if (!req) return { success: false, error: 'Request not found' };

    const stmt = db.prepare('UPDATE friend_requests SET status = ? WHERE id = ?');
    stmt.run('rejected', requestId);

    return { success: true };
};

// Export db for direct access if needed
export { db };