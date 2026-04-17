const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  topic: { type: String, required: true },
  description: { type: String, required: true },
  estimatedTime: { type: String, default: '2hrs' },
  order: { type: Number, required: true },
});

const LearningPathSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  goal: { type: String, required: true },
  courses: [CourseSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('LearningPath', LearningPathSchema);
