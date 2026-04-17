const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const UserGeneratedPath = require('../models/UserGeneratedPath');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function durationToHours(duration) {
  if (duration === '10min') return 0.17;
  if (duration === '30min') return 0.5;
  if (duration === '2hrs') return 2;
  if (duration === '5hrs') return 5;
  if (duration === '10hrs') return 10;
  if (duration === '20hrs') return 20;
  if (duration === '30hrs') return 30;
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[1]) : 2;
}

// POST /api/user-paths/generate-suggestions
router.post('/generate-suggestions', isAuthenticated, async (req, res) => {
  try {
    const { topic, duration, clarificationAnswers } = req.body;

    if (!topic || !duration) {
      return res.status(400).json({ error: 'Topic and duration are required' });
    }

    const startingHours = durationToHours(duration);
    const remainingBudget = Math.max(0, 10 - startingHours);
    const minimumAdditional = Math.max(0, 5 - startingHours);

    const context = clarificationAnswers?.length > 0
      ? `User context: ${clarificationAnswers.join(', ')}`
      : '';

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `A user wants to learn about "${topic}" with a ${duration} curriculum. ${context}

Generate a suggested learning path for them. The path should:
- Start with "${topic}" as the first curriculum (already selected, ${duration})
- Include 3-5 follow-on topics in logical learning progression order
- Each follow-on topic should build naturally on the previous
- Total additional duration should be between ${minimumAdditional} and ${remainingBudget} additional hours
- Each follow-on topic duration should be 2hrs or 5hrs only
- Total path duration including the starting topic must not exceed 10hrs

Also generate:
- A compelling path name (4-6 words)
- A one sentence path description

Respond ONLY with this JSON, no explanation, no markdown fences:
{
  "pathName": "string",
  "pathDescription": "string",
  "suggestions": [
    {
      "topic": "string",
      "title": "string",
      "description": "string",
      "duration": "2hrs or 5hrs",
      "order": number starting from 1
    }
  ]
}`
      }]
    });

    let text = message.content[0].text.trim();
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(text);

    res.json({
      pathName: result.pathName,
      pathDescription: result.pathDescription,
      startingCurriculum: { topic, duration, order: 0 },
      suggestions: result.suggestions,
    });
  } catch (err) {
    console.error('[/generate-suggestions] Error:', err.message);
    res.status(500).json({ error: 'Failed to generate path suggestions' });
  }
});

// POST /api/user-paths/check-related
// IMPORTANT: must be defined BEFORE /:pathId routes to avoid route conflicts
router.post('/check-related', isAuthenticated, async (req, res) => {
  try {
    const { topic } = req.body;
    const userId = req.user.id;

    const existingPaths = await UserGeneratedPath.find({
      userId,
      status: { $ne: 'completed' }
    }).lean();

    if (existingPaths.length === 0) {
      return res.json({ relatedPath: null });
    }

    const pathSummaries = existingPaths.map((p, i) => ({
      index: i,
      id: p._id,
      name: p.name,
      topics: p.curricula.map(c => c.topic).join(', ')
    }));

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `A user wants to learn about "${topic}".

They have these existing learning paths:
${pathSummaries.map(p => `${p.index}: "${p.name}" — covers: ${p.topics}`).join('\n')}

Is any of these paths closely related to "${topic}" such that it would make sense to add "${topic}" to that path instead of creating a new one?

Respond ONLY with JSON, no markdown:
{ "relatedIndex": number or null, "reason": "one sentence or null" }`
      }]
    });

    let text = message.content[0].text.trim();
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(text);

    const relatedPath = result.relatedIndex !== null && existingPaths[result.relatedIndex]
      ? existingPaths[result.relatedIndex]
      : null;

    res.json({
      relatedPath: relatedPath
        ? { _id: relatedPath._id, name: relatedPath.name, reason: result.reason }
        : null
    });
  } catch (err) {
    console.error('[/check-related] Error:', err.message);
    res.json({ relatedPath: null });
  }
});

