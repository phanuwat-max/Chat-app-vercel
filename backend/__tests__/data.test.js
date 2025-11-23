// backend/__tests__/data.test.js
import {
    registerUser,
    loginUser,
    findUserByName,
    createConversation,
    findConversationBetween,
    addMessageToConversation,
    getMessagesInConversation,
    createFriendRequest,
    acceptFriendRequest,
    db
} from '../data.js';

// Helper to clean up test data
const cleanupTestData = () => {
    try {
        // Delete all data to ensure clean state for each test block
        // Order matters due to foreign keys
        db.exec('DELETE FROM messages');
        db.exec('DELETE FROM conversation_participants');
        db.exec('DELETE FROM friend_requests');
        db.exec('DELETE FROM conversations');
        db.exec('DELETE FROM users');
    } catch (error) {
        console.error('Cleanup error:', error);
    }
};

describe('User Management', () => {
    beforeAll(() => {
        cleanupTestData();
    });

    afterAll(() => {
        cleanupTestData();
    });

    test('should register a new user successfully', () => {
        const result = registerUser('TestUser1', 'password123', 'test1@example.com');

        expect(result.success).toBe(true);
        expect(result.user).toBeDefined();
        expect(result.user.name).toBe('TestUser1');
        expect(result.user.email).toBe('test1@example.com');
    });

    test('should not register duplicate username', () => {
        registerUser('TestUser2', 'password123');
        const result = registerUser('TestUser2', 'password456');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Username already exists.');
    });

    test('should not register duplicate email', () => {
        registerUser('TestUser3', 'password123', 'duplicate@example.com');
        const result = registerUser('TestUser4', 'password456', 'duplicate@example.com');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Email already exists.');
    });

    test('should login with correct credentials', () => {
        registerUser('TestUser5', 'password123');
        const result = loginUser('TestUser5', 'password123');

        expect(result.success).toBe(true);
        expect(result.user).toBeDefined();
        expect(result.user.name).toBe('TestUser5');
    });

    test('should not login with incorrect password', () => {
        registerUser('TestUser6', 'password123');
        const result = loginUser('TestUser6', 'wrongpassword');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid password.');
    });

    test('should not login with non-existent user', () => {
        const result = loginUser('NonExistentUser', 'password123');

        expect(result.success).toBe(false);
        expect(result.error).toBe('User not found.');
    });
});

describe('Conversation Management', () => {
    let user1, user2;

    beforeAll(() => {
        cleanupTestData();
        // Create test users
        user1 = registerUser('ConvTestUser1', 'pass1').user;
        user2 = registerUser('ConvTestUser2', 'pass2').user;
    });

    afterAll(() => {
        cleanupTestData();
    });

    test('should create a conversation between two users', () => {
        const conv = createConversation(user1.id, user2.id);

        expect(conv).toBeDefined();
        expect(conv.id).toBeDefined();
    });

    test('should find existing conversation between users', () => {
        const found = findConversationBetween(user1.id, user2.id);

        expect(found).toBeDefined();
        expect(found.id).toBeDefined();
    });

    test('should add message to conversation', () => {
        const conv = findConversationBetween(user1.id, user2.id);
        const message = addMessageToConversation(conv.id, user1.id, 'Hello!');

        expect(message).toBeDefined();
        expect(message.content).toBe('Hello!');
        expect(message.senderId).toBe(user1.id);
        expect(message.conversationId).toBe(conv.id);
    });

    test('should retrieve messages in correct order', () => {
        const conv = findConversationBetween(user1.id, user2.id);
        addMessageToConversation(conv.id, user1.id, 'First message');
        addMessageToConversation(conv.id, user2.id, 'Second message');
        addMessageToConversation(conv.id, user1.id, 'Third message');

        const messages = getMessagesInConversation(conv.id);

        expect(messages.length).toBeGreaterThanOrEqual(3);
        // Check last 3 messages
        const lastThree = messages.slice(-3);
        expect(lastThree[0].content).toBe('First message');
        expect(lastThree[1].content).toBe('Second message');
        expect(lastThree[2].content).toBe('Third message');
    });

    test('should convert message fields to camelCase', () => {
        const conv = findConversationBetween(user1.id, user2.id);
        const message = addMessageToConversation(conv.id, user1.id, 'Test camelCase');

        // Check that fields are in camelCase
        expect(message.senderId).toBeDefined();
        expect(message.conversationId).toBeDefined();
        expect(message.sender_id).toBeUndefined(); // snake_case should not exist
        expect(message.conversation_id).toBeUndefined();
    });
});

describe('Friend Request Management', () => {
    let user1, user2, user3, user4;

    beforeAll(() => {
        cleanupTestData();
        // Create test users
        user1 = registerUser('FriendTestUser1', 'pass1').user;
        user2 = registerUser('FriendTestUser2', 'pass2').user;
        user3 = registerUser('FriendTestUser3', 'pass3').user;
        user4 = registerUser('FriendTestUser4', 'pass4').user;
    });

    afterAll(() => {
        cleanupTestData();
    });

    test('should create a friend request', () => {
        const result = createFriendRequest(user1.id, user2.id);

        expect(result.success).toBe(true);
        expect(result.request).toBeDefined();
        expect(result.request.from_user_id).toBe(user1.id);
        expect(result.request.to_user_id).toBe(user2.id);
    });

    test('should not create duplicate friend request', () => {
        const result = createFriendRequest(user1.id, user2.id);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Request already sent.');
    });

    test('should accept friend request and create conversation', () => {
        const reqResult = createFriendRequest(user3.id, user4.id);
        const acceptResult = acceptFriendRequest(reqResult.request.id);

        expect(acceptResult.success).toBe(true);
        expect(acceptResult.conversation).toBeDefined();

        // Verify conversation exists
        const conv = findConversationBetween(user3.id, user4.id);
        expect(conv).toBeDefined();
    });

    test('should not create friend request if already friends', () => {
        // Try to send another request between user3 and user4 who are now friends
        const result = createFriendRequest(user3.id, user4.id);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Already friends.');
    });
});

describe('Database Integration', () => {
    test('should have database connection', () => {
        expect(db).toBeDefined();
    });

    test('should execute simple query', () => {
        const result = db.prepare('SELECT 1 as value').get();
        expect(result.value).toBe(1);
    });
});
