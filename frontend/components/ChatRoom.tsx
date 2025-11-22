import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

interface ParticleStyle {
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
}

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
  const [particleStyles, setParticleStyles] = useState<ParticleStyle[]>([]); 
  const [messageError, setMessageError] = useState<string | null>(null);

  useEffect(() => {
    const styles: ParticleStyle[] = [...Array(15)].map(() => ({ 
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${5 + Math.random() * 10}s`
    }));
    setParticleStyles(styles);
  }, []);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  // Effect สำหรับโหลดครั้งแรก (แสดง Loading)
  useEffect(() => {
      setLoading(true);
      fetchMessages().finally(() => setLoading(false));
  }, [fetchMessages]); // รันเมื่อ conversation เปลี่ยน

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

  // Effect สำหรับ Polling (อัปเดตข้อความ)
  useEffect(() => {
    const interval = setInterval(fetchMessages, 3000); 
    return () => clearInterval(interval);
  }, [fetchMessages]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {particleStyles.map((style, i) => ( 
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30 animate-float"
            style={style}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L2N2Zz4=')] opacity-20"></div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div>
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xl shadow-2xl transform group-hover:scale-110 transition-all duration-300">
                {/* แสดงอักษรตัวแรกของชื่อจาก Prop */}
                {otherParticipantName ? otherParticipantName.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-3 border-slate-900 rounded-full shadow-lg">
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {/* แสดงชื่อเต็มจาก Prop */}
                {otherParticipantName || 'Loading...'}
                <span className="text-xs font-medium text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-full border border-purple-400/30">
                  Online
                </span>
              </h2>
              <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="font-medium text-green-400">Active now</span>
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-500">{messages.length} messages</span>
              </p>
            </div>
          </div>

          <button className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 group border border-white/10">
            <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="relative z-10 flex-1 p-6 overflow-y-auto">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-[fadeIn_0.5s_ease-out]">
              <div className="relative inline-block mb-4">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
              </div>
              <p className="text-gray-300 font-medium">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-[fadeIn_0.5s_ease-out]">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full blur-3xl opacity-40 animate-pulse"></div>
                <div className="relative text-7xl animate-[wave_2s_ease-in-out_infinite]">👋</div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Start the conversation</h3>
              <p className="text-gray-400">Send your first message to {otherParticipantName || 'get started'}</p>
              <div className="mt-6 flex justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, index) => {
              const isCurrentUser = msg.senderId === currentUser.id;
              const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;
              const showTimestamp = index === messages.length - 1 || messages[index + 1].senderId !== msg.senderId;
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex items-end gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} animate-[slideIn_0.4s_ease-out]`}
                >
                  {/* Avatar */}
                  {!isCurrentUser && (
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-xl transition-all duration-200 border border-white/20 ${showAvatar ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
                      {/* ใช้อักษรตัวแรกจากชื่อของผู้สนทนา (หากไม่ใช่ user ปัจจุบัน) */}
                      {otherParticipantName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`group flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
                    <div className="relative">
                      <div className={`absolute inset-0 ${
                        isCurrentUser 
                          ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 blur-md opacity-50' 
                          : 'bg-white/20 blur-md opacity-50'
                      } rounded-3xl group-hover:opacity-75 transition-opacity`}></div>
                      <div 
                        className={`relative px-5 py-3 rounded-3xl shadow-2xl transition-all duration-300 group-hover:scale-[1.02] backdrop-blur-xl border ${
                          isCurrentUser 
                            ? 'bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 text-white border-white/20' 
                            : 'bg-white/10 text-white border-white/20'
                        }`}
                      >
                        <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Timestamp */}
                    {showTimestamp && (
                      <span className={`text-xs mt-2 px-3 py-1 rounded-full backdrop-blur-xl border transition-all duration-200 ${
                        isCurrentUser 
                          ? 'text-purple-300 bg-purple-500/20 border-purple-400/30' 
                          : 'text-gray-400 bg-white/10 border-white/20'
                      }`}>
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    )}
                  </div>

                  {/* Current user avatar placeholder */}
                  {isCurrentUser && <div className="w-10 h-10"></div>}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="relative z-10 p-4 bg-white/5 backdrop-blur-xl border-t border-white/10">
        {/* Message Error Display */}
        {messageError && (
            <div className="relative -mt-3 mb-3 animate-[slideInUp_0.3s_ease-out] mx-auto max-w-5xl">
                <div className="absolute inset-0 bg-red-500 rounded-xl blur opacity-30"></div>
                <div className="relative flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-xl text-red-200 text-sm font-medium">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {messageError}
                    <button type="button" onClick={() => setMessageError(null)} className="ml-auto text-red-400 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>
        )}

        <div className="flex gap-3 items-end max-w-5xl mx-auto">
          {/* Attachment button */}
          <button 
            type="button"
            className="p-3 hover:bg-white/10 rounded-2xl transition-all duration-200 hover:scale-110 active:scale-95 group border border-white/10"
          >
            <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Message input */}
          <div className="flex-1 relative group/input">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl opacity-0 group-focus-within/input:opacity-20 blur transition-opacity"></div>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="relative w-full px-6 py-4 bg-white/10 border-2 border-white/20 rounded-3xl focus:outline-none focus:border-blue-500 focus:bg-white/15 transition-all duration-300 placeholder:text-gray-400 text-white text-sm backdrop-blur-xl"
              disabled={sending}
            />
            {newMessage.length > 50 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 bg-white/10 px-2 py-1 rounded-full backdrop-blur-xl">
                {newMessage.length}
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={sending || newMessage.trim() === ''}
            className={`group relative p-4 rounded-2xl font-medium transition-all duration-300 transform overflow-hidden ${
              newMessage.trim() && !sending
                ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-2xl hover:shadow-3xl hover:scale-110 active:scale-95'
                : 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/10'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            {sending ? (
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="relative">
                <svg className="w-6 h-6 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            )}
          </button>
        </div>
      </form>

      {/* Typing indicator */}
      {sending && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex gap-1 bg-white/10 backdrop-blur-xl px-3 py-1.5 rounded-full shadow-xl border border-white/20">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;