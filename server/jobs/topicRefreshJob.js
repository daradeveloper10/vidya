const cron = require('node-cron');
const TrendingTopic = require('../models/TrendingTopic');
const { fetchTrendingEducationalTopics } = require('../utils/youtubeFetcher');

const CRON_SCHEDULE = '0 2 * * 0';

async function refreshTrendingTopics() {
  console.log('[Cron] Starting weekly trending topics refresh...');
  try {
    const freshTopics = await fetchTrendingEducationalTopics();

    if (!freshTopics || freshTopics.length === 0) {
      console.warn('[Cron] No topics returned from YouTube API — keeping existing topics.');
      return;
    }

    await TrendingTopic.deleteMany({});
    await TrendingTopic.insertMany(freshTopics);

    console.log(`[Cron] Refreshed ${freshTopics.length} trending topics successfully.`);
  } catch (err) {
    console.error('[Cron] Failed to refresh trending topics:', err.message);
  }
}

function startTopicRefreshJob() {
  refreshTrendingTopics();

  cron.schedule(CRON_SCHEDULE, refreshTrendingTopics, {
    timezone: 'UTC',
  });

  console.log(`[Cron] Weekly topic refresh scheduled (${CRON_SCHEDULE} UTC).`);
}

module.exports = { startTopicRefreshJob, refreshTrendingTopics };
