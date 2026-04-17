const mongoose = require('mongoose');

const PathCurriculumSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  title: { type: String },
  description: { type: String },
  duration: { type: String, required: true },
  order: { type: Number, required: true },
  curriculumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Curriculum', default: null },
  completed: { type: Boolean, default: false },
});

const UserGeneratedPathSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  curricula: [PathCurriculumSchema],
  totalDuration: { type: String },
  status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
  currentCurriculumIndex: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UserGeneratedPath', UserGeneratedPathSchema);