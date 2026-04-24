const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { isAuthenticated } = require('../middleware/auth');
const Anthropic = require('@anthropic-ai/sdk');
const mongoose = require('mongoose');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Generate lesson content for a module
router.post('/:curriculumId/:moduleIndex/lesson', isAuthenticated, moduleController.generateLesson);

// Generate quiz questions for a module
router.post('/:curriculumId/:moduleIndex/quiz', isAuthenticated, moduleController.generateQuiz);

// Submit quiz and save score
router.post('/:curriculumId/:moduleIndex/submit', isAuthenticated, moduleController.submitQuiz);

// Explain a concept differently
router.post('/:curriculumId/:moduleIndex/explain', isAuthenticated, moduleController.explainDifferently);

// Clarify a specific concept after a wrong quiz answer
router.post('/:curriculumId/:moduleIndex/clarify-concept', isAuthenticated, async (req, res) => {
  try {
    const { concept, lessonContent } = req.body;

    if (!concept) {
      return res.status(400).json({ error: 'Concept is required' });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `A student just completed a lesson and got a quiz question wrong about this question: <user_concept>${concept}</user_concept>.

Using the context below, give a clear, focused explanation of the concept being tested in 150-200 words. Use simple language, a concrete example, and make it feel different from the original explanation.

Lesson context:
<lesson_context>${lessonContent?.slice(0, 2000) || ''}</lesson_context>

Respond with just the explanation, no headers or preamble.`
      }]
    });

    res.json({ explanation: message.content[0].text });
  } catch (err) {
    console.error('[clarify-concept] Error:', err.message);
    res.status(500).json({ error: 'Failed to clarify concept' });
  }
});

// Module chat - multi-turn conversation support
router.post('/:curriculumId/:moduleIndex/chat', isAuthenticated, async (req, res) => {
  try {
    const { curriculumId, moduleIndex } = req.params;
    const { question, lessonContent, conversationHistory } = req.body;
    const userId = req.user.id;
    const Curriculum = require('../models/Curriculum');

    if (!question?.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(curriculumId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const curriculum = await Curriculum.findOne({ _id: curriculumId, userId });
    if (!curriculum) {
      return res.status(404).json({ error: 'Curriculum not found' });
    }

    const currentModuleIdx = parseInt(moduleIndex);
    const modules = curriculum.modules;

    const moduleContext = modules.map((m, i) => {
      if (i < currentModuleIdx) return `Module ${i + 1} (COMPLETED): ${m.title} — ${m.description}`;
      if (i === currentModuleIdx) return `Module ${i + 1} (CURRENT): ${m.title} — ${m.description}`;
      return `Module ${i + 1} (UPCOMING): ${m.title} — ${m.description}`;
    }).join('\n');

    const systemPrompt = `You are a helpful learning assistant. Answer the student's questions conversationally.

Course topic: <course_topic>${curriculum.topic}</course_topic>

Course structure:
${moduleContext}

Current module lesson content:
<lesson_content>${lessonContent?.slice(0, 2000) || ''}</lesson_content>

Instructions:
- Current module questions: answer in 150-250 words, plain conversational prose, no markdown.
- Completed module questions: brief 2-3 sentence recap, reference module by name.
- Upcoming module questions: 1-2 sentence preview, name the module it covers.
- Out of scope: politely say so, suggest a new curriculum on that topic.
- Multi-turn: use previous messages for context on follow-up questions.
- Never use markdown. Write directly to the student.`;

    const messages = [
      ...(conversationHistory || []).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: question }
    ];

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: systemPrompt,
      messages,
    });

    res.json({ answer: message.content[0].text });
  } catch (err) {
    console.error('[module-chat] Error:', err.message);
    res.status(500).json({ error: 'Failed to answer question' });
  }
});

// Track user learning time — must stay at bottom
router.post('/time', isAuthenticated, moduleController.trackTime);

module.exports = router;