const express = require('express');
const { User, Video } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Advocacy topic keywords for matching
const ADVOCACY_KEYWORDS = {
  'climate': ['climate', 'environment', 'carbon', 'renewable', 'sustainability', 'pollution', 'green', 'emissions', 'fossil fuel', 'global warming'],
  'education': ['education', 'school', 'student', 'teacher', 'learning', 'college', 'university', 'curriculum', 'academic'],
  'civil-rights': ['civil rights', 'equality', 'discrimination', 'freedom', 'rights', 'justice', 'liberty', 'constitutional'],
  'mental-health': ['mental health', 'depression', 'anxiety', 'therapy', 'wellness', 'suicide', 'counseling', 'psychological'],
  'gun-violence': ['gun', 'firearm', 'shooting', 'second amendment', 'gun control', 'gun violence', 'mass shooting'],
  'immigration': ['immigration', 'immigrant', 'border', 'refugee', 'asylum', 'deportation', 'citizenship', 'migrant'],
  'healthcare': ['healthcare', 'health care', 'medical', 'insurance', 'hospital', 'medicine', 'doctor', 'patient', 'affordable care'],
  'poverty': ['poverty', 'homeless', 'hunger', 'welfare', 'low-income', 'food insecurity', 'economic inequality'],
  'democracy': ['democracy', 'voting', 'election', 'ballot', 'voter', 'gerrymandering', 'representation', 'civic'],
  'youth-empowerment': ['youth', 'young people', 'generation', 'student voice', 'teen', 'adolescent', 'young adult'],
  'lgbtq': ['lgbtq', 'gay', 'lesbian', 'transgender', 'queer', 'pride', 'sexual orientation', 'gender identity'],
  'racial-justice': ['racial', 'racism', 'black lives', 'police brutality', 'systemic racism', 'racial justice', 'discrimination'],
  'womens-rights': ['women', 'feminist', 'gender equality', 'reproductive', 'abortion', 'pay gap', 'metoo', 'sexism'],
  'technology': ['technology', 'privacy', 'data', 'surveillance', 'social media', 'artificial intelligence', 'internet', 'digital'],
  'criminal-justice': ['criminal justice', 'prison', 'incarceration', 'police', 'reform', 'bail', 'sentencing', 'rehabilitation']
};

