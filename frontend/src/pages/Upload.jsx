import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { videosAPI, EVENT_LABELS, ROUND_LABELS, EVENT_CATEGORIES } from '../services/api';
import './Upload.css';

function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('other');
  const [roundType, setRoundType] = useState('practice');
  const [tournament, setTournament] = useState('');
  const [topic, setTopic] = useState('');
  const [side, setSide] = useState('');
  const [script, setScript] = useState('');
  const [scriptTitle, setScriptTitle] = useState('');
  const [scriptAuthor, setScriptAuthor] = useState('');
  const [showScriptSection, setShowScriptSection] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const isDebateEvent = EVENT_CATEGORIES.debate.includes(eventType);
  const isInterpEvent = EVENT_CATEGORIES.interp.includes(eventType);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i)) {
        setError('Please select a video file');
        return;
      }
      setVideoFile(file);
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
      setStep(2);
      setError('');
    }
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('eventType', eventType);
      formData.append('roundType', roundType);
      formData.append('tournament', tournament.trim());
      formData.append('topic', topic.trim());
      formData.append('side', side);
      formData.append('script', script.trim());
      formData.append('scriptTitle', scriptTitle.trim());
      formData.append('scriptAuthor', scriptAuthor.trim());

      const res = await videosAPI.upload(formData, setProgress);
      const video = res.data;

      if (thumbnailFile) {
        const thumbnailFormData = new FormData();
        thumbnailFormData.append('thumbnail', thumbnailFile);
        await videosAPI.uploadThumbnail(video.id, thumbnailFormData);
      }

      navigate(`/video/${video.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i))) {
      setVideoFile(file);
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
      setStep(2);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        {step === 1 ? (
          <div
            className="upload-dropzone"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleVideoSelect}
              accept="video/*"
              hidden
            />
            <div className="dropzone-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <h2>Upload your speech or debate</h2>
            <p>Drag and drop your video file here, or click to browse</p>
            <button className="select-files-btn">Select Video</button>
            <span className="file-hint">MP4, WebM, MOV up to 500MB</span>
          </div>
        ) : (
          <div className="upload-details">
            <div className="upload-header">
              <h2>Video Details</h2>
              {uploading && (
                <div className="upload-progress">
                  <div className="progress-ring">
                    <svg viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="var(--bg-tertiary)"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="3"
                        strokeDasharray={`${progress}, 100`}
                      />
                      <defs>
                        <linearGradient id="gradient">
                          <stop offset="0%" stopColor="var(--accent)"/>
                          <stop offset="100%" stopColor="var(--secondary)"/>
                        </linearGradient>
                      </defs>
                    </svg>
                    <span>{progress}%</span>
                  </div>
                </div>
              )}
            </div>

            {error && <div className="upload-error">{error}</div>}

            <div className="upload-layout">
              <div className="form-section">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your video a title"
                    maxLength={150}
                    disabled={uploading}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Event Type</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      disabled={uploading}
                    >
                      <optgroup label="Debate">
                        {EVENT_CATEGORIES.debate.map(e => (
                          <option key={e} value={e}>{EVENT_LABELS[e]}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Speech">
                        {EVENT_CATEGORIES.speech.map(e => (
                          <option key={e} value={e}>{EVENT_LABELS[e]}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Interp">
                        {EVENT_CATEGORIES.interp.map(e => (
                          <option key={e} value={e}>{EVENT_LABELS[e]}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Other">
                        {EVENT_CATEGORIES.other.map(e => (
                          <option key={e} value={e}>{EVENT_LABELS[e]}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Round Type</label>
                    <select
                      value={roundType}
                      onChange={(e) => setRoundType(e.target.value)}
                      disabled={uploading}
                    >
                      {Object.entries(ROUND_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {isDebateEvent && (
                  <div className="form-group">
                    <label>Side</label>
                    <div className="side-buttons">
                      <button
                        type="button"
                        className={`side-btn aff ${side === 'AFF' ? 'active' : ''}`}
                        onClick={() => setSide(side === 'AFF' ? '' : 'AFF')}
                        disabled={uploading}
                      >
                        AFF
                      </button>
                      <button
                        type="button"
                        className={`side-btn neg ${side === 'NEG' ? 'active' : ''}`}
                        onClick={() => setSide(side === 'NEG' ? '' : 'NEG')}
                        disabled={uploading}
                      >
                        NEG
                      </button>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Tournament</label>
                  <input
                    type="text"
                    value={tournament}
                    onChange={(e) => setTournament(e.target.value)}
                    placeholder="e.g., TOC, Harvard, State Championship"
                    disabled={uploading}
                  />
                </div>

                <div className="form-group">
                  <label>{isDebateEvent ? 'Resolution / Topic' : 'Topic'}</label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={isDebateEvent ? "Enter the resolution" : "What is your speech about?"}
                    rows={2}
                    disabled={uploading}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add any additional context, strategies used, or notes for viewers"
                    rows={3}
                    disabled={uploading}
                  />
                </div>

                {/* Script Section */}
                <div className="script-section">
                  <button
                    type="button"
                    className={`script-toggle ${showScriptSection ? 'active' : ''}`}
                    onClick={() => setShowScriptSection(!showScriptSection)}
                    disabled={uploading}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    <span>{showScriptSection ? 'Hide Script/Text' : 'Add Script or Text'}</span>
                    <svg className={`chevron ${showScriptSection ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {showScriptSection && (
                    <div className="script-fields">
                      <div className="script-info">
                        <p>
                          {isInterpEvent
                            ? 'Add your cutting/script with the original piece title and author.'
                            : 'Add your script or speech text. If left empty, a transcript will be auto-generated from the video.'}
                        </p>
                      </div>

                      {isInterpEvent && (
                        <div className="form-row">
                          <div className="form-group">
                            <label>Piece Title</label>
                            <input
                              type="text"
                              value={scriptTitle}
                              onChange={(e) => setScriptTitle(e.target.value)}
                              placeholder="Original work title"
                              disabled={uploading}
                            />
                          </div>
                          <div className="form-group">
                            <label>Author</label>
                            <input
                              type="text"
                              value={scriptAuthor}
                              onChange={(e) => setScriptAuthor(e.target.value)}
                              placeholder="Author name"
                              disabled={uploading}
                            />
                          </div>
                        </div>
                      )}

                      <div className="form-group">
                        <label>{isInterpEvent ? 'Script/Cutting' : 'Script/Speech Text'}</label>
                        <textarea
                          value={script}
                          onChange={(e) => setScript(e.target.value)}
                          placeholder={isInterpEvent
                            ? "Paste your cutting or script here..."
                            : "Paste your speech text here. Leave empty for auto-transcription."
                          }
                          rows={8}
                          disabled={uploading}
                          className="script-textarea"
                        />
                        <span className="field-hint">
                          {script.length > 0
                            ? `${script.split(/\s+/).filter(w => w).length} words`
                            : 'Auto-transcript will be generated if empty'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="preview-section">
                <div className="thumbnail-upload" onClick={() => !uploading && thumbnailInputRef.current?.click()}>
                  <input
                    type="file"
                    ref={thumbnailInputRef}
                    onChange={handleThumbnailSelect}
                    accept="image/*"
                    hidden
                  />
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} alt="Thumbnail preview" />
                  ) : (
                    <div className="thumbnail-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <span>Add Thumbnail</span>
                    </div>
                  )}
                </div>

                <div className="file-info">
                  <div className="file-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </div>
                  <div className="file-details">
                    <span className="file-name">{videoFile?.name}</span>
                    <span className="file-size">{(videoFile?.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                </div>

                <div className="upload-tips">
                  <h4>Tips</h4>
                  <ul>
                    <li>Add a script to make your speech searchable by content</li>
                    <li>Videos under 25MB can be auto-transcribed</li>
                    <li>Custom thumbnails get more views</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="upload-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setStep(1);
                  setVideoFile(null);
                  setThumbnailFile(null);
                  setThumbnailPreview(null);
                  setTitle('');
                  setDescription('');
                  setEventType('other');
                  setRoundType('practice');
                  setTournament('');
                  setTopic('');
                  setSide('');
                  setScript('');
                  setScriptTitle('');
                  setScriptAuthor('');
                  setShowScriptSection(false);
                }}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                className="publish-btn"
                onClick={handleUpload}
                disabled={uploading || !title.trim()}
              >
                {uploading ? 'Uploading...' : 'Publish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Upload;
