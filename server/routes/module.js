const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { isAuthenticated } = require('../middleware/auth');

// Generate lesson content for a module
router.post('/:curriculumId/:moduleIndex/lesson', isAuthenticated, moduleController.generateLesson);

// Generate quiz questions for a module
router.post('/:curriculumId/:moduleIndex/quiz', isAuthenticated, moduleController.generateQuiz);

// Submit quiz and save score
router.post('/:curriculumId/:moduleIndex/submit', isAuthenticated, moduleController.submitQuiz);

// Explain a concept differently
router.post('/:curriculumId/:moduleIndex/explain', isAuthenticated, moduleController.explainDifferently);

// Track user learning time
router.post('/time', isAuthenticated, moduleController.trackTime);

module.exports = router;
