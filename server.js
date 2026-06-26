const express = require('express');
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const cors = require('cors');
const axios = require('axios');

require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-clipper', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  plan: { type: String, default: 'free' }, // free, starter, pro, agency
  stripeCustomerId: String,
  credits: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const clipSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  videoUrl: String,
  duration: Number,
  sourceVideo: String,
  status: { type: String, default: 'processing' }, // processing, ready, failed
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Clip = mongoose.model('Clip', clipSchema);

// Email Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret');
    res.json({ token, user: { id: user._id, name, email } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const validPassword = await bcryptjs.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret');
    res.json({ token, user: { id: user._id, name: user.name, email, plan: user.plan } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Payment Route
app.post('/api/payment/create-checkout', async (req, res) => {
  try {
    const { plan, userId } = req.body;
    const prices = { starter: 900, pro: 4900, agency: 19900 };
    const user = await User.findById(userId);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `${plan.toUpperCase()} Plan` },
            unit_amount: prices[plan],
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      customer_email: user.email,
    });

    res.json({ sessionId: session.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Webhook Handler
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const user = await User.findOne({ email: session.customer_email });
      if (user) {
        user.plan = session.metadata?.plan || 'starter';
        user.stripeCustomerId = session.customer;
        await user.save();

        // Send confirmation email
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: 'Welcome to AI Auto-Clipper!',
          html: `<h1>Welcome ${user.name}!</h1><p>Your ${user.plan} plan is now active.</p>`,
        });
      }
    }
    res.json({ received: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get Clips
app.get('/api/clips/:userId', async (req, res) => {
  try {
    const clips = await Clip.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(clips);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create Clip (Mock)
app.post('/api/clips/create', async (req, res) => {
  try {
    const { userId, title, sourceVideo } = req.body;
    const clip = new Clip({ userId, title, sourceVideo, status: 'processing' });
    await clip.save();
    res.json(clip);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Daily Automation (6 AM)
cron.schedule('0 6 * * *', async () => {
  console.log('Running daily clip automation...');
  // TODO: Fetch trending videos from YouTube API
  // TODO: Process videos with FFmpeg
  // TODO: Create clips and save to database
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
