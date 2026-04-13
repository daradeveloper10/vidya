const mongoose = require('mongoose');

const TrendingTopicSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    trim: true,
  },
  promptPhrasing: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    default: 'youtube',
  },
  category: {
    type: String,
    default: 'general',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('TrendingTopic', TrendingTopicSchema);
