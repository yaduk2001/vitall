const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  moduleIndex: { type: Number, required: true }, // 0-based index of completed module
  moduleType: { type: String, enum: ['video', 'document'], required: true },
  completedAt: { type: Date, default: Date.now },
  progress: { type: Number, default: 100 }, // Percentage for videos, 100 for documents
  lastWatchedAt: { type: Date, default: Date.now }, // When user last watched this content
  watchTimeSeconds: { type: Number, default: 0 }, // Total time watched in seconds
  lastPositionSeconds: { type: Number, default: 0 } // Last position in video (for continue watching)
}, { timestamps: true });

// Compound index to ensure unique progress per student-course-module
ProgressSchema.index({ studentId: 1, courseId: 1, moduleIndex: 1, moduleType: 1 }, { unique: true });

ProgressSchema.statics.format = function(doc) {
  return {
    id: doc._id.toString(),
    studentId: doc.studentId.toString(),
    courseId: doc.courseId.toString(),
    moduleIndex: doc.moduleIndex,
    moduleType: doc.moduleType,
    completedAt: doc.completedAt,
    progress: doc.progress,
    lastWatchedAt: doc.lastWatchedAt,
    watchTimeSeconds: doc.watchTimeSeconds,
    lastPositionSeconds: doc.lastPositionSeconds
  };
};

module.exports = mongoose.model('Progress', ProgressSchema);
