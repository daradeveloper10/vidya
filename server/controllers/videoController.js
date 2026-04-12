const Anthropic = require('@anthropic-ai/sdk');
const { searchVideos, parseDuration } = require('../services/youtube');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Search and score videos for a module
exports.searchVideo = async (req, res) => {
  try {
    const { moduleTitle, curriculumTopic, moduleDescription } = req.body;

    if (!moduleTitle || !curriculumTopic) {
      return res.status(400).json({ error: 'Module title and curriculum topic are required' });
    }

    console.log('🎥 Searching video for:', moduleTitle);

    // Step 1: Generate precise search query with Claude
    const queryMessage = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Generate a precise YouTube search query for finding educational videos about this topic:

Module: ${moduleTitle}
Curriculum: ${curriculumTopic}
${moduleDescription ? `Description: ${moduleDescription}` : ''}

Create a search query that will find high-quality educational videos. Focus on the core concept.
Respond with ONLY the search query, no other text.`
      }]
    });

    const searchQuery = queryMessage.content[0].text.trim();
    console.log('🔍 Generated search query:', searchQuery);

    // Step 2: Fetch top 10 videos from YouTube
    const videos = await searchVideos(searchQuery, 10);

    if (!videos || videos.length === 0) {
      console.log('⚠️ No videos found');
      return res.json({ video: null });
    }

    // Step 3: Ask Claude to score and pick the best video
    const videoList = videos.map((v, i) => `
${i + 1}. Title: ${v.title}
   Channel: ${v.channelTitle}
   Duration: ${parseDuration(v.duration)}
   Views: ${parseInt(v.viewCount).toLocaleString()}
   Published: ${new Date(v.publishedAt).toLocaleDateString()}
   Description: ${v.description.substring(0, 200)}...
   VideoID: ${v.videoId}
`).join('\n');

    const scoringMessage = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are selecting the best educational video for a learning module.

Module: ${moduleTitle}
Curriculum: ${curriculumTopic}

Here are 10 YouTube videos to choose from:
${videoList}

Evaluate each video based on:
1. Content-topic alignment (most important) - Does it directly teach this concept?
2. Channel credibility - Is it from a known educational source?
3. Duration fit - Is it appropriate length (5-20 min ideal)?
4. Recency - Is it recent enough for fast-moving topics?

Pick the BEST video and respond with a JSON object:
{
  "videoId": "the video ID of the best video",
  "contextLine": "A one-sentence explanation of what the learner should watch for in this video. Be specific about the key concept or technique covered."
}

If NONE of the videos are good enough (off-topic, poor quality, wrong level), respond with:
{
  "videoId": null,
  "contextLine": null
}

Respond ONLY with the JSON object, no other text.`
      }]
    });

    const scoringResult = JSON.parse(scoringMessage.content[0].text.trim());

    if (!scoringResult.videoId) {
      console.log('⚠️ Claude determined no suitable video found');
      return res.json({ video: null });
    }

    // Find the selected video
    const selectedVideo = videos.find(v => v.videoId === scoringResult.videoId);

    if (!selectedVideo) {
      console.log('⚠️ Selected video not found in results');
      return res.json({ video: null });
    }

    console.log('✅ Selected video:', selectedVideo.title);

    res.json({
      video: {
        videoId: selectedVideo.videoId,
        title: selectedVideo.title,
        channelTitle: selectedVideo.channelTitle,
        thumbnailUrl: selectedVideo.thumbnailUrl,
        duration: parseDuration(selectedVideo.duration),
        contextLine: scoringResult.contextLine
      }
    });

  } catch (error) {
    console.error('❌ Error searching video:', error);
    res.status(500).json({ 
      error: 'Failed to search video',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
