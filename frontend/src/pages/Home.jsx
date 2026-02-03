import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import VideoGrid from '../components/VideoGrid';
import { videosAPI, EVENT_LABELS, EVENT_CATEGORIES } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Speeches' },
  { id: 'debate', label: 'Debate' },
  { id: 'speech', label: 'Oratory' },
  { id: 'interp', label: 'Interpretation' },
];

const CAUSES = [
  { icon: '🌍', label: 'Climate Action' },
  { icon: '⚖️', label: 'Social Justice' },
  { icon: '🎓', label: 'Education' },
  { icon: '🏥', label: 'Healthcare' },
  { icon: '🗳️', label: 'Civic Engagement' },
  { icon: '🤝', label: 'Community' },
];

function Home() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeEvent, setActiveEvent] = useState(null);
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') || '';

  useEffect(() => {
    setPage(1);
  }, [search, activeCategory, activeEvent]);

  useEffect(() => {
    fetchVideos();
  }, [page, search, activeEvent]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const params = { page, search, limit: 12 };
      if (activeEvent) {
        params.eventType = activeEvent;
      }
      const res = await videosAPI.getAll(params);
      setVideos(res.data.videos);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setActiveEvent(null);
  };

  const handleEventChange = (event) => {
    setActiveEvent(event === activeEvent ? null : event);
  };

  const getEventsForCategory = () => {
    if (activeCategory === 'all') return [];
    return EVENT_CATEGORIES[activeCategory] || [];
  };

  return (
    <div className="home-page">
      {!search && !user && (
        <section className="hero">
          <div className="hero-bg">
            <div className="hero-glow glow-1"></div>
            <div className="hero-glow glow-2"></div>
          </div>
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Youth Advocacy Platform
            </div>
            <h1>
              Amplify Your Voice.
              <br />
              <span className="hero-accent">Inspire Change.</span>
            </h1>
            <p>
              Connect passionate young speakers with organizations making a difference.
              Share your speeches, discover opportunities, and turn advocacy into action.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="hero-btn primary">
                <span>Start Speaking</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <Link to="/login" className="hero-btn secondary">Watch Speeches</Link>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-value">500+</span>
                <span className="stat-label">Speeches</span>
              </div>
              <div className="stat">
                <span className="stat-value">100+</span>
                <span className="stat-label">Organizations</span>
              </div>
              <div className="stat">
                <span className="stat-value">50+</span>
                <span className="stat-label">Causes</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="cause-cards">
              {CAUSES.map((cause, i) => (
                <div key={i} className={`cause-card card-${i + 1}`}>
                  <span className="cause-icon">{cause.icon}</span>
                  <span className="cause-label">{cause.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {!search && user && (
        <section className="welcome-banner">
          <div className="welcome-content">
            <h2>Welcome back, <span className="accent-text">{user.username}</span></h2>
            <p>Continue exploring speeches or share your own voice with the community.</p>
          </div>
          {(user.accountType === 'competitor' || user.accountType === 'organizer') && (
            <Link to="/upload" className="welcome-cta">
              <span>Share a Speech</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </Link>
          )}
        </section>
      )}

      <section className="browse-section">
        {search ? (
          <div className="search-header">
            <h2>Results for "<span className="accent-text">{search}</span>"</h2>
          </div>
        ) : (
          <>
            <div className="section-header">
              <h2>Discover Speeches</h2>
              <p>Watch and learn from passionate young advocates</p>
            </div>

            <div className="filters">
              <div className="category-tabs">
                {CATEGORY_TABS.map(tab => (
                  <button
                    key={tab.id}
                    className={`category-tab ${activeCategory === tab.id ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {getEventsForCategory().length > 0 && (
                <div className="event-filters">
                  {getEventsForCategory().map(event => (
                    <button
                      key={event}
                      className={`event-chip ${activeEvent === event ? 'active' : ''}`}
                      onClick={() => handleEventChange(event)}
                    >
                      {EVENT_LABELS[event]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <VideoGrid videos={videos} loading={loading} />

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="pagination-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              Previous
            </button>
            <div className="page-indicator">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    className={`page-dot ${page === pageNum ? 'active' : ''}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="pagination-btn"
            >
              Next
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        )}
      </section>

      {!search && !user && (
        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to Make an Impact?</h2>
            <p>Join speakers and organizers who are amplifying youth voices across the country.</p>
            <Link to="/register" className="cta-btn">
              Join the Movement
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;
