import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getAccountBadge = (type) => {
    switch (type) {
      case 'organizer': return { label: 'Organizer', color: 'organizer' };
      case 'competitor': return { label: 'Speaker', color: 'competitor' };
      case 'guest': return { label: 'Guest', color: 'guest' };
      default: return null;
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="logo">
          <div className="logo-mark">
            <span className="logo-letter">A</span>
          </div>
          <div className="logo-text">
            <span className="logo-name">Amplify</span>
            <span className="logo-tagline">Youth Voices</span>
          </div>
        </Link>

        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search speeches, topics, causes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </button>
        </form>

        <div className="navbar-actions">
          {user ? (
            <>
              {(user.accountType === 'competitor' || user.accountType === 'organizer') && (
                <Link to="/upload" className="upload-btn">
                  <span className="upload-icon">+</span>
                  <span className="upload-text">Share</span>
                </Link>
              )}

              <div className="user-dropdown">
                <button
                  className="user-trigger"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="user-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} />
                    ) : (
                      <span>{user.username[0].toUpperCase()}</span>
                    )}
                  </div>
                  <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>

                {showUserMenu && (
                  <>
                    <div className="dropdown-backdrop" onClick={() => setShowUserMenu(false)} />
                    <div className="dropdown-menu">
                      <div className="dropdown-header">
                        <div className="dropdown-avatar">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.username} />
                          ) : (
                            <span>{user.username[0].toUpperCase()}</span>
                          )}
                        </div>
                        <div className="dropdown-user-info">
                          <span className="dropdown-username">{user.username}</span>
                          {getAccountBadge(user.accountType) && (
                            <span className={`account-badge ${getAccountBadge(user.accountType).color}`}>
                              {getAccountBadge(user.accountType).label}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="dropdown-links">
                        <Link to={`/profile/${user.id}`} onClick={() => setShowUserMenu(false)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          My Profile
                        </Link>
                        {(user.accountType === 'competitor' || user.accountType === 'organizer') && (
                          <Link to="/matches" onClick={() => setShowUserMenu(false)} className="matches-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                              <circle cx="9" cy="7" r="4"/>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                            Matches
                          </Link>
                        )}
                        <button onClick={() => { logout(); setShowUserMenu(false); }} className="logout-btn">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="login-link">Log In</Link>
              <Link to="/register" className="join-btn">Join the Movement</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
