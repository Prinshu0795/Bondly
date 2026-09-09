import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { postService, userService } from '../services/endpoints';

const API_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : 'http://localhost:5000';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
};

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function PostCard({ post, onPostUpdated, onPostDeleted }) {
  const { user, isAuthenticated } = useAuth();
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Initialize follow state
  useEffect(() => {
    if (user && user.following) {
      const authorId = post.author.userId?._id || post.author.userId;
      setIsFollowing(user.following.includes(authorId));
    }
  }, [user, post.author.userId]);

  const isLiked = user ? likes.some((l) => l.userId === user._id) : false;
  const isAuthor = user && post.author.userId === user._id || user && post.author.userId?._id === user._id;

  const handleFollow = async () => {
    if (!isAuthenticated || followLoading) return;
    setFollowLoading(true);
    try {
      const authorId = post.author.userId?._id || post.author.userId;
      const res = await userService.toggleFollow(authorId);
      setIsFollowing(res.data.isFollowing);
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated || likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await postService.toggleLike(post._id);
      if (res.data.likedByCurrentUser) {
        setLikes([...likes, { userId: user._id, username: user.username }]);
      } else {
        setLikes(likes.filter((l) => l.userId !== user._id));
      }
    } catch (err) {
      console.error('Like error:', err.response?.data?.message);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || commentLoading) return;
    setCommentLoading(true);
    try {
      const res = await postService.addComment(post._id, commentText.trim());
      setComments([...comments, res.data.comment]);
      setCommentText('');
      setShowComments(true);
    } catch (err) {
      console.error('Comment error:', err.response?.data?.message);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    setDeleteLoading(true);
    try {
      await postService.deletePost(post._id);
      onPostDeleted(post._id);
    } catch (err) {
      console.error('Delete error:', err.response?.data?.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="post-card card">
      <div className="post-header">
        <div className="post-author">
          <div 
            className="author-avatar"
            style={post.author.userId?.profilePicture ? { backgroundImage: `url(${getImageUrl(post.author.userId.profilePicture)})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : {}}
          >
            {!post.author.userId?.profilePicture && post.author.username[0].toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="author-name">{post.author.username}</span>
              {post.author.userId?.badges?.map(badge => (
                <span key={badge} className={`badge badge-${badge.toLowerCase()}`}>
                  <span>❶</span> <span>{badge === 'Bronze' ? '🥉' : '👑'} {badge}</span>
                </span>
              )) || (
                <span className="badge badge-bronze">
                  <span>❶</span> <span>🥉 Bronze</span>
                </span>
              )}
              {!isAuthor && isAuthenticated && (
                <button 
                  className={`btn btn-sm ${isFollowing ? 'btn-ghost' : 'btn-primary'}`} 
                  style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem', borderRadius: '4px' }}
                  onClick={handleFollow}
                  disabled={followLoading}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
            <span className="post-time">@{post.author.username.toLowerCase()} • {timeAgo(post.createdAt)}</span>
          </div>
        </div>
        {isAuthor && (
          <button
            className="btn btn-ghost btn-sm btn-danger"
            onClick={handleDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? '...' : '🗑️'}
          </button>
        )}
      </div>

      {post.text && <p className="post-text">{post.text}</p>}

      {post.imageUrl && (
        <div className="post-image">
          <img src={getImageUrl(post.imageUrl)} alt="Post" loading="lazy" />
        </div>
      )}

      <div className="post-stats">
        <button
          className={`like-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={!isAuthenticated || likeLoading}
        >
          {isLiked ? '❤️' : '🤍'} {likes.length} {likes.length === 1 ? 'like' : 'likes'}
        </button>
        <button
          className="comment-toggle-btn"
          onClick={() => setShowComments(!showComments)}
        >
          💬 {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          {comments.length > 0 && (
            <div className="comments-list">
              {comments.map((c, i) => (
                <div key={c._id || i} className="comment">
                  <span className="comment-author">@{c.username}</span>
                  <span className="comment-text">{c.text}</span>
                  <span className="comment-time">{timeAgo(c.createdAt)}</span>
                </div>
              ))}
            </div>
          )}

          {isAuthenticated && (
            <div style={{ marginTop: '1rem' }}>
              <form className="comment-form" onSubmit={handleComment}>
                <input
                  type="text"
                  className="comment-input"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={500}
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!commentText.trim() || commentLoading}
                >
                  {commentLoading ? '...' : 'Reply'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
