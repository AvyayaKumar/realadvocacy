import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI, ADVOCACY_LABELS } from '../services/api';
import './Matches.css';

function Matches() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [matchType, setMatchType] = useState('');
  const [yourCauses, setYourCauses] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMatches();
  }, [user]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getMatches();
      setMatches(res.data.matches || []);
      setMatchType(res.data.type || '');
      setYourCauses(res.data.yourCauses || []);
      setMessage(res.data.message || '');
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isOrganizer = user.accountType === 'organizer';
  const isSpeaker = user.accountType === 'competitor';

  return (
    <div className="matches-page">
      <div className="matches-container">
        <div className="matches-header">
          <div className="header-content">
            <h1>
              {isOrganizer ? 'Matched Speakers' : 'Matched Organizations'}
            </h1>
            <p>
              {isOrganizer
                ? 'Discover speakers whose advocacy aligns with your causes'
                : 'Find organizations that match your advocacy topics'}
            </p>
          </div>
          {yourCauses.length > 0 && (
            <div className="your-causes">
              <span className="causes-label">Your advocacy areas:</span>
              <div className="causes-tags">
                {yourCauses.map(cause => (
                  <span key={cause} className="cause-tag">
                    {ADVOCACY_LABELS[cause] || cause}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Finding matches...</p>
          </div>
        ) : message ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3>{message}</h3>
            {isOrganizer && (
              <Link to="/settings" className="action-btn">Set Advocacy Focus</Link>
            )}
            {isSpeaker && (
              <Link to="/upload" className="action-btn">Upload a Speech</Link>
            )}
          </div>
        ) : matches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <h3>No matches found yet</h3>
            <p>Check back later as more {isOrganizer ? 'speakers join' : 'organizations register'}</p>
          </div>
        ) : (
          <div className="matches-grid">
            {matchType === 'speakers' ? (
              // Organizer viewing speakers
              matches.map((match) => (
                <div key={match.user.id} className="match-card speaker">
                  <div className="match-header">
                    <Link to={`/channel/${match.user.id}`} className="match-avatar">
                      {match.user.avatar ? (
                        <img src={match.user.avatar} alt={match.user.username} />
                      ) : (
                        <span>{match.user.username[0].toUpperCase()}</span>
                      )}
                    </Link>
                    <div className="match-info">
                      <Link to={`/channel/${match.user.id}`} className="match-name">
                        {match.user.username}
                      </Link>
                      {match.user.school && (
                        <span className="match-school">{match.user.school}</span>
                      )}
                    </div>
                    <div className="match-score">
                      <span className="score-value">{match.matchScore}</span>
                      <span className="score-label">match{match.matchScore !== 1 ? 'es' : ''}</span>
                    </div>
                  </div>

                  <div className="matched-causes">
                    {match.matchedCauses.map(cause => (
                      <span key={cause} className="matched-cause">
                        {ADVOCACY_LABELS[cause] || cause}
                      </span>
                    ))}
                  </div>

                  {match.matchingVideos.length > 0 && (
                    <div className="matching-videos">
                      <span className="videos-label">{match.matchingVideos.length} relevant speeches:</span>
                      <div className="videos-list">
                        {match.matchingVideos.slice(0, 3).map(video => (
                          <Link key={video.id} to={`/video/${video.id}`} className="video-link">
                            <span className="video-title">{video.title}</span>
                            <span className="video-views">{video.views} views</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link to={`/channel/${match.user.id}`} className="view-profile-btn">
                    View Profile
                  </Link>
                </div>
              ))
            ) : (
              // Speaker viewing organizations
              matches.map((match) => (
                <div key={match.user.id} className="match-card organization">
                  <div className="match-header">
                    <Link to={`/channel/${match.user.id}`} className="match-avatar org">
                      {match.user.avatar ? (
                        <img src={match.user.avatar} alt={match.user.organization} />
                      ) : (
                        <span>{(match.user.organization || match.user.username)[0].toUpperCase()}</span>
                      )}
                    </Link>
                    <div className="match-info">
                      <Link to={`/channel/${match.user.id}`} className="match-name">
                        {match.user.organization || match.user.username}
                      </Link>
                      {match.user.location && (
                        <span className="match-location">{match.user.location}</span>
                      )}
                    </div>
                    <div className="match-score">
                      <span className="score-value">{match.matchScore}</span>
                      <span className="score-label">match{match.matchScore !== 1 ? 'es' : ''}</span>
                    </div>
                  </div>

                  {match.user.bio && (
                    <p className="match-bio">{match.user.bio}</p>
                  )}

                  <div className="matched-causes">
                    {match.matchedCauses.map(cause => (
                      <span key={cause} className="matched-cause">
                        {ADVOCACY_LABELS[cause] || cause}
                      </span>
                    ))}
                  </div>

                  <div className="match-actions">
                    <Link to={`/channel/${match.user.id}`} className="view-profile-btn">
                      View Organization
                    </Link>
                    {match.user.website && (
                      <a href={match.user.website} target="_blank" rel="noopener noreferrer" className="website-btn">
                        Website
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Matches;
