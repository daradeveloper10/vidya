const axios = require('axios');

const EDUCATIONAL_CATEGORY_IDS = ['27', '28'];

const PROMPT_TEMPLATES = [
  (topic) => `Teach me the basics of ${topic}`,
  (topic) => `How does ${topic} work?`,
  (topic) => `Give me a beginner's guide to ${topic}`,
  (topic) => `What should I know about ${topic}?`,
  (topic) => `Help me understand ${topic}`,
  (topic) => `Break down ${topic} for me`,
  (topic) => `Explain ${topic} like I'm new to it`,
  (topic) => `What's the story behind ${topic}?`,
];

function getRandomPrompt(topic) {
  const template = PROMPT_TEMPLATES[Math.floor(Math.random() * PROMPT_TEMPLATES.length)];
  return template(topic);
}

function extractTopicFromTitle(title) {
  return title
    .replace(/\b(tutorial|course|explained|introduction|intro|beginners?|guide|full|complete|crash course|masterclass|learn|learning|how to|what is|basics?|fundamentals?|overview|deep dive|\d{4}|\|\s*.*)/gi, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function fetchTrendingEducationalTopics() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY not set in environment');
  }

  const topics = [];

  for (const categoryId of EDUCATIONAL_CATEGORY_IDS) {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'snippet',
          chart: 'mostPopular',
          regionCode: 'US',
          videoCategoryId: categoryId,
          maxResults: 20,
          key: apiKey,
        },
      });

      const videos = response.data.items || [];

      for (const video of videos) {
        const rawTopic = extractTopicFromTitle(video.snippet?.title || '');
        if (rawTopic && rawTopic.length > 3 && rawTopic.length < 80) {
          topics.push({
            topic: rawTopic,
            promptPhrasing: getRandomPrompt(rawTopic),
            source: 'youtube',
            category: categoryId === '27' ? 'education' : 'science_tech',
          });
        }
      }
    } catch (err) {
      console.error(`[YouTube] Error fetching category ${categoryId}:`, err.message);
    }
  }

  const seen = new Set();
  const unique = topics.filter((t) => {
    const key = t.topic.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique;
}

module.exports = { fetchTrendingEducationalTopics, getRandomPrompt };
