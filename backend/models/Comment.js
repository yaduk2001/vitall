const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true, 
    index: true 
  },
  moduleIndex: { 
    type: Number, 
    required: true 
  },
  moduleType: { 
    type: String, 
    enum: ['video', 'document'], 
    required: true 
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
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
CommentSchema.index({ courseId: 1, moduleIndex: 1 });
CommentSchema.index({ studentId: 1, createdAt: -1 });

CommentSchema.statics.format = function(doc) {
  return {
    id: doc._id.toString(),
    studentId: doc.studentId.toString(),
    courseId: doc.courseId.toString(),
    moduleIndex: doc.moduleIndex,
    moduleType: doc.moduleType,
    content: doc.content,
    isResolved: doc.isResolved,
    tutorReply: doc.tutorReply,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};

module.exports = mongoose.model('Comment', CommentSchema);
