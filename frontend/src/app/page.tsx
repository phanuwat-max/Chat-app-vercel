'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ConversationList from '@/components/ConversationList';
import ChatRoom from '@/components/ChatRoom';
import LoginScreen from '@/components/LoginScreen';

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

interface ParticleStyle {
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
}

export default function Home() {
  const [authUserId, setAuthUserId] = useState<string | null>(null); 
  const [isInitialized, setIsInitialized] = useState(false); 
  
  const [currentUser, setCurrentUser] = useState<User | null>(null); 
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [particlesLoaded, setParticlesLoaded] = useState(false); 
  
  const [particleStyles, setParticleStyles] = useState<ParticleStyle[]>([]); 

  // Helper: ค้นหาข้อมูลบทสนทนาที่เลือก เพื่อดึงชื่อผู้สนทนา
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

  // Effect 1: Load Session & Particle Styles
  useEffect(() => {
    const storedUserId = localStorage.getItem('chatAppUserId');
    if (storedUserId) {
      setAuthUserId(storedUserId);
    }
    
    const styles: ParticleStyle[] = [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${5 + Math.random() * 10}s`
    }));
    setParticleStyles(styles);
    setParticlesLoaded(true);
    
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
          <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
            <p className="text-white">Initializing...</p>
          </div>
      );
  }
  
  if (!authUserId) {
    return <LoginScreen API_BASE_URL={API_BASE_URL} onLoginSuccess={handleLoginSuccess} />;
  }
  
  if (loading || !currentUser || !particlesLoaded) { 
    return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
              <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>
            
            <div className="relative z-10 text-center">
                <div className="relative inline-block mb-6">
                  <div className="relative w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-white font-semibold text-xl mb-2">Loading your workspace...</p>
            </div>
        </div>
    );
  }

  if (error) {
     return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 relative overflow-hidden">
          <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-10 max-w-md mx-4 animate-[slideUp_0.5s_ease-out]">
            <div className="mt-8">
              <h2 className="text-3xl font-bold text-white mb-3 text-center">Oops! Something went wrong</h2>
              <p className="text-gray-300 text-center leading-relaxed mb-6">{error}</p>
              <button 
                onClick={handleLogout}
                className="group relative w-full py-4 bg-gradient-to-r from-red-500 via-orange-500 to-red-600 text-white rounded-2xl font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 overflow-hidden"
              >
                Try Logging In Again
              </button>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-40 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000"></div>
        
        {particleStyles.map((style, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-float"
            style={style} 
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGogZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L2N2Zz4=')] opacity-10"></div>

      <div className="relative z-10 w-96 flex flex-col bg-white/5 backdrop-blur-2xl border-r border-white/10 shadow-2xl">
        <header className="relative border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                      </svg>
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-slate-900 rounded-full">
                      <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                  </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Messages</h1>
                  <div className="flex items-center text-xs text-gray-400 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse"></div>
                    <span className="text-green-400">{currentUser.name}</span>
                  </div>
                </div>
              </div>
              <button onClick={handleLogout} className="group relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 active:scale-95 transition-all duration-200 border border-red-500/30 hover:border-red-500/50 backdrop-blur-xl" title="Logout">
                <svg className="w-5 h-5 text-red-400 group-hover:text-red-300 group-hover:scale-110 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-hidden">
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

      <div className="relative z-10 flex-1 flex flex-col">
        {selectedConversationId && currentUser ? (
          <ChatRoom 
            conversationId={selectedConversationId}
            currentUser={currentUser}
            API_BASE_URL={API_BASE_URL}
            onMessageSent={fetchConversations}
          
            otherParticipantName={selectedConversation?.otherParticipant.name || ''}
          />
        ) : (
          <div className="flex items-center justify-center flex-1 relative">
            <div className="text-center animate-[fadeIn_0.6s_ease-out]">
                <h2 className="text-3xl font-bold text-white mb-4">No Conversation Selected</h2>
                <p className="text-gray-400">Choose a conversation from the list to start chatting.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}