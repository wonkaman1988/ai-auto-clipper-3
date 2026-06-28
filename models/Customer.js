const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  plan: String,
  status: String,
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models?.Customer || mongoose.model('Customer', CustomerSchema);
