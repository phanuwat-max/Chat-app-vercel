// data.js

// ตัวนับ ID เพื่อจำลองการสร้าง ID ใหม่
let conversationIdCounter = 100;
let messageIdCounter = 200;
let userIdCounter = 4; // เริ่มจาก 4 เนื่องจาก user1, user2, user3 ถูกใช้ไปแล้ว

/**
 * ฐานข้อมูล In-memory
 */
export const users = [
  // เพิ่ม field 'password'
  { id: 'user1', name: 'Alice', password: 'password1' }, 
  { id: 'user2', name: 'Bob', password: 'password2' },
  { id: 'user3', name: 'Charlie', password: 'password3' },
];

// โครงสร้าง Conversation: { id, participants, lastMessage: { content, timestamp } }
export const conversations = [
    // Pre-seed conversation 1: Alice (user1) and Bob (user2)
    {
        id: 'conv1',
        participants: ['user1', 'user2'],
        lastMessage: { content: 'Hey Bob!', timestamp: Date.now() - 60000 },
    },
    // Pre-seed conversation 2: Alice (user1) and Charlie (user3)
    {
        id: 'conv2',
        participants: ['user1', 'user3'],
        lastMessage: { content: 'Hi Charlie, long time no chat.', timestamp: Date.now() - 120000 },
    }
];

// โครงสร้าง Message: { id, conversationId, senderId, content, timestamp }
export let messages = [
    { id: 'msg1', conversationId: 'conv1', senderId: 'user1', content: 'Hey Bob!', timestamp: Date.now() - 60000 },
    { id: 'msg2', conversationId: 'conv2', senderId: 'user1', content: 'Hi Charlie, long time no chat.', timestamp: Date.now() - 120000 },
];


/**
 * Utility functions สำหรับการจัดการข้อมูล
 */

export const findUserById = (userId) => users.find(u => u.id === userId);
export const findUserByName = (name) => users.find(u => u.name.toLowerCase() === name.toLowerCase());

// Logic สำหรับ Register
export const registerUser = (name, password) => {
    if (findUserByName(name)) {
        return { success: false, error: 'Username already exists.' };
    }
    const newUserId = 'user' + userIdCounter++;
    const newUser = {
        id: newUserId,
        name: name,
        password: password // ในโลกจริง ต้อง HASH รหัสผ่าน
    };
    users.push(newUser);
    return { success: true, user: newUser };
};

// Logic สำหรับ Login
export const loginUser = (name, password) => {
    const user = findUserByName(name);
    if (!user) {
        return { success: false, error: 'User not found.' };
    }
    // ตรวจสอบรหัสผ่าน (ในโลกจริง ต้องเปรียบเทียบ HASH)
    if (user.password !== password) {
        return { success: false, error: 'Invalid password.' };
    }
    return { success: true, user: user };
};


// ค้นหาการสนทนาที่มีอยู่ระหว่างผู้ใช้สองคน
export const findConversationBetween = (userAId, userBId) => {
    return conversations.find(conv =>
        conv.participants.includes(userAId) && 
        conv.participants.includes(userBId) && 
        conv.participants.length === 2
    );
};

// สร้างการสนทนาใหม่
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

// ดึงการสนทนาตาม ID
export const getConversationById = (convId) => conversations.find(c => c.id === convId);

// ดึงรายการการสนทนาทั้งหมดของผู้ใช้ (พร้อมการเรียงลำดับ)
export const getConversationsForUser = (userId) => {
    return conversations
        .filter(conv => conv.participants.includes(userId))
        .sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));
};

// ดึงข้อความทั้งหมดในการสนทนาที่ระบุ
export const getMessagesInConversation = (convId) => {
    return messages
        .filter(msg => msg.conversationId === convId)
        .sort((a, b) => a.timestamp - b.timestamp);
};

// เพิ่มข้อความใหม่
export const addMessageToConversation = (convId, senderId, content) => {
    const message = {
        id: 'msg' + (++messageIdCounter),
        conversationId: convId,
        senderId: senderId,
        content: content,
        timestamp: Date.now()
    };
    messages.push(message);

    // อัปเดตข้อมูล lastMessage ใน Conversation
    const conversation = getConversationById(convId);
    if (conversation) {
        conversation.lastMessage = { content: content, timestamp: message.timestamp };
    }

    return message;
};