const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['multiple-choice', 'short-answer'],
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: [String], // For multiple choice
  correctAnswer: {
    type: String,
    required: true
  },
  explanation: String
});

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  estimatedTime: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  video: {
    videoId: String,
    title: String,
    channelTitle: String,
    thumbnailUrl: String,
    duration: String,
    contextLine: String
  },
  questions: [questionSchema],
  completed: {
    type: Boolean,
    default: false
  },
  score: Number
});

const curriculumSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  displayTitle: {
    type: String
  },
  subtitle: {
    type: String
  },
  duration: {
    type: String,
    required: true
  },
  clarificationAnswers: [String],
  modules: [moduleSchema],
  currentModuleIndex: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
curriculumSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Curriculum', curriculumSchema);
