require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
let mongooseConnected = false;

// Safe Stripe init (keeps original behavior)
let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('Stripe initialized');
  }
} catch (e) {
  console.log('Stripe not initialized yet');
}

const app = express();
app.use(cors());
app.use(express.json());

// Optional MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || '';
if (MONGODB_URI) {
  const mongoose = require('mongoose');
  mongoose
    .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      mongooseConnected = true;
      console.log('Connected to MongoDB');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err.message);
    });
}

// Seeded sample clips (used when no DB is connected)
const sampleClips = [
  {
    _id: 'clip1',
    userId: 'demo-user',
    title: 'Amazing Hook - 00:12',
    description: 'Short viral moment extracted from original video',
    videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    duration: 12,
    status: 'ready',
    createdAt: new Date(),
  },
  {
    _id: 'clip2',
    userId: 'demo-user',
    title: 'Laugh Out Loud - 00:08',
    description: 'Funny short clip',
    videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    duration: 8,
    status: 'processing',
    createdAt: new Date(),
  },
];

// Mount API routes
const clipsRouter = require('./routes/clips');
app.use('/api/clips', clipsRouter({ sampleClips, mongooseConnected }));

// Serve static files (built client will go into /public)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve the marketing page (index.html is at repo root)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Schedule cron jobs (seeded / placeholder)
try {
  const { scheduleJobs } = require('./cron');
  scheduleJobs({ sampleClips });
} catch (e) {
  console.log('No cron configured:', e.message);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
