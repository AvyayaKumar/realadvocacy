import VideoCard from './VideoCard';
import './VideoGrid.css';

function VideoGrid({ videos, loading }) {
  if (loading) {
    return (
      <div className="video-grid">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="video-card-skeleton">
            <div className="skeleton-thumbnail"></div>
            <div className="skeleton-info">
              <div className="skeleton-avatar"></div>
              <div className="skeleton-details">
                <div className="skeleton-title"></div>
                <div className="skeleton-meta"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
        </div>
        <h3>No videos yet</h3>
        <p>Be the first to share a speech or debate round!</p>
      </div>
    );
  }

  return (
    <div className="video-grid">
      {videos.map((video, index) => (
        <div key={video.id} className="video-grid-item" style={{ animationDelay: `${index * 50}ms` }}>
          <VideoCard video={video} />
        </div>
      ))}
    </div>
  );
}

export default VideoGrid;
