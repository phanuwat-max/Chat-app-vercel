import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';


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

interface FriendRequest {
  id: string;
  fromUser: User;
  timestamp: number;
}

interface ConversationListProps {
  currentUser: User | null;
  conversations: ConversationInfo[];
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string) => void;
  fetchConversations: () => void; 
  API_BASE_URL: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  currentUser,
  conversations,
  selectedConversationId,
  setSelectedConversationId,
  fetchConversations, 
  API_BASE_URL
}) => {
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  
  const [friendUsername, setFriendUsername] = useState('');
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  

  // Fetch Inbox (Friend Requests)
  const fetchRequests = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/friends/requests`, {
        headers: { 'x-user-id': currentUser.id }
      });
      setFriendRequests(res.data);
    } catch (err) {
      console.error('Error fetching requests:', err);
    }
  }, [currentUser, API_BASE_URL]);

  useEffect(() => {
    if (currentUser) {
      fetchRequests();
      const interval = setInterval(fetchRequests, 5000); 
      return () => clearInterval(interval);
    }
  }, [currentUser, fetchRequests]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendUsername.trim()) return;
    
    setIsAdding(true);
    setAddError(null);
    setAddSuccess(null);

    try {
      await axios.post(`${API_BASE_URL}/friends/request`, 
        { targetUsername: friendUsername },
        { headers: { 'x-user-id': currentUser?.id } }
      );
      setAddSuccess(`Friend request sent to ${friendUsername}!`);
      setFriendUsername('');
      setTimeout(() => {
          setShowAddFriendModal(false);
          setAddSuccess(null);
      }, 1500);
    } catch (err: any) {
      setAddError(err.response?.data?.error || 'Failed to send request.');
    } finally {
      setIsAdding(false);
    }
  };

  
  const handleAccept = async (requestId: string) => {
    try {
      await axios.post(`${API_BASE_URL}/friends/requests/${requestId}/accept`, {}, {
        headers: { 'x-user-id': currentUser?.id }
      });
      
     
      fetchRequests(); 
      
      
      fetchConversations(); 
      
      

    } catch (err) {
      console.error('Error accepting request:', err);
    }
  };
  

  const handleReject = async (requestId: string) => {
    try {
      await axios.post(`${API_BASE_URL}/friends/requests/${requestId}/reject`, {}, {
        headers: { 'x-user-id': currentUser?.id }
      });
      fetchRequests();
    } catch (err) {
      console.error('Error rejecting request:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/5">
      {/* Toolbar */}
      <div className="p-4 space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full bg-white/10 text-white pl-10 pr-4 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-blue-500/50 focus:bg-white/20 transition-all placeholder:text-gray-500"
          />
        </div>

        <div className="flex gap-2">
            {/* Add Friend Button */}
            <button 
                onClick={() => setShowAddFriendModal(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg transition-all active:scale-95"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Add Friend
            </button>

            {/* Inbox Button */}
            <button 
                onClick={() => setShowInbox(!showInbox)}
                className={`relative p-3 rounded-xl transition-all border ${showInbox ? 'bg-white/20 border-white/30' : 'bg-white/10 hover:bg-white/20 border-white/10'}`}
            >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                {friendRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-bounce">
                        {friendRequests.length}
                    </span>
                )}
            </button>
        </div>
      </div>

      {/* Inbox Panel */}
      {showInbox && (
          <div className="mx-4 mb-4 bg-gray-800/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease-out] relative z-20">
              <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                  <span className="text-sm font-bold text-white">Friend Requests</span>
                  <button onClick={() => setShowInbox(false)} className="text-gray-400 hover:text-white"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                  {friendRequests.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 text-sm">No pending requests</div>
                  ) : (
                      friendRequests.map(req => (
                          <div key={req.id} className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                      {req.fromUser?.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="truncate">
                                      <p className="text-sm text-white font-medium truncate">{req.fromUser?.name}</p>
                                      <p className="text-xs text-gray-400">wants to be friends</p>
                                  </div>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={() => handleAccept(req.id)} className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition-all" title="Accept">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  </button>
                                  <button onClick={() => handleReject(req.id)} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all" title="Reject">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-sm bg-[#1a1f2e] border border-white/10 rounded-3xl shadow-2xl p-6 scale-100 animate-[scaleIn_0.2s_ease-out]">
            <h3 className="text-xl font-bold text-white mb-4">Add Friend</h3>
            
            {addSuccess ? (
                <div className="bg-green-500/20 text-green-400 p-3 rounded-xl text-center text-sm mb-4 border border-green-500/30">
                    {addSuccess}
                </div>
            ) : (
                <form onSubmit={handleAddFriend}>
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Username</label>
                        <input
                        type="text"
                        value={friendUsername}
                        onChange={(e) => setFriendUsername(e.target.value)}
                        placeholder="Enter username (e.g. Charlie)"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all placeholder:text-gray-600"
                        autoFocus
                        />
                    </div>
                    {addError && (
                        <p className="text-red-400 text-xs mb-4 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{addError}</p>
                    )}
                    <div className="flex gap-3">
                        <button
                        type="button"
                        onClick={() => { setShowAddFriendModal(false); setAddError(null); setFriendUsername(''); }}
                        className="flex-1 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium"
                        >
                        Cancel
                        </button>
                        <button
                        type="submit"
                        disabled={isAdding}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50"
                        >
                        {isAdding ? 'Sending...' : 'Send Request'}
                        </button>
                    </div>
                </form>
            )}
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto space-y-1 p-2">
        {conversations.length === 0 ? (
            <div className="text-center text-gray-500 mt-10 px-4">
                <p className="mb-2">No friends yet.</p>
                <p className="text-xs">Click "Add Friend" to start chatting!</p>
            </div>
        ) : (
            conversations.map((conv) => (
            <button
                key={conv.id}
                onClick={() => setSelectedConversationId(conv.id)}
                className={`w-full p-3 rounded-2xl flex items-center gap-4 transition-all duration-200 group ${
                selectedConversationId === conv.id
                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
            >
                <div className="relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-lg transition-transform duration-200 ${
                    selectedConversationId === conv.id 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 scale-105' 
                    : 'bg-white/10 group-hover:bg-white/20'
                }`}>
                    {conv.otherParticipant.name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#0f172a] rounded-full"></div>
                </div>
                
                <div className="flex-1 text-left overflow-hidden">
                <div className="flex justify-between items-center mb-0.5">
                    <h3 className={`font-bold truncate transition-colors ${
                    selectedConversationId === conv.id ? 'text-white' : 'text-gray-300 group-hover:text-white'
                    }`}>
                    {conv.otherParticipant.name}
                    </h3>
                    {conv.lastMessageTimestamp && (
                    <span className="text-[10px] text-gray-500 font-medium bg-white/5 px-2 py-0.5 rounded-full">
                        {new Date(conv.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    )}
                </div>
                <p className="text-sm text-gray-500 truncate group-hover:text-gray-400 transition-colors">
                    {conv.lastMessageText || <span className="italic opacity-50">No messages yet</span>}
                </p>
                </div>
                
                {selectedConversationId === conv.id && (
                    <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                )}
            </button>
            ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;