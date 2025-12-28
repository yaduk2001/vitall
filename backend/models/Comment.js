const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  moduleIndex: {
    type: Number
  },
  moduleType: {
    type: String,
    enum: ['video', 'document']
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  tutorReply: {
    content: { type: String, trim: true },
    repliedAt: { type: Date },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for efficient queries
CommentSchema.index({ courseId: 1, moduleIndex: 1 });
CommentSchema.index({ studentId: 1, createdAt: -1 });

CommentSchema.statics.format = function (doc) {
  return {
    id: doc._id.toString(),
    studentId: doc.studentId.toString(),
    courseId: doc.courseId.toString(),
    moduleIndex: doc.moduleIndex,
    moduleType: doc.moduleType,
    content: doc.content,
    isResolved: doc.isResolved,
    likes: doc.likes || [],
    likeCount: doc.likes ? doc.likes.length : 0,
    tutorReply: doc.tutorReply,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};

module.exports = mongoose.model('Comment', CommentSchema);
