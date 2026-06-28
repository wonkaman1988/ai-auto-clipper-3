const express = require('express');

module.exports = function initRoutes({ sampleClips, mongooseConnected }) {
  const router = express.Router();

  // GET /api/clips/:userId
  // If a MongoDB connection exists and the Clip model is available, use DB.
  // Otherwise return seeded sample clips filtered by userId.
  router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    if (process.env.MONGODB_URI) {
      try {
        const Clip = require('../models/Clip');
        const clips = await Clip.find({ userId }).sort({ createdAt: -1 }).limit(100).lean();
        return res.json(clips);
      } catch (err) {
        console.error('Error querying DB for clips:', err.message);
        // fallthrough to seeded data
      }
    }

    // Fallback: seeded clips
    const filtered = (sampleClips || []).filter((c) => c.userId === userId);
    // If no clips for the requested user, and userId looks like 'demo-user' or '1', return all seeded clips
    if (filtered.length === 0) {
      return res.json(sampleClips);
    }
    return res.json(filtered);
  });

  return router;
};
