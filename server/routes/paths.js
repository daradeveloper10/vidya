const express = require('express');
const router = express.Router();
const LearningPath = require('../models/LearningPath');
const UserPath = require('../models/UserPath');
const auth = require('../middleware/auth');

// GET /api/paths — all paths (no auth needed)
router.get('/', async (req, res) => {
  try {
    const paths = await LearningPath.find({});
    res.json(paths);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch paths' });
  }
});

// GET /api/paths/enrolled — user's enrolled paths
// IMPORTANT: defined BEFORE /:slug to avoid route conflict
router.get('/enrolled', auth, async (req, res) => {
  try {
    const userPaths = await UserPath.find({ userId: req.user._id })
      .populate('pathId')
      .lean();
    res.json(userPaths);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user paths' });
  }
});

// GET /api/paths/:slug — single path with user progress
router.get('/:slug', auth, async (req, res) => {
  try {
    const path = await LearningPath.findOne({ slug: req.params.slug });
    if (!path) return res.status(404).json({ error: 'Path not found' });
    const userPath = await UserPath.findOne({ userId: req.user._id, pathId: path._id });
    res.json({ path, userPath: userPath || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch path' });
  }
});

// POST /api/paths/:slug/start — enroll user in path
router.post('/:slug/start', auth, async (req, res) => {
  try {
    const path = await LearningPath.findOne({ slug: req.params.slug });
    if (!path) return res.status(404).json({ error: 'Path not found' });

    let userPath = await UserPath.findOne({ userId: req.user._id, pathId: path._id });
    if (userPath) {
      return res.json({ userPath, alreadyEnrolled: true });
    }

    userPath = await UserPath.create({
      userId: req.user._id,
      pathId: path._id,
      currentCourseIndex: 0,
      completedCourses: [],
      curriculumIds: [],
    });

    res.json({ userPath, path });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start path' });
  }
});

// POST /api/paths/:slug/complete-course — mark course done and advance
router.post('/:slug/complete-course', auth, async (req, res) => {
  try {
    const { curriculumId } = req.body;
    const path = await LearningPath.findOne({ slug: req.params.slug });
    if (!path) return res.status(404).json({ error: 'Path not found' });

    const userPath = await UserPath.findOne({ userId: req.user._id, pathId: path._id });
    if (!userPath) return res.status(404).json({ error: 'Not enrolled in this path' });

    const currentIndex = userPath.currentCourseIndex;

    if (!userPath.completedCourses.includes(currentIndex)) {
      userPath.completedCourses.push(currentIndex);
    }

    if (curriculumId && !userPath.curriculumIds.map(id => id.toString()).includes(curriculumId)) {
      userPath.curriculumIds.push(curriculumId);
    }

    if (currentIndex < path.courses.length - 1) {
      userPath.currentCourseIndex = currentIndex + 1;
    } else {
      userPath.completed = true;
      userPath.completedAt = new Date();
    }

    await userPath.save();

    const nextCourse = !userPath.completed ? path.courses[userPath.currentCourseIndex] : null;

    res.json({ userPath, nextCourse, pathCompleted: userPath.completed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete course' });
  }
});

module.exports = router;
