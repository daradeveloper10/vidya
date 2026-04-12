const express = require('express');
const router = express.Router();
const curriculumController = require('../controllers/curriculumController');
const { isAuthenticated } = require('../middleware/auth');

// Analyse topic for clarity
router.post('/analyse', isAuthenticated, curriculumController.analyse);

// Generate curriculum
router.post('/generate', isAuthenticated, curriculumController.generate);

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
