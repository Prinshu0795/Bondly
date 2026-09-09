import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🔗</span>
          <span className="brand-text">Bondly</span>
        </Link>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <Link to="/" className="btn btn-ghost" style={{ padding: '0.4rem 0.6rem' }}>
                🏠 Home
              </Link>
              <Link to="/chat" className="btn btn-ghost" title="Messages" style={{ padding: '0.4rem 0.6rem' }}>
                💬 Message/DM
              </Link>
              <Link to="/profile" className="navbar-user" style={{ textDecoration: 'none' }}>
                <span className="user-avatar">{user?.username?.[0]?.toUpperCase()}</span>
                <span className="user-name">{user?.username}</span>
              </Link>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/signup" className="btn btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
