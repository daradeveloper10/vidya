const express = require('express');
const router = express.Router();
const curriculumController = require('../controllers/curriculumController');
const { isAuthenticated } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ips[0] || req.ip,
  message: { error: 'You have reached the limit for AI requests. Please try again in an hour.' }
});

// Analyse topic for clarity
router.post('/analyse', isAuthenticated, aiLimiter, curriculumController.analyse);

// Validate clarification answers
router.post('/validate-answers', isAuthenticated, async (req, res) => {
  try {
    const { topic, questions, clarificationAnswers } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const formattedQA = questions.map((q, i) =>
      `Q: ${q}\nA: ${clarificationAnswers[i] || 'No answer'}`
    ).join('\n\n');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `A student wants to learn about: <user_topic>${topic}</user_topic>

They were asked clarifying questions and gave these answers:
<qa_context>${formattedQA}</qa_context>

Your job is to decide if these answers are specific enough to generate a high quality, personalised curriculum.

Rules:
- If the answers give enough context to generate a focused, relevant curriculum → respond with { "sufficient": true }
- Only ask a follow-up if the answers are so vague that generating a quality curriculum would be impossible or would require too many assumptions
- If in doubt, proceed — do not over-question the user
- Keep any follow-up question short, friendly and specific to what is still unclear
- Never ask more than one follow-up question at a time
- Aim to proceed after the first round in most cases

Respond ONLY with this JSON, no other text:
{
  "sufficient": true | false,
  "followUpQuestion": "string (only if sufficient is false)"
}`
      }]
    });

    let cleanJson = message.content[0].text.trim();
    cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleanJson);

    res.json(result);
  } catch (err) {
    console.error('[validate-answers] Error:', err.message);
    // On error, always proceed — never block the user
    res.json({ sufficient: true });
  }
});

// Generate curriculum
router.post('/generate', isAuthenticated, aiLimiter, curriculumController.generate);

// Get all curricula for user
router.get('/user/all', isAuthenticated, curriculumController.getUserCurricula);

// Get single curriculum by ID
router.get('/:id', isAuthenticated, curriculumController.getCurriculumById);

// Get further learning recommendations
router.post('/:id/furtherlearning', isAuthenticated, curriculumController.getFurtherLearning);

// Mark curriculum as complete
router.patch('/:id/complete', isAuthenticated, curriculumController.completeCurriculum);

// Delete curriculum by ID
router.delete('/:id', isAuthenticated, curriculumController.deleteCurriculum);

router.post('/:curriculumId/module-outcomes', isAuthenticated, async (req, res) => {
  try {
    const { curriculumId } = req.params;
    const { moduleIndex } = req.body;
    const userId = req.user.id;
    const Curriculum = require('../models/Curriculum');
    const Anthropic = require('@anthropic-ai/sdk');
    const mongoose = require('mongoose');

    if (!mongoose.Types.ObjectId.isValid(curriculumId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    if (moduleIndex === undefined || moduleIndex === null) {
      return res.status(400).json({ error: 'moduleIndex is required' });
    }

    const curriculum = await Curriculum.findOne({ _id: curriculumId, userId });
    if (!curriculum) return res.status(404).json({ error: 'Curriculum not found' });

    const module = curriculum.modules[moduleIndex];
    if (!module) return res.status(404).json({ error: 'Module not found' });

    // Return cached outcomes if they exist
    if (module.outcomes && module.outcomes.length > 0) {
      return res.json({ outcomes: module.outcomes, cached: true });
    }

    // Generate outcomes with Claude
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Generate exactly 4 concise learning outcomes for this module.

Course: <course_topic>${curriculum.topic}</course_topic>
Module: <module_title>${module.title}</module_title>
Description: <module_description>${module.description}</module_description>
${module.content ? `Content preview: <content>${module.content.slice(0, 500)}</content>` : ''}

Each outcome must:
- Start with an action verb (Understand, Apply, Identify, Explain, Build, Analyse, Recognise, Evaluate)
- Be specific to this module
- Be one sentence maximum

Respond ONLY with a JSON array of exactly 4 strings, no markdown fences, no explanation:
["outcome 1", "outcome 2", "outcome 3", "outcome 4"]`
      }]
    });

    let text = message.content[0].text.trim();
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const outcomes = JSON.parse(text);

    // Save outcomes to MongoDB efficiently — only update this module's outcomes field
    await Curriculum.updateOne(
      { _id: curriculumId },
      { $set: { [`modules.${moduleIndex}.outcomes`]: outcomes } }
    );

    res.json({ outcomes });
  } catch (err) {
    console.error('[module-outcomes] Error:', err.message);
    res.status(500).json({ error: 'Failed to generate outcomes' });
  }
});

module.exports = router;
