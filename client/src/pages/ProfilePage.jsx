import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/endpoints';
import PostCard from '../components/PostCard';

const API_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : 'http://localhost:5000';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('My Posts');
  
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [commentedPosts, setCommentedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  
  const profilePicRef = useRef(null);
  const coverPicRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const res = await userService.getProfile(user.username);
        setProfileData(res.data.user);
        setPosts(res.data.posts || []);
        setLikedPosts(res.data.likedPosts || []);
        setCommentedPosts(res.data.commentedPosts || []);
      } catch (err) {
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);

    try {
      const res = await userService.uploadImages(formData);
      setProfileData(res.data.user);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload image');
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !profileData) {
    return <div className="feed-empty"><p className="error-text">{error}</p></div>;
  }

  const tabs = [`My Posts (${posts.length})`, `Liked (${likedPosts.length})`, `Commented (${commentedPosts.length})`];

  const joinDate = new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const followerCount = profileData.followers.length;
  const followingCount = profileData.following.length;

  const coverStyle = profileData.coverPicture 
    ? { backgroundImage: `url(${API_URL}${profileData.coverPicture})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div className="profile-dashboard">
      <div className="profile-cover" style={coverStyle}>
        <div className="profile-cover-actions">
          <input 
            type="file" 
            ref={coverPicRef} 
            hidden 
            accept="image/*" 
            onChange={(e) => handleImageUpload(e, 'cover')} 
          />
          <button className="action-btn-circle" onClick={() => coverPicRef.current.click()} title="Change Cover Picture">
            📷
          </button>
        </div>
      </div>

      <div className="profile-header">
        <div className="profile-info">
          <div>
            <div className="profile-avatar-wrap">
              <div className="profile-avatar" style={profileData.profilePicture ? { backgroundImage: `url(${API_URL}${profileData.profilePicture})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                {!profileData.profilePicture && profileData.username[0].toUpperCase()}
              </div>
              <input 
                type="file" 
                ref={profilePicRef} 
                hidden 
                accept="image/*" 
                onChange={(e) => handleImageUpload(e, 'profile')} 
              />
              <div className="avatar-badge" onClick={() => profilePicRef.current.click()} style={{ cursor: 'pointer' }} title="Change Profile Picture">
                📷
              </div>
            </div>
            
            <div className="profile-name">
              {profileData.username} 🇮🇳
            </div>
            
            <div className="profile-badges">
              {profileData.badges?.map(badge => (
                <span key={badge} className={`badge badge-${badge.toLowerCase()}`}>
                  <span>❶</span> <span>{badge === 'Bronze' ? '🥉' : '👑'} {badge}</span>
                </span>
              ))}
            </div>

            <div className="profile-handle">
              @{profileData.username.toLowerCase().replace(/\s/g, '')}
              <span style={{ margin: '0 0.5rem' }}>•</span>
              📅 Joined {joinDate}
            </div>
          </div>
        </div>
      </div>

      <div className="profile-stats-grid">
        <div className="stat-box" onClick={() => setShowFollowing(true)} style={{ cursor: 'pointer' }} title="View Following">
          <div className="stat-value">{followingCount}</div>
          <div className="stat-label">Following</div>
        </div>
        <div className="stat-box" onClick={() => setShowFollowers(true)} style={{ cursor: 'pointer' }} title="View Followers">
          <div className="stat-value">{followerCount}</div>
          <div className="stat-label">Followers</div>
        </div>
      </div>

      <div style={{ padding: '0 1rem', marginTop: '1.5rem' }}>
        <div className="tabs-nav">
          {tabs.map((tab) => {
            const tabKey = tab.split(' ')[0];
            return (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tabKey || (activeTab === 'My' && tabKey === 'My') ? 'active' : ''}`}
                onClick={() => setActiveTab(tabKey)}
              >
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      <div className="feed-container" style={{ padding: '0 1rem' }}>
        {activeTab === 'My' && (
          posts.length > 0 ? (
            posts.map(post => <PostCard key={post._id} post={post} onPostDeleted={(id) => setPosts(posts.filter(p => p._id !== id))} />)
          ) : (
            <div className="feed-empty">
              <p className="empty-icon">📭</p>
              <h3>No posts yet</h3>
            </div>
          )
        )}

        {activeTab === 'Liked' && (
          likedPosts.length > 0 ? (
            likedPosts.map(post => <PostCard key={post._id} post={post} />)
          ) : (
            <div className="feed-empty">
              <p className="empty-icon">🤍</p>
              <h3>No liked posts</h3>
            </div>
          )
        )}

        {activeTab === 'Commented' && (
          commentedPosts.length > 0 ? (
            commentedPosts.map(post => <PostCard key={post._id} post={post} />)
          ) : (
            <div className="feed-empty">
              <p className="empty-icon">💬</p>
              <h3>No commented posts</h3>
            </div>
          )
        )}
      </div>

      {/* Network Modals */}
      {(showFollowers || showFollowing) && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }} onClick={() => { setShowFollowers(false); setShowFollowing(false); }}>
          <div className="card" style={{ width: '90%', maxWidth: '400px', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{showFollowers ? 'Followers' : 'Following'}</h3>
              <button className="btn-ghost" style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', cursor: 'pointer', padding: '0.2rem 0.5rem' }} onClick={() => { setShowFollowers(false); setShowFollowing(false); }}>✕</button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {(showFollowers ? profileData.followers : profileData.following).length > 0 ? (
                (showFollowers ? profileData.followers : profileData.following).map(u => (
                  <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="chat-avatar" style={u.profilePicture ? { backgroundImage: `url(${API_URL}${u.profilePicture})`, width: '40px', height: '40px' } : { width: '40px', height: '40px' }}>
                      {!u.profilePicture && u.username[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: '500' }}>{u.username}</span>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem 1rem' }}>
                  {showFollowers ? 'No followers yet.' : 'Not following anyone yet.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <button className="fab-btn">
        +
      </button>
    </div>
  );
}
