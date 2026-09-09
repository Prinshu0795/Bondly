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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const profilePicRef = useRef(null);
  const coverPicRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const res = await userService.getProfile(user.username);
        setProfileData(res.data.user);
        setPosts(res.data.posts);
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
    formData.append('type', type); // 'profile' or 'cover'

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

  const tabs = [`My Posts (${posts.length})`, `Promotions (${profileData.promotions || 0})`, 'Liked (0)', 'Commented (0)'];

  const joinDate = new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const followerCount = profileData.followers.length;
  const followingCount = profileData.following.length;
  const milestoneTarget = Math.ceil((followerCount + 1) / 100) * 100;
  const milestonePercent = Math.min(100, Math.round((followerCount / milestoneTarget) * 100));

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
              {profileData.badges.map(badge => (
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
        <div className="stat-box">
          <div className="stat-value">{followingCount}</div>
          <div className="stat-label">Following</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{followerCount}</div>
          <div className="stat-label">Followers</div>
        </div>
      </div>

      <div className="milestone-section">
        <div className="milestone-header">
          <span>Follower Milestone 🎯</span>
          <span>{milestoneTarget} ({milestonePercent}%)</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${milestonePercent}%` }}></div>
        </div>
      </div>

      <div style={{ padding: '0 1rem' }}>
        <div className="tabs-nav">
          {tabs.map((tab) => {
            const tabKey = tab.split(' ')[0];
            return (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tabKey ? 'active' : ''}`}
                onClick={() => setActiveTab(tabKey)}
              >
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      <div className="feed-container" style={{ padding: '0 1rem' }}>
        {activeTab === 'My' && posts.length > 0 ? (
          posts.map(post => <PostCard key={post._id} post={post} onPostDeleted={(id) => setPosts(posts.filter(p => p._id !== id))} />)
        ) : (
          <div className="feed-empty">
            <p className="empty-icon">📭</p>
            <h3>No posts yet</h3>
          </div>
        )}
      </div>

      <button className="fab-btn">
        +
      </button>
    </div>
  );
}