// POST /api/user-paths/create
router.post('/create', isAuthenticated, async (req, res) => {
  try {
    const { pathName, pathDescription, curricula } = req.body;
    const userId = req.user.id;

    if (!pathName || !curricula || curricula.length === 0) {
      return res.status(400).json({ error: 'Path name and curricula are required' });
    }

    const totalHours = curricula.reduce((sum, c) => sum + durationToHours(c.duration), 0);

    const userPath = await UserGeneratedPath.create({
      userId,
      name: pathName,
      description: pathDescription,
      curricula: curricula.map((c, i) => ({
        topic: c.topic,
        title: c.title || c.topic,
        description: c.description || '',
        duration: c.duration,
        order: i,
        curriculumId: null,
        completed: false,
      })),
      totalDuration: `${totalHours}hrs`,
      status: 'not_started',
      currentCurriculumIndex: 0,
    });

    res.json({ pathId: userPath._id, path: userPath });
  } catch (err) {
    console.error('[/create] Error:', err.message);
    res.status(500).json({ error: 'Failed to create path' });
  }
});

// POST /api/user-paths/:pathId/add-curriculum
router.post('/:pathId/add-curriculum', isAuthenticated, async (req, res) => {
  try {
    const { pathId } = req.params;
    const { curriculumId, order } = req.body;
    const userId = req.user.id;

    const userPath = await UserGeneratedPath.findOne({ _id: pathId, userId });
    if (!userPath) return res.status(404).json({ error: 'Path not found' });

    if (userPath.curricula[order]) {
      userPath.curricula[order].curriculumId = curriculumId;
    }

    if (order === 0) {
      userPath.status = 'in_progress';
    }

    userPath.updatedAt = new Date();
    await userPath.save();

    res.json({ success: true });
  } catch (err) {
    console.error('[/add-curriculum] Error:', err.message);
    res.status(500).json({ error: 'Failed to link curriculum to path' });
  }
});

// GET /api/user-paths
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const paths = await UserGeneratedPath.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();
    res.json(paths);
  } catch (err) {
    console.error('[GET /user-paths] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch paths' });
  }
});

// GET /api/user-paths/:pathId
router.get('/:pathId', isAuthenticated, async (req, res) => {
  try {
    const { pathId } = req.params;
    const userId = req.user.id;

    const userPath = await UserGeneratedPath.findOne({ _id: pathId, userId })
      .populate('curricula.curriculumId')
      .lean();

    if (!userPath) return res.status(404).json({ error: 'Path not found' });

    res.json(userPath);
  } catch (err) {
    console.error('[GET /:pathId] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch path' });
  }
});

// PATCH /api/user-paths/:pathId/progress
router.patch('/:pathId/progress', isAuthenticated, async (req, res) => {
  try {
    const { pathId } = req.params;
    const { currentCurriculumIndex, completedIndex } = req.body;
    const userId = req.user.id;

    const userPath = await UserGeneratedPath.findOne({ _id: pathId, userId });
    if (!userPath) return res.status(404).json({ error: 'Path not found' });

    if (completedIndex !== undefined && userPath.curricula[completedIndex]) {
      userPath.curricula[completedIndex].completed = true;
    }

    if (currentCurriculumIndex !== undefined) {
      userPath.currentCurriculumIndex = currentCurriculumIndex;
    }

    const allCompleted = userPath.curricula.every(c => c.completed);
    userPath.status = allCompleted ? 'completed' : 'in_progress';
    userPath.updatedAt = new Date();
    await userPath.save();

    res.json({ success: true, path: userPath });
  } catch (err) {
    console.error('[PATCH /progress] Error:', err.message);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// POST /api/user-paths/:pathId/add-topic
router.post('/:pathId/add-topic', isAuthenticated, async (req, res) => {
  try {
    const { pathId } = req.params;
    const { topic, duration } = req.body;
    const userId = req.user.id;

    const userPath = await UserGeneratedPath.findOne({ _id: pathId, userId });
    if (!userPath) return res.status(404).json({ error: 'Path not found' });

    userPath.curricula.push({
      topic,
      title: topic,
      description: '',
      duration,
      order: userPath.curricula.length,
      curriculumId: null,
      completed: false,
    });

    const totalHours = userPath.curricula.reduce((sum, c) => sum + durationToHours(c.duration), 0);
    userPath.totalDuration = `${totalHours}hrs`;
    userPath.updatedAt = new Date();
    await userPath.save();

    res.json({ success: true, path: userPath });
  } catch (err) {
    console.error('[/add-topic] Error:', err.message);
    res.status(500).json({ error: 'Failed to add topic' });
  }
});

module.exports = router;