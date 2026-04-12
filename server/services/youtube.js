const axios = require('axios');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Search YouTube for videos matching a query
 * @param {string} query - Search query
 * @param {number} maxResults - Number of results to return (default 10)
 * @returns {Promise<Array>} Array of video objects
 */
async function searchVideos(query, maxResults = 10) {
  try {
    if (!YOUTUBE_API_KEY) {
      console.error('❌ YOUTUBE_API_KEY not found in environment variables');
      return [];
    }

    console.log('🔍 Searching YouTube for:', query);

    // Search for videos
    const searchResponse = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        key: YOUTUBE_API_KEY,
        q: query,
        part: 'snippet',
        type: 'video',
        maxResults: maxResults,
        order: 'relevance',
        videoEmbeddable: 'true',
        videoSyndicated: 'true'
      }
    });

    const videos = searchResponse.data.items;

    if (!videos || videos.length === 0) {
      console.log('⚠️ No videos found for query:', query);
      return [];
    }

    // Get video IDs for additional details
    const videoIds = videos.map(v => v.id.videoId).join(',');

    // Fetch video statistics and content details
    const detailsResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        key: YOUTUBE_API_KEY,
        id: videoIds,
        part: 'statistics,contentDetails'
      }
    });

    const videoDetails = detailsResponse.data.items;

    // Combine search results with details
    const enrichedVideos = videos.map(video => {
      const details = videoDetails.find(d => d.id === video.id.videoId);
      
      return {
        videoId: video.id.videoId,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
        description: video.snippet.description,
        thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url,
        publishedAt: video.snippet.publishedAt,
        viewCount: details?.statistics?.viewCount || '0',
        duration: details?.contentDetails?.duration || 'PT0S'
      };
    });

    console.log(`✅ Found ${enrichedVideos.length} videos for query: ${query}`);
    return enrichedVideos;

  } catch (error) {
    console.error('❌ Error searching YouTube:', error.message);
    if (error.response) {
      console.error('YouTube API Error:', error.response.data);
    }
    return [];
  }
}

/**
 * Parse ISO 8601 duration to human-readable format
 * @param {string} duration - ISO 8601 duration (e.g., PT15M33S)
 * @returns {string} Human-readable duration (e.g., "15:33")
 */
function parseDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

module.exports = {
  searchVideos,
  parseDuration
};
