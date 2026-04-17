const mongoose = require('mongoose');

const UserPathSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pathId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', required: true },
  currentCourseIndex: { type: Number, default: 0 },
  completedCourses: [{ type: Number }],
  curriculumIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Curriculum' }],
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  completed: { type: Boolean, default: false },
});

module.exports = mongoose.model('UserPath', UserPathSchema);
