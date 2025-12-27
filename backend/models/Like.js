const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
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
  }
}, { 
  timestamps: true,
  // Ensure a student can only like a module once
  indexes: [
    { studentId: 1, courseId: 1, moduleIndex: 1, moduleType: 1 }, 
    { unique: true }
  ]
});

// Static method to format like data
likeSchema.statics.format = function(like) {
  return {
    id: like._id.toString(),
    studentId: like.studentId.toString(),
    courseId: like.courseId.toString(),
    moduleIndex: like.moduleIndex,
    moduleType: like.moduleType,
    createdAt: like.createdAt
  };
};

module.exports = mongoose.model('Like', likeSchema);
