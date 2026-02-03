import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { videosAPI, EVENT_LABELS, EVENT_CATEGORIES } from '../services/api';
import './Watch.css';

function Watch() {
  const { id } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    fetchVideo();
  }, [id]);

  const fetchVideo = async () => {
    setLoading(true);
    try {
      const res = await videosAPI.getOne(id);
      setVideo(res.data);
      setLiked(res.data.userLiked || false);
      setLikeCount(res.data.likes || 0);
    } catch (err) {
      setError('Video not found');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      return;
    }
    try {
      const res = await videosAPI.like(id);
      setLiked(res.data.liked);
      setLikeCount(res.data.likes);
    } catch (err) {
      console.error('Error liking video:', err);
    }
  };

  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="watch-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="watch-page">
        <div className="error">{error || 'Video not found'}</div>
      </div>
    );
  }

  const transcriptContent = video.script || video.transcript;
  const isInterp = EVENT_CATEGORIES.interp.includes(video.eventType);

  return (
    <div className="watch-page">
      <div className="watch-content">
        <div className="video-container">
          <video
            ref={videoRef}
            src={videosAPI.getStreamUrl(video.id)}
            controls
            autoPlay
            className="video-player"
          />
        </div>

        <div className="video-info">
          <h1 className="video-title">{video.title}</h1>

          <div className="video-actions">
            <div className="channel-info">
              <Link to={`/channel/${video.user?.id}`} className="channel-avatar">
                {video.user?.avatar ? (
                  <img src={video.user.avatar} alt={video.user.username} />
                ) : (
                  <span>{video.user?.username?.[0]?.toUpperCase() || '?'}</span>
                )}
              </Link>
              <div className="channel-details">
                <Link to={`/channel/${video.user?.id}`} className="channel-name">
                  {video.user?.username || 'Unknown'}
                </Link>
                {video.user?.school && (
                  <span className="school">{video.user.school}</span>
                )}
              </div>
            </div>

            <div className="action-buttons">
              <button
                className={`like-btn ${liked ? 'liked' : ''}`}
                onClick={handleLike}
                disabled={!user}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                </svg>
                <span>{likeCount}</span>
              </button>
            </div>
          </div>

          <div className="video-description">
            <div className="video-stats">
              <span>{formatViews(video.views)}</span>
              <span className="dot">•</span>
              <span>{formatDate(video.createdAt)}</span>
              {video.eventType && video.eventType !== 'other' && (
                <>
                  <span className="dot">•</span>
                  <span className="event-tag">{EVENT_LABELS[video.eventType]}</span>
                </>
              )}
              {video.tournament && (
                <>
                  <span className="dot">•</span>
                  <span>{video.tournament}</span>
                </>
              )}
            </div>
            {video.topic && (
              <p className="topic-text">{video.topic}</p>
            )}
            {video.description && (
              <p className="description-text">{video.description}</p>
            )}
          </div>
        </div>

        {/* Transcript Section */}
        <div className="transcript-section">
          <div className="transcript-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <h3>
              {video.script ? 'Script' : 'Transcript'}
              {isInterp && video.scriptTitle && ` — ${video.scriptTitle}`}
              {isInterp && video.scriptAuthor && ` by ${video.scriptAuthor}`}
            </h3>
          </div>

          {transcriptContent ? (
            <div className="transcript-content">
              <div className="transcript-text">
                {transcriptContent}
              </div>
              {!video.script && (
                <p className="transcript-note">Auto-generated transcript</p>
              )}
            </div>
          ) : video.transcriptStatus === 'processing' ? (
            <div className="transcript-loading">
              <div className="loading-spinner"></div>
              <span>Generating transcript...</span>
            </div>
          ) : video.transcriptStatus === 'failed' ? (
            <div className="transcript-error">
              <span>Transcript generation failed. The video may be too large or contain no speech.</span>
            </div>
          ) : (
            <div className="transcript-pending">
              <span>Transcript will be available shortly...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Watch;
