import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI, videosAPI, EVENT_LABELS, ROUND_LABELS, EVENT_CATEGORIES } from '../services/api';
import './Channel.css';

function Channel() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingVideo, setEditingVideo] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  const isOwner = currentUser && channel && currentUser.id === channel.id;

  useEffect(() => {
    fetchChannel();
  }, [id]);

  useEffect(() => {
    if (channel) {
      fetchVideos();
    }
  }, [channel, page]);

  const fetchChannel = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getOne(id);
      setChannel(res.data);
    } catch (err) {
      setError('Profile not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async () => {
    try {
      const res = await usersAPI.getVideos(id, { page, limit: 12 });
      setVideos(res.data.videos);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Error fetching videos:', err);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    try {
      await videosAPI.delete(videoId);
      setVideos(videos.filter(v => v.id !== videoId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting video:', err);
    }
  };

  const handleUpdateVideo = async (e) => {
    e.preventDefault();
    if (!editingVideo) return;

    setSaving(true);
    try {
      const res = await videosAPI.update(editingVideo.id, {
        title: editingVideo.title,
        description: editingVideo.description,
        eventType: editingVideo.eventType,
        roundType: editingVideo.roundType,
        tournament: editingVideo.tournament,
        topic: editingVideo.topic,
        side: editingVideo.side,
        script: editingVideo.script,
        scriptTitle: editingVideo.scriptTitle,
        scriptAuthor: editingVideo.scriptAuthor
      });
      setVideos(videos.map(v => v.id === res.data.id ? res.data : v));
      setEditingVideo(null);
    } catch (err) {
      console.error('Error updating video:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAccountBadge = (type) => {
    switch (type) {
      case 'organizer': return { label: 'Organizer', color: 'organizer' };
      case 'competitor': return { label: 'Speaker', color: 'competitor' };
      case 'guest': return { label: 'Guest', color: 'guest' };
      default: return null;
    }
  };

  if (loading && !channel) {
    return (
      <div className="channel-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="channel-page">
        <div className="error-state">
          <h2>Profile not found</h2>
          <p>This user doesn't exist or the page has been removed.</p>
          <Link to="/" className="back-home">Back to Home</Link>
        </div>
      </div>
    );
  }

  const badge = getAccountBadge(channel.accountType);

  return (
    <div className="channel-page">
      {/* Profile Header */}
      <div className="channel-header">
        <div className="channel-banner">
          <div className="banner-gradient"></div>
        </div>
        <div className="channel-info">
          <div className="channel-avatar">
            {channel.avatar ? (
              <img src={channel.avatar} alt={channel.username} />
            ) : (
              <span>{channel.username[0].toUpperCase()}</span>
            )}
          </div>
          <div className="channel-details">
            <div className="channel-name-row">
              <h1 className="channel-name">{channel.username}</h1>
              {badge && (
                <span className={`account-badge ${badge.color}`}>{badge.label}</span>
              )}
            </div>
            <div className="channel-stats">
              {channel.school && <span className="school">{channel.school}</span>}
              {channel.organization && <span className="org">{channel.organization}</span>}
              <span className="dot">•</span>
              <span>{videos.length} videos</span>
              <span className="dot">•</span>
              <span>Joined {formatDate(channel.createdAt)}</span>
            </div>
            {channel.bio && <p className="channel-bio">{channel.bio}</p>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="channel-content">
        <div className="section-header">
          <h2>{isOwner ? 'My Videos' : 'Videos'}</h2>
          {isOwner && (
            <Link to="/upload" className="upload-new-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Upload New
            </Link>
          )}
        </div>

        {videos.length === 0 ? (
          <div className="empty-videos">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="2"/>
                <path d="M10 8l6 4-6 4V8z"/>
              </svg>
            </div>
            <h3>{isOwner ? 'No videos yet' : 'No videos'}</h3>
            <p>{isOwner ? 'Upload your first speech to get started!' : 'This user hasn\'t uploaded any videos yet.'}</p>
            {isOwner && (
              <Link to="/upload" className="upload-cta">Upload a Speech</Link>
            )}
          </div>
        ) : (
          <div className="videos-grid">
            {videos.map(video => (
              <div key={video.id} className="video-manage-card">
                <Link to={`/video/${video.id}`} className="video-thumbnail">
                  {video.thumbnail ? (
                    <img src={`/uploads/thumbnails/${video.thumbnail}`} alt={video.title} />
                  ) : (
                    <div className="thumbnail-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </div>
                  )}
                  <div className="video-duration">{formatNumber(video.views)} views</div>
                </Link>
                <div className="video-details">
                  <Link to={`/video/${video.id}`} className="video-title">{video.title}</Link>
                  <div className="video-meta">
                    <span>{formatDate(video.createdAt)}</span>
                    {video.eventType && video.eventType !== 'other' && (
                      <>
                        <span className="dot">•</span>
                        <span>{EVENT_LABELS[video.eventType]}</span>
                      </>
                    )}
                  </div>
                  {isOwner && (
                    <div className="video-actions">
                      <button
                        className="edit-btn"
                        onClick={() => setEditingVideo({...video})}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => setDeleteConfirm(video)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

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
            <span className="page-info">Page {page} of {totalPages}</span>
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
      </div>

      {/* Edit Modal */}
      {editingVideo && (
        <div className="modal-overlay" onClick={() => setEditingVideo(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Video</h2>
              <button className="close-btn" onClick={() => setEditingVideo(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdateVideo} className="edit-form">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={editingVideo.title}
                  onChange={e => setEditingVideo({...editingVideo, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingVideo.description || ''}
                  onChange={e => setEditingVideo({...editingVideo, description: e.target.value})}
                  rows={4}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Event Type</label>
                  <select
                    value={editingVideo.eventType || 'other'}
                    onChange={e => setEditingVideo({...editingVideo, eventType: e.target.value})}
                  >
                    {Object.entries(EVENT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Round Type</label>
                  <select
                    value={editingVideo.roundType || 'practice'}
                    onChange={e => setEditingVideo({...editingVideo, roundType: e.target.value})}
                  >
                    {Object.entries(ROUND_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Tournament/Event (optional)</label>
                <input
                  type="text"
                  value={editingVideo.tournament || ''}
                  onChange={e => setEditingVideo({...editingVideo, tournament: e.target.value})}
                  placeholder="e.g., State Championships 2024"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Topic (optional)</label>
                  <input
                    type="text"
                    value={editingVideo.topic || ''}
                    onChange={e => setEditingVideo({...editingVideo, topic: e.target.value})}
                    placeholder="Resolution or topic"
                  />
                </div>
                <div className="form-group">
                  <label>Side (for debate)</label>
                  <select
                    value={editingVideo.side || ''}
                    onChange={e => setEditingVideo({...editingVideo, side: e.target.value})}
                  >
                    <option value="">N/A</option>
                    <option value="Aff">Affirmative</option>
                    <option value="Neg">Negative</option>
                  </select>
                </div>
              </div>

              {/* Script Section */}
              {EVENT_CATEGORIES.interp.includes(editingVideo.eventType) && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Piece Title</label>
                    <input
                      type="text"
                      value={editingVideo.scriptTitle || ''}
                      onChange={e => setEditingVideo({...editingVideo, scriptTitle: e.target.value})}
                      placeholder="Original work title"
                    />
                  </div>
                  <div className="form-group">
                    <label>Author</label>
                    <input
                      type="text"
                      value={editingVideo.scriptAuthor || ''}
                      onChange={e => setEditingVideo({...editingVideo, scriptAuthor: e.target.value})}
                      placeholder="Author name"
                    />
                  </div>
                </div>
              )}
              <div className="form-group">
                <label>Script / Speech Text</label>
                <textarea
                  value={editingVideo.script || ''}
                  onChange={e => setEditingVideo({...editingVideo, script: e.target.value})}
                  rows={6}
                  placeholder="Paste your script here (leave empty for auto-transcript)"
                  className="script-textarea"
                />
                <span className="field-hint">
                  {editingVideo.script?.length > 0
                    ? `${editingVideo.script.split(/\s+/).filter(w => w).length} words`
                    : editingVideo.transcript ? 'Auto-transcript available' : 'Leave empty for auto-transcription'}
                </span>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setEditingVideo(null)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal modal-small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Video</h2>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete "<strong>{deleteConfirm.title}</strong>"?</p>
              <p className="warning">This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                className="delete-confirm-btn"
                onClick={() => handleDeleteVideo(deleteConfirm.id)}
              >
                Delete Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Channel;
