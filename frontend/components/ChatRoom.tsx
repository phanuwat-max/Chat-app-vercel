import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import styles from './ChatRoom.module.css';

interface User {
  id: string;
  name: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: number;
}

interface ChatRoomProps {
  conversationId: string;
  currentUser: User;
  API_BASE_URL: string;
  onMessageSent: () => void;
  otherParticipantName: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({
  conversationId,
  currentUser,
  API_BASE_URL,
  onMessageSent,
  otherParticipantName
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageError, setMessageError] = useState<string | null>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // Effect: Scroll on new messages (conditional)
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const isCurrentUser = lastMessage.senderId === currentUser.id;

    if (isCurrentUser) {
      scrollToBottom();
    }
  }, [messages, currentUser.id]);

  // Effect: Initial scroll
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(false); // Instant scroll on load
    }
  }, [conversationId]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'JUST NOW';
    if (minutes < 60) return `${minutes}M AGO`;
    if (hours < 24) return `${hours}H AGO`;
    if (days < 7) return `${days}D AGO`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  const fetchMessages = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
        headers: { 'x-user-id': currentUser.id },
      });
      setMessages(response.data);

    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      // setLoading(false);
    }
  }, [API_BASE_URL, conversationId, currentUser.id]);

  // Effect for initial load
  useEffect(() => {
    setLoading(true);
    fetchMessages().finally(() => setLoading(false));
  }, [fetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || sending) return;

    setMessageError(null);

    try {
      setSending(true);
      await axios.post(
        `${API_BASE_URL}/conversations/${conversationId}/messages`,
        { content: newMessage },
        { headers: { 'x-user-id': currentUser.id } }
      );

      setNewMessage('');
      fetchMessages();
      onMessageSent();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Effect for Polling
  useEffect(() => {
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  return (
    <div className={styles.chatContainer}>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.avatar}>
            {otherParticipantName ? otherParticipantName.charAt(0).toUpperCase() : '?'}
          </div>
          <div className={styles.headerText}>
            <h2>
              {otherParticipantName || 'LOADING...'}
              <span className={styles.statusBadge}>ONLINE</span>
            </h2>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button title="Options">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className={styles.messageList}>
        {loading && messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>⏳</div>
            <p>LOADING MESSAGES...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👋</div>
            <h3>START THE CONVERSATION</h3>
            <p>SAY HELLO TO {otherParticipantName?.toUpperCase() || 'FRIEND'}</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isCurrentUser = msg.senderId === currentUser.id;
              const showTimestamp = index === messages.length - 1 || messages[index + 1].senderId !== msg.senderId;

              return (
                <div
                  key={msg.id}
                  className={`${styles.messageRow} ${isCurrentUser ? styles.own : ''}`}
                >
                  {/* Avatar for friend */}
                  {!isCurrentUser && (
                    <div className={styles.messageAvatar}>
                      {otherParticipantName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div>
                    <div className={styles.messageBubble}>
                      {msg.content}
                    </div>
                    {/* Timestamp */}
                    {showTimestamp && (
                      <span className={styles.timestamp}>
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className={styles.inputArea}>
        {/* Message Error Display */}
        {messageError && (
          <div className={styles.errorBanner}>
            <span>⚠️ {messageError.toUpperCase()}</span>
            <button type="button" onClick={() => setMessageError(null)} className={styles.closeError}>X</button>
          </div>
        )}

        <div className={styles.inputForm}>
          {/* Attachment button */}
          <button type="button" className={styles.attachBtn}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Message input */}
          <div className={styles.inputWrapper}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="TYPE YOUR MESSAGE..."
              className={styles.messageInput}
              disabled={sending}
            />
            {newMessage.length > 50 && (
              <span className={styles.charCount}>
                {newMessage.length}
              </span>
            )}
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={sending || newMessage.trim() === ''}
            className={styles.sendBtn}
          >
            {sending ? '...' : 'SEND'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatRoom;