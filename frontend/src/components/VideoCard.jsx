import { Link } from 'react-router-dom';
import { EVENT_LABELS, EVENT_CATEGORIES } from '../services/api';
import './VideoCard.css';

function VideoCard({ video }) {
  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  };

  const getEventCategory = (eventType) => {
    if (EVENT_CATEGORIES.debate.includes(eventType)) return 'debate';
    if (EVENT_CATEGORIES.speech.includes(eventType)) return 'speech';
    if (EVENT_CATEGORIES.interp.includes(eventType)) return 'interp';
    return 'other';
  };

  const thumbnailUrl = video.thumbnail
    ? `/uploads/thumbnails/${video.thumbnail}`
    : null;

  const eventLabel = EVENT_LABELS[video.eventType] || video.eventType;
  const eventCategory = getEventCategory(video.eventType);

  return (
    <Link to={`/video/${video.id}`} className="video-card">
      <div className="thumbnail-container">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={video.title} className="thumbnail" />
        ) : (
          <div className="thumbnail-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        )}

        {video.eventType && video.eventType !== 'other' && (
          <span className={`event-badge ${eventCategory}`}>
            {eventLabel}
          </span>
        )}

        {video.side && (
          <span className={`side-badge ${video.side.toLowerCase()}`}>
            {video.side}
          </span>
        )}
      </div>

      <div className="video-info">
        <Link to={`/profile/${video.user?.id}`} className="avatar" onClick={e => e.stopPropagation()}>
          {video.user?.avatar ? (
            <img src={video.user.avatar} alt={video.user.username} />
          ) : (
            <span>{video.user?.username?.[0]?.toUpperCase() || '?'}</span>
          )}
        </Link>

        <div className="video-details">
          <h3 className="video-title">{video.title}</h3>

          <div className="video-meta">
            <Link
              to={`/profile/${video.user?.id}`}
              className="channel-name"
              onClick={e => e.stopPropagation()}
            >
              {video.user?.username || 'Unknown'}
              {video.user?.school && <span className="school">• {video.user.school}</span>}
            </Link>

            <div className="stats">
              <span>{formatViews(video.views)} views</span>
              <span className="dot">•</span>
              <span>{formatDate(video.createdAt)}</span>
            </div>
          </div>

          {video.tournament && (
            <div className="tournament-tag">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
              </svg>
              {video.tournament}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default VideoCard;
