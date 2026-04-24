const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { isAuthenticated } = require('../middleware/auth');
const Anthropic = require('@anthropic-ai/sdk');

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

// Track user learning time — must stay at bottom
router.post('/time', isAuthenticated, moduleController.trackTime);

module.exports = router;