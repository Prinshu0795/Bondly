import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { messageService, userService } from '../services/endpoints';

const API_URL = 'http://localhost:5000';

export default function ChatPage() {
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const res = await messageService.getConversations();
      setConversations(res.data.conversations);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchMessages = async (userId) => {
    if (!userId) return;
    try {
      const res = await messageService.getMessages(userId);
      setMessages(res.data.messages);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  // Polling for active chat
  useEffect(() => {
    if (!activeChatUser) return;
    fetchMessages(activeChatUser._id);
    
    const interval = setInterval(() => {
      fetchMessages(activeChatUser._id);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [activeChatUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await userService.searchUsers(q);
      setSearchResults(res.data.users);
    } catch (err) {
      console.error('Failed to search users', err);
    }
  };

  const handleSelectUser = (selectedUser) => {
    setActiveChatUser(selectedUser);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChatUser) return;
    
    try {
      const res = await messageService.sendMessage(activeChatUser._id, messageText);
      setMessages((prev) => [...prev, res.data.message]);
      setMessageText('');
      fetchConversations();
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-search">
          <input 
            type="text" 
            placeholder="Search users..." 
            className="form-input"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        
        <div className="chat-list">
          {searchQuery ? (
            searchResults.map((u) => (
              <div key={u._id} className="chat-list-item" onClick={() => handleSelectUser(u)}>
                <div className="chat-avatar" style={u.profilePicture ? { backgroundImage: `url(${API_URL}${u.profilePicture})` } : {}}>
                  {!u.profilePicture && u.username[0].toUpperCase()}
                </div>
                <div className="chat-preview">
                  <span className="chat-name">{u.username}</span>
                </div>
              </div>
            ))
          ) : conversations.length > 0 ? (
            conversations.map((conv) => (
              <div 
                key={conv.user._id} 
                className={`chat-list-item ${activeChatUser?._id === conv.user._id ? 'active' : ''}`}
                onClick={() => handleSelectUser(conv.user)}
              >
                <div className="chat-avatar" style={conv.user.profilePicture ? { backgroundImage: `url(${API_URL}${conv.user.profilePicture})` } : {}}>
                  {!conv.user.profilePicture && conv.user.username[0].toUpperCase()}
                </div>
                <div className="chat-preview">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="chat-name">{conv.user.username}</span>
                  </div>
                  <span className="chat-last-msg">{conv.lastMessage?.text}</span>
                </div>
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: '2rem' }}>No conversations yet. Search for a user to start chatting!</p>
          )}
        </div>
      </div>

      <div className="chat-main">
        {activeChatUser ? (
          <>
            <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="chat-avatar" style={activeChatUser.profilePicture ? { backgroundImage: `url(${API_URL}${activeChatUser.profilePicture})` } : {}}>
                  {!activeChatUser.profilePicture && activeChatUser.username[0].toUpperCase()}
                </div>
                <span className="chat-header-name">{activeChatUser.username}</span>
              </div>
              <button 
                className={`btn btn-sm ${user?.following?.includes(activeChatUser._id) ? 'btn-ghost' : 'btn-primary'}`}
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', borderRadius: '4px' }}
                onClick={async () => {
                  try {
                    const res = await userService.toggleFollow(activeChatUser._id);
                    // To instantly reflect the change without waiting for full AuthContext reload, we could trigger a local state update
                    // But AuthContext doesn't expose a method to just update user locally.
                    // Let's just alert or it will update on refresh. Wait, let's just make it call the API.
                    if (res.data.success) {
                       window.location.reload(); // Simple approach to sync state across the app
                    }
                  } catch (err) {
                    console.error('Follow error:', err);
                  }
                }}
              >
                {user?.following?.includes(activeChatUser._id) ? 'Following' : 'Follow'}
              </button>
            </div>
            
            <div className="chat-messages">
              {messages.map((msg) => {
                const isMine = msg.sender === user._id;
                return (
                  <div key={msg._id} className={`chat-bubble-wrap ${isMine ? 'mine' : 'theirs'}`}>
                    <div className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            
            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="form-input"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={!messageText.trim()}>Send</button>
            </form>
          </>
        ) : (
          <div className="chat-empty">
            <span style={{ fontSize: '3rem' }}>💬</span>
            <p>Select a conversation or search for a user to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
