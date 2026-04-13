const express = require('express');
const router = express.Router();
const TrendingTopic = require('../models/TrendingTopic');
const Curriculum = require('../models/Curriculum');
const authMiddleware = require('../middleware/auth');
const { getRandomPrompt } = require('../utils/youtubeFetcher');

const FALLBACK_TOPICS = [
  { topic: 'Machine Learning', promptPhrasing: 'Teach me the basics of Machine Learning' },
  { topic: 'Quantum Computing', promptPhrasing: 'How does Quantum Computing work?' },
  { topic: 'Blockchain Technology', promptPhrasing: 'Break down Blockchain Technology for me' },
  { topic: 'Climate Science', promptPhrasing: 'Help me understand Climate Science' },
  { topic: 'Neuroscience', promptPhrasing: "Give me a beginner's guide to Neuroscience" },
  { topic: 'Cryptography', promptPhrasing: "Explain Cryptography like I'm new to it" },
  { topic: 'The Solar System', promptPhrasing: 'What should I know about The Solar System?' },
  { topic: 'Human Psychology', promptPhrasing: "What's the story behind Human Psychology?" },
  { topic: 'Artificial Intelligence', promptPhrasing: 'Teach me the basics of Artificial Intelligence' },
  { topic: 'Personal Finance', promptPhrasing: 'Break down Personal Finance for me' },
];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

router.get('/spark', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const existingCurricula = await Curriculum.find({ userId }).select('title topic').lean();
    const userTopics = new Set(
      existingCurricula.map((c) => (c.topic || c.title || '').toLowerCase().trim())
    );

    const allTopics = await TrendingTopic.find({}).lean();
    let pool = allTopics.length > 0 ? allTopics : FALLBACK_TOPICS;

    const filtered = pool.filter((t) => {
      const topicLower = t.topic.toLowerCase();
      for (const userTopic of userTopics) {
        if (userTopic.includes(topicLower) || topicLower.includes(userTopic)) {
          return false;
        }
      }
      return true;
    });

    const finalPool = filtered.length >= 6 ? filtered : pool;
    const selected = shuffle(finalPool).slice(0, 6);

    const cards = selected.map((t) => ({
      topic: t.topic,
      promptPhrasing: getRandomPrompt(t.topic),
      source: t.source || 'fallback',
    }));

    res.json({ success: true, topics: cards });
  } catch (err) {
    console.error('[/api/topics/spark] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch spark topics' });
  }
});

module.exports = router;
