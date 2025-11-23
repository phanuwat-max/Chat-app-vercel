'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ConversationList from '@/components/ConversationList';
import ChatRoom from '@/components/ChatRoom';
import LoginScreen from '@/components/LoginScreen';
import styles from './Page.module.css';

const API_BASE_URL = 'http://localhost:3001';

interface User {
  id: string;
  name: string;
}

interface ConversationInfo {
  id: string;
  otherParticipant: User;
  lastMessageText: string | null;
  lastMessageTimestamp: number | null;
}

export default function Home() {
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper: Find selected conversation info
  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const handleLoginSuccess = (userId: string, userName: string) => {
    localStorage.setItem('chatAppUserId', userId);
    setAuthUserId(userId);
    setCurrentUser({ id: userId, name: userName });
    setError(null);
  }

  const handleLogout = useCallback(() => {
    localStorage.removeItem('chatAppUserId');
    setAuthUserId(null);
    setCurrentUser(null);
    setConversations([]);
    setSelectedConversationId(null);
    setError(null);
    setIsInitialized(true);
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!currentUser || !currentUser.id) return;
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/conversations`, {
        headers: { 'x-user-id': currentUser.id },
      });
      setConversations(response.data);
      if (response.data.length > 0 && !selectedConversationId) {
        setSelectedConversationId(response.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        handleLogout();
        return;
      }
      setError('Failed to load conversations. Check Backend connection and authorization.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, selectedConversationId, handleLogout]);

  // Effect 1: Load Session
  useEffect(() => {
    const storedUserId = localStorage.getItem('chatAppUserId');
    if (storedUserId) {
      setAuthUserId(storedUserId);
    }
    setIsInitialized(true);
  }, []);

  // Effect 2: Load User Info (Auto-Login on Refresh)
  useEffect(() => {
    if (isInitialized && authUserId && !currentUser) {
      setLoading(true);

      axios.get(`${API_BASE_URL}/users/me`, {
        headers: { 'x-user-id': authUserId },
      })
        .then(response => {
          setCurrentUser(response.data);
        })
        .catch(err => {
          console.error('Error auto-logging in:', err);
          handleLogout();
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [authUserId, currentUser, isInitialized, handleLogout]);

  // Effect 3: Load Conversations
  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser, fetchConversations]);

  if (!isInitialized) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>INITIALIZING...</p>
        </div>
      </div>
    );
  }

  if (!authUserId) {
    return <LoginScreen API_BASE_URL={API_BASE_URL} onLoginSuccess={handleLoginSuccess} />;
  }

  if (loading || !currentUser) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>LOADING WORKSPACE...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorScreen}>
        <div className={styles.errorCard}>
          <h2 className={styles.errorTitle}>SYSTEM ERROR</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={handleLogout} className={styles.retryBtn}>
            RETRY LOGIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <header className={styles.sidebarHeader}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userName}>
              <h1>MESSAGES</h1>
              <span className={styles.userStatus}>
                <span className={styles.statusDot}></span>
                {currentUser.name}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </header>

        <div className={styles.sidebarContent}>
          <ConversationList
            currentUser={currentUser}
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            setSelectedConversationId={setSelectedConversationId}
            fetchConversations={fetchConversations}
            API_BASE_URL={API_BASE_URL}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {selectedConversationId && currentUser ? (
          <ChatRoom
            conversationId={selectedConversationId}
            currentUser={currentUser}
            API_BASE_URL={API_BASE_URL}
            onMessageSent={fetchConversations}
            otherParticipantName={selectedConversation?.otherParticipant.name || ''}
          />
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyContent}>
              <span className={styles.emptyIcon}>💬</span>
              <h2 className={styles.emptyTitle}>NO CHAT SELECTED</h2>
              <p className={styles.emptyText}>SELECT A CONVERSATION FROM THE LIST TO START CHATTING.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}