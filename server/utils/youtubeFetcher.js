const axios = require('axios');

const EDUCATIONAL_CATEGORY_IDS = ['27', '28'];

function getRandomPrompt(topic) {
  return topic;
}

function extractTopicFromTitle(title) {
  return title
    .replace(/\b(tutorial|course|explained|introduction|intro|beginners?|guide|full|complete|crash course|masterclass|learn|learning|how to|what is|basics?|fundamentals?|overview|deep dive|\d{4}|\|\s*.*)/gi, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function filterAndCleanTopics(topics) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const topicList = topics.map((t, i) => `${i}: ${t.topic}`).join('\n');

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are filtering and cleaning a list of topics extracted from YouTube video titles for a self-learning app.

Remove any topic that is:
- A clickbait headline or viral story
- A product name, gadget, or consumer item
- A celebrity name or personal story
- A news event or meme
- Nonsensical or too vague to be a real subject
- Not something a person would genuinely study

Keep only real learnable subjects — academic disciplines, sciences, technologies, professional skills, historical movements, or concepts with genuine educational depth.

For every topic you keep, clean the text into a short, clear 2-5 word subject name. Remove YouTube noise, fix capitalisation. Examples: "3D Printing", "Quantum Computing", "The Roman Empire", "Personal Finance", "Machine Learning".

Here are the topics:
${topicList}

Reply with ONLY a JSON array like this:
[{"index": 0, "cleanTopic": "Machine Learning"}, {"index": 3, "cleanTopic": "Quantum Physics"}]

No explanation, just the JSON array.`
      }
    ]
  });

  try {
    let text = response.content[0].text.trim();
    // Remove markdown code fences if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const kept = JSON.parse(text);
    return kept.map(({ index, cleanTopic }) => ({
      ...topics[index],
      topic: cleanTopic,
      promptPhrasing: cleanTopic,
    }));
  } catch (err) {
    console.error('[YouTube] Failed to parse AI filter response:', err.message);
    return topics;
  }
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

  const cleaned = await filterAndCleanTopics(unique);
  return cleaned;
}

module.exports = { fetchTrendingEducationalTopics, getRandomPrompt };
