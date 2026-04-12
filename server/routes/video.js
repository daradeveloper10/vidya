const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { isAuthenticated } = require('../middleware/auth');

// All routes require authentication
router.use(isAuthenticated);

// Search and score videos for a module
router.post('/search', videoController.searchVideo);

module.exports = router;
