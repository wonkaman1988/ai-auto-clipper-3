const mongoose = require('mongoose');

const ClipSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String, required: true },
  duration: { type: Number, required: true },
  status: { type: String, enum: ['ready', 'processing'], default: 'processing' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models?.Clip || mongoose.model('Clip', ClipSchema);
