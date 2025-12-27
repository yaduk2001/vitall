const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true }
}, { timestamps: true });

EnrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

EnrollmentSchema.statics.format = function(doc) {
  return {
    id: doc._id.toString(),
    studentId: doc.studentId.toString(),
    courseId: doc.courseId.toString(),
    createdAt: doc.createdAt
  };
};

module.exports = mongoose.model('Enrollment', EnrollmentSchema);


