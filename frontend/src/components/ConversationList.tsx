import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import styles from './ConversationList.module.css';

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
}

const ConversationList: React.FC<ConversationListProps> = ({
  currentUser,
  conversations,
  selectedConversationId,
  setSelectedConversationId,
  fetchConversations
}) => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/api');

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
      // Remove double slash if API_BASE_URL ends with /
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const res = await axios.get(`${baseUrl}/friends/requests`, {
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
      // Remove double slash if API_BASE_URL ends with /
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

      await axios.post(`${baseUrl}/friends/request`,
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
      // Remove double slash if API_BASE_URL ends with /
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

      await axios.post(`${baseUrl}/friends/requests/${requestId}/accept`, {}, {
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
      // Remove double slash if API_BASE_URL ends with /
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

      await axios.post(`${baseUrl}/friends/requests/${requestId}/reject`, {}, {
        headers: { 'x-user-id': currentUser?.id }
      });
      fetchRequests();
    } catch (err) {
      console.error('Error rejecting request:', err);
    }
  };

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="SEARCH CONVERSATIONS..."
            className={styles.searchInput}
          />
        </div>

        <div className={styles.actionButtons}>
          {/* Add Friend Button */}
          <button
            onClick={() => setShowAddFriendModal(true)}
            className={`${styles.btn} ${styles.btnAdd}`}
          >
            ADD FRIEND
          </button>

          {/* Inbox Button */}
          <button
            onClick={() => setShowInbox(!showInbox)}
            className={`${styles.btn} ${styles.btnInbox} ${showInbox ? styles.btnInboxActive : ''}`}
          >
            INBOX
            {friendRequests.length > 0 && (
              <span className={styles.badge}>
                {friendRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Inbox Panel */}
      {showInbox && (
        <div className={styles.inboxPanel}>
          <div className={styles.inboxHeader}>
            <span>FRIEND REQUESTS</span>
            <button onClick={() => setShowInbox(false)} className={styles.inboxCloseBtn}>X</button>
          </div>
          <div className={styles.inboxList}>
            {friendRequests.length === 0 ? (
              <div className={styles.emptyInbox}>NO PENDING REQUESTS</div>
            ) : (
              friendRequests.map(req => (
                <div key={req.id} className={styles.requestItem}>
                  <div className={styles.requestUserInfo}>
                    <div className={styles.requestAvatar}>
                      {req.fromUser?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={styles.requestName}>{req.fromUser?.name}</p>
                    </div>
                  </div>
                  <div className={styles.requestActions}>
                    <button onClick={() => handleAccept(req.id)} className={`${styles.btnAction} ${styles.btnAccept}`} title="Accept">
                      YES
                    </button>
                    <button onClick={() => handleReject(req.id)} className={`${styles.btnAction} ${styles.btnReject}`} title="Reject">
                      NO
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
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>ADD FRIEND</h3>

            {addSuccess ? (
              <div className={styles.successMessage}>
                {addSuccess}
              </div>
            ) : (
              <form onSubmit={handleAddFriend}>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    value={friendUsername}
                    onChange={(e) => setFriendUsername(e.target.value)}
                    placeholder="USERNAME"
                    className={styles.modalInput}
                    autoFocus
                  />
                </div>
                {addError && (
                  <p className={styles.errorMessage}>{addError}</p>
                )}
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => { setShowAddFriendModal(false); setAddError(null); setFriendUsername(''); }}
                    className={`${styles.btn} ${styles.btnCancel}`}
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className={`${styles.btn} ${styles.btnSend}`}
                  >
                    {isAdding ? 'SENDING...' : 'SEND'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className={styles.listContainer}>
        {conversations.length === 0 ? (
          <div className={styles.emptyList}>
            <p>NO FRIENDS YET.</p>
            <p className={styles.emptyListSub}>CLICK "ADD FRIEND" TO START.</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversationId(conv.id)}
              className={`${styles.convItem} ${selectedConversationId === conv.id ? styles.convItemActive : ''}`}
            >
              <div className={styles.avatarContainer}>
                <div className={styles.avatar}>
                  {conv.otherParticipant.name.charAt(0).toUpperCase()}
                </div>
                {/* Online indicator could go here */}
              </div>

              <div className={styles.convInfo}>
                <div className={styles.convHeader}>
                  <h3 className={styles.convName}>
                    {conv.otherParticipant.name}
                  </h3>
                  {conv.lastMessageTimestamp && (
                    <span className={styles.convTime}>
                      {new Date(conv.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className={styles.convMessage}>
                  {conv.lastMessageText || <span className={styles.noMessage}>NO MESSAGES</span>}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;