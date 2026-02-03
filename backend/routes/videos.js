const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Video, User, Comment, Like } = require('../models');
const { auth, optionalAuth } = require('../middleware/auth');
const { Op } = require('sequelize');
const transcriptionService = require('../services/transcription');

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'videos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|webm|ogg|mov|avi|mkv|m4v/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream';

    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only video files are allowed'));
  }
});

// Configure multer for thumbnail uploads
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'thumbnails');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const uploadThumbnail = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('image/');

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed for thumbnails'));
  }
});

// Get event types and round types
router.get('/types', (req, res) => {
  res.json({
    eventTypes: Video.EVENT_TYPES,
    roundTypes: Video.ROUND_TYPES
  });
});

// Get all videos (with search and pagination)
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 12, userId, eventType } = req.query;
    const offset = (page - 1) * limit;

    const where = { isPublic: true };
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { topic: { [Op.like]: `%${search}%` } },
        { tournament: { [Op.like]: `%${search}%` } },
        { script: { [Op.like]: `%${search}%` } },
        { scriptTitle: { [Op.like]: `%${search}%` } },
        { scriptAuthor: { [Op.like]: `%${search}%` } },
        { transcript: { [Op.like]: `%${search}%` } }
      ];
    }
    if (userId) {
      where.userId = userId;
    }
    if (eventType) {
      where.eventType = eventType;
    }

    const { count, rows: videos } = await Video.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar', 'school', 'accountType']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      videos,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalVideos: count
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get single video
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar', 'accountType', 'school', 'organization', 'bio']
        },
        {
          model: Comment,
          as: 'comments',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'avatar']
          }],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check if current user has liked the video
    let userLiked = false;
    if (req.user) {
      const like = await Like.findOne({
        where: { userId: req.user.id, videoId: video.id }
      });
      userLiked = !!like;
    }

    // Increment views
    await video.increment('views');

    const videoData = video.toJSON();
    res.json({ ...videoData, likes: videoData.likesCount, userLiked });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// Stream video
router.get('/:id/stream', async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const videoPath = path.join(__dirname, '..', 'uploads', 'videos', video.filename);

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4'
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4'
      };

      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    res.status(500).json({ error: 'Failed to stream video' });
  }
});

// Upload video
router.post('/', auth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const {
      title, description, eventType, roundType, tournament, topic, side, tags,
      script, scriptTitle, scriptAuthor
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Determine if we need to auto-transcribe (no script provided)
    const hasScript = script && script.trim().length > 0;

    const video = await Video.create({
      title,
      description: description || '',
      filename: req.file.filename,
      userId: req.user.id,
      eventType: eventType || 'other',
      roundType: roundType || 'practice',
      tournament: tournament || '',
      topic: topic || '',
      side: side || '',
      tags: tags || '[]',
      script: script || '',
      scriptTitle: scriptTitle || '',
      scriptAuthor: scriptAuthor || '',
      transcriptStatus: hasScript ? 'completed' : 'pending'
    });

    // If no script provided, trigger automatic transcription in background
    if (!hasScript) {
      const videoPath = path.join(__dirname, '..', 'uploads', 'videos', req.file.filename);
      // Run transcription in background (don't await)
      transcriptionService.processVideoTranscription(video, videoPath).catch(err => {
        console.error('Background transcription error:', err);
      });
    }

    const videoWithUser = await Video.findByPk(video.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar', 'school', 'accountType']
      }]
    });

    res.status(201).json(videoWithUser);
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Upload thumbnail for video
router.post('/:id/thumbnail', auth, uploadThumbnail.single('thumbnail'), async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No thumbnail file uploaded' });
    }

    // Delete old thumbnail if exists
    if (video.thumbnail) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'thumbnails', video.thumbnail);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    video.thumbnail = req.file.filename;
    await video.save();

    res.json(video);
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    res.status(500).json({ error: 'Failed to upload thumbnail' });
  }
});

// Like/Unlike video
router.post('/:id/like', auth, async (req, res) => {
  try {
    // Check if user can like (not a guest)
    if (req.user.accountType === 'guest') {
      return res.status(403).json({ error: 'Guests cannot like videos. Upgrade your account to interact.' });
    }

    const video = await Video.findByPk(req.params.id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const existingLike = await Like.findOne({
      where: { userId: req.user.id, videoId: video.id }
    });

    if (existingLike) {
      // Unlike
      await existingLike.destroy();
      await video.decrement('likesCount');
      res.json({ liked: false, likes: video.likesCount - 1 });
    } else {
      // Like
      await Like.create({
        userId: req.user.id,
        videoId: video.id
      });
      await video.increment('likesCount');
      res.json({ liked: true, likes: video.likesCount + 1 });
    }
  } catch (error) {
    console.error('Error liking video:', error);
    res.status(500).json({ error: 'Failed to like video' });
  }
});

// Add comment
router.post('/:id/comments', auth, async (req, res) => {
  try {
    // Check if user can comment (not a guest)
    if (req.user.accountType === 'guest') {
      return res.status(403).json({ error: 'Guests cannot comment. Upgrade your account to interact.' });
    }

    const video = await Video.findByPk(req.params.id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const comment = await Comment.create({
      content: content.trim(),
      userId: req.user.id,
      videoId: video.id
    });

    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar', 'accountType']
      }]
    });

    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get video comments
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { videoId: req.params.id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar', 'school', 'accountType']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Update video
router.put('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const {
      title, description, eventType, roundType, tournament, topic, side, tags, isPublic,
      script, scriptTitle, scriptAuthor
    } = req.body;

    // Update only provided fields
    if (title !== undefined) video.title = title;
    if (description !== undefined) video.description = description;
    if (eventType !== undefined) video.eventType = eventType;
    if (roundType !== undefined) video.roundType = roundType;
    if (tournament !== undefined) video.tournament = tournament;
    if (topic !== undefined) video.topic = topic;
    if (side !== undefined) video.side = side;
    if (tags !== undefined) video.tags = tags;
    if (isPublic !== undefined) video.isPublic = isPublic;
    if (script !== undefined) video.script = script;
    if (scriptTitle !== undefined) video.scriptTitle = scriptTitle;
    if (scriptAuthor !== undefined) video.scriptAuthor = scriptAuthor;

    await video.save();

    const updatedVideo = await Video.findByPk(video.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar', 'school', 'accountType']
      }]
    });

    res.json(updatedVideo);
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// Trigger transcription for a video
router.post('/:id/transcribe', auth, async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check if already has a script
    if (video.script && video.script.trim().length > 0) {
      return res.status(400).json({ error: 'Video already has a script. Clear the script first to generate a transcript.' });
    }

    // Check transcription status
    if (video.transcriptStatus === 'processing') {
      return res.status(400).json({ error: 'Transcription already in progress' });
    }

    // Trigger transcription
    const videoPath = path.join(__dirname, '..', 'uploads', 'videos', video.filename);
    transcriptionService.processVideoTranscription(video, videoPath).catch(err => {
      console.error('Background transcription error:', err);
    });

    res.json({ message: 'Transcription started', status: 'processing' });
  } catch (error) {
    console.error('Error triggering transcription:', error);
    res.status(500).json({ error: 'Failed to start transcription' });
  }
});

// Delete video
router.delete('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete video file
    const videoPath = path.join(__dirname, '..', 'uploads', 'videos', video.filename);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    // Delete thumbnail if exists
    if (video.thumbnail) {
      const thumbnailPath = path.join(__dirname, '..', 'uploads', 'thumbnails', video.thumbnail);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }

    // Delete associated comments and likes
    await Comment.destroy({ where: { videoId: video.id } });
    await Like.destroy({ where: { videoId: video.id } });

    await video.destroy();

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

module.exports = router;