// Get user/channel info
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'username', 'avatar', 'fullName', 'school', 'accountType', 'events', 'bio', 'achievements', 'followers', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get video count
    const videoCount = await Video.count({ where: { userId: user.id, isPublic: true } });

    // Get total views
    const videos = await Video.findAll({
      where: { userId: user.id },
      attributes: ['views']
    });
    const totalViews = videos.reduce((sum, video) => sum + video.views, 0);

    res.json({
      ...user.toJSON(),
      videoCount,
      totalViews
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, fullName, school, role, events, bio, achievements } = req.body;
    const updates = {};

    if (username) {
      // Check if username is taken
      const existingUser = await User.findOne({
        where: { username }
      });
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      updates.username = username;
    }

    if (fullName !== undefined) updates.fullName = fullName;
    if (school !== undefined) updates.school = school;
    if (role !== undefined) updates.role = role;
    if (events !== undefined) updates.events = JSON.stringify(events);
    if (bio !== undefined) updates.bio = bio;
    if (achievements !== undefined) updates.achievements = JSON.stringify(achievements);

    await req.user.update(updates);

    res.json(req.user);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user's videos
router.get('/:id/videos', async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: videos } = await Video.findAndCountAll({
      where: { userId: req.params.id, isPublic: true },
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
    console.error('Error fetching user videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get matches for current user
router.get('/matches/me', auth, async (req, res) => {
  try {
    const user = req.user;
    const matches = [];

    if (user.accountType === 'organizer') {
      // Organizer: find speakers whose content matches their causes
      const userCauses = JSON.parse(user.causes || '[]');

      if (userCauses.length === 0) {
        return res.json({ matches: [], message: 'Set your advocacy focus to see matched speakers' });
      }

      // Get all keywords for the organizer's causes
      const keywords = userCauses.flatMap(cause => ADVOCACY_KEYWORDS[cause] || []);

      // Find videos that match these keywords
      const videos = await Video.findAll({
        where: {
          isPublic: true,
          [Op.or]: keywords.flatMap(keyword => [
            { topic: { [Op.like]: `%${keyword}%` } },
            { transcript: { [Op.like]: `%${keyword}%` } },
            { script: { [Op.like]: `%${keyword}%` } },
            { title: { [Op.like]: `%${keyword}%` } }
          ])
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar', 'school', 'accountType', 'bio']
        }],
        order: [['views', 'DESC']],
        limit: 50
      });

      // Group by user and calculate match score
      const speakerMatches = {};
      for (const video of videos) {
        if (!video.user || video.user.accountType !== 'competitor') continue;

        const userId = video.user.id;
        if (!speakerMatches[userId]) {
          speakerMatches[userId] = {
            user: video.user,
            matchingVideos: [],
            matchedCauses: new Set(),
            totalViews: 0
          };
        }

        // Determine which causes this video matches
        const content = `${video.title} ${video.topic} ${video.transcript} ${video.script}`.toLowerCase();
        for (const cause of userCauses) {
          const causeKeywords = ADVOCACY_KEYWORDS[cause] || [];
          if (causeKeywords.some(kw => content.includes(kw.toLowerCase()))) {
            speakerMatches[userId].matchedCauses.add(cause);
          }
        }

        speakerMatches[userId].matchingVideos.push({
          id: video.id,
          title: video.title,
          topic: video.topic,
          views: video.views,
          thumbnail: video.thumbnail
        });
        speakerMatches[userId].totalViews += video.views;
      }

      // Convert to array and sort by number of matched causes, then by views
      const sortedMatches = Object.values(speakerMatches)
        .map(m => ({
          ...m,
          matchedCauses: Array.from(m.matchedCauses),
          matchScore: m.matchedCauses.size
        }))
        .sort((a, b) => b.matchScore - a.matchScore || b.totalViews - a.totalViews)
        .slice(0, 20);

      return res.json({ matches: sortedMatches, type: 'speakers' });
    }

    if (user.accountType === 'competitor') {
      // Speaker: find organizations whose causes match their video content
      const userVideos = await Video.findAll({
        where: { userId: user.id },
        attributes: ['id', 'title', 'topic', 'transcript', 'script']
      });

      if (userVideos.length === 0) {
        return res.json({ matches: [], message: 'Upload speeches to see matched organizations' });
      }

      // Combine all video content
      const allContent = userVideos.map(v =>
        `${v.title} ${v.topic} ${v.transcript} ${v.script}`
      ).join(' ').toLowerCase();

      // Find which causes the speaker's content matches
      const matchedCauses = [];
      for (const [cause, keywords] of Object.entries(ADVOCACY_KEYWORDS)) {
        if (keywords.some(kw => allContent.includes(kw.toLowerCase()))) {
          matchedCauses.push(cause);
        }
      }

      if (matchedCauses.length === 0) {
        return res.json({ matches: [], message: 'No advocacy topics detected in your speeches yet' });
      }

      // Find organizations with matching causes
      const organizations = await User.findAll({
        where: {
          accountType: 'organizer',
          causes: {
            [Op.or]: matchedCauses.map(cause => ({ [Op.like]: `%${cause}%` }))
          }
        },
        attributes: ['id', 'username', 'avatar', 'organization', 'bio', 'causes', 'location', 'website']
      });

      // Calculate match score for each organization
      const orgMatches = organizations.map(org => {
        const orgCauses = JSON.parse(org.causes || '[]');
        const commonCauses = orgCauses.filter(c => matchedCauses.includes(c));
        return {
          user: org,
          matchedCauses: commonCauses,
          matchScore: commonCauses.length
        };
      }).filter(m => m.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 20);

      return res.json({ matches: orgMatches, type: 'organizations', yourCauses: matchedCauses });
    }

    res.json({ matches: [], message: 'Matching is only available for speakers and organizers' });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

module.exports = router;
