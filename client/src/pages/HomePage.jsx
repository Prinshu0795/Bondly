import { useState, useEffect, useCallback } from 'react';
import { postService } from '../services/endpoints';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState('All Post');
  const [error, setError] = useState('');

  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await postService.getPosts(pageNum);
      const data = res.data;
      setPosts((prev) => (append ? [...prev, ...data.posts] : data.posts));
      setTotalPages(data.totalPages);
      setPage(data.currentPage);
      setError('');
    } catch (err) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const loadMore = () => {
    if (page < totalPages && !loadingMore) {
      fetchPosts(page + 1, true);
    }
  };

  return (
    <div className="home-page">
      <div className="feed-container">
        
        {/* Search Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search promotions, users," 
              className="form-input" 
              style={{ borderRadius: 'var(--radius-full)', paddingLeft: '1rem' }}
            />
          </div>
          <button className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', width: '40px', height: '40px', padding: 0 }}>
            🔍
          </button>
        </div>

        <CreatePost onPostCreated={handlePostCreated} />

        {/* Feed Tabs */}
        <div className="tabs-nav" style={{ marginTop: '0.5rem' }}>
          {['All Post', 'For You', 'Most Liked', 'Most Commented'].map(tab => (
            <button 
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="feed-loader">
            <div className="spinner" />
            <p>Loading feed...</p>
          </div>
        ) : error ? (
          <div className="feed-empty">
            <p className="error-text">{error}</p>
            <button className="btn btn-primary" onClick={() => fetchPosts()}>
              Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="feed-empty">
            <p className="empty-icon">📭</p>
            <h3>No posts yet</h3>
            <p>Be the first to share something!</p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onPostDeleted={handlePostDeleted}
              />
            ))}

            {page < totalPages && (
              <div className="load-more">
                <button
                  className="btn btn-ghost btn-full"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      <button className="fab-btn">
        +
      </button>
    </div>
  );
}
