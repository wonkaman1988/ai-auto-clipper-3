const express = require('express');
const router = express.Router();

let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('STRIPE_SECRET_KEY not set — payments disabled');
}

// POST /api/payments/create-checkout-session
// Body: { priceId, mode = 'subscription' }
router.post('/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(400).json({ error: 'Stripe not configured' });

  try {
    const { priceId, mode = 'subscription' } = req.body;
    if (!priceId) return res.status(400).json({ error: 'priceId required' });

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: (process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/success') + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/cancel',
      // optional: add metadata: metadata: { userId: req.body.userId }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error', err);
    res.status(500).json({ error: 'internal' });
  }
});

module.exports = router;
