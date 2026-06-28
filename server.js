require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

let mongooseConnected = false;

const app = express();
app.use(cors());

// NOTE: Register webhook route that requires the raw body BEFORE any JSON parser is applied.
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('Stripe or webhook secret not configured; ignoring webhook');
    return res.status(400).send('webhook not configured');
  }
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('checkout.session.completed', session.id);
        // Optionally: retrieve session: await stripe.checkout.sessions.retrieve(session.id)
        // Persist data to DB if you store customers/subscriptions
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('invoice.payment_succeeded for subscription', invoice.subscription);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }

  res.json({ received: true });
});

// After webhook route, apply JSON parser to handle normal API routes
app.use(bodyParser.json());
app.use(express.json()); // safe to keep (bodyParser.json already used)

let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('Stripe initialized');
  }
} catch (e) {
  console.log('Stripe not initialized yet');
}

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

// Mount payments router (uses JSON body parser)
try {
  const paymentsRouter = require('./routes/payments');
  app.use('/api/payments', paymentsRouter);
} catch (e) {
  console.log('Payments router not loaded (OK if Stripe not configured):', e.message);
}

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
