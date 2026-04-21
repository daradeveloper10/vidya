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
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'You have reached the limit for AI requests. Please try again in an hour.' }
});

// Analyse topic for clarity
router.post('/analyse', isAuthenticated, aiLimiter, curriculumController.analyse);

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

module.exports = router;