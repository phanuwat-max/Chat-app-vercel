// backend/database.js
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine database path
// In Vercel (production), we must use /tmp for writable access
// In development, we use the local file
const dbPath = process.env.VERCEL || process.env.NODE_ENV === 'production'
  ? '/tmp/chat.db'
  : join(__dirname, 'chat.db');

// Create/Connect database
const db = new Database(dbPath, { verbose: console.log });
console.log(`Connected to SQLite database at ${dbPath}`);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize tables
const initDatabase = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    )
  `);

  // Conversations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      last_message_content TEXT,
      last_message_timestamp INTEGER
    )
  `);

  // Conversation participants (many-to-many relationship)
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversation_participants (
      conversation_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (conversation_id, user_id),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Friend requests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS friend_requests (
      id TEXT PRIMARY KEY,
      from_user_id TEXT NOT NULL,
      to_user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
    CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user ON friend_requests(to_user_id);
    CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
  `);

  console.log('✅ Database initialized successfully');
};

// Seed initial data if database is empty
const seedDatabase = () => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();

    if (userCount.count === 0) {
      console.log('📦 Seeding initial data...');

      // Insert seed users
      const insertUser = db.prepare('INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)');
      insertUser.run('user1', 'Alice', 'alice@example.com', 'password1');
      insertUser.run('user2', 'Bob', 'bob@example.com', 'password2');
      insertUser.run('user3', 'Charlie', 'charlie@example.com', 'password3');

      // Create a conversation between Alice and Bob
      const insertConv = db.prepare('INSERT INTO conversations (id, last_message_content, last_message_timestamp) VALUES (?, ?, ?)');
      const timestamp = Date.now() - 60000;
      insertConv.run('conv1', 'Hey Bob!', timestamp);

      // Add participants
      const insertParticipant = db.prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)');
      insertParticipant.run('conv1', 'user1');
      insertParticipant.run('conv1', 'user2');

      // Add initial message
      const insertMessage = db.prepare('INSERT INTO messages (id, conversation_id, sender_id, content, timestamp) VALUES (?, ?, ?, ?, ?)');
      insertMessage.run('msg1', 'conv1', 'user1', 'Hey Bob!', timestamp);

      console.log('✅ Seed data inserted');
    }
  } catch (err) {
    console.error('Seed error (ignoring):', err);
  }
};

// Initialize database on module load
initDatabase();
seedDatabase();

export default db;
