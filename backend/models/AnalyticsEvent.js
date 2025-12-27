const mongoose = require('mongoose');

const AnalyticsEventSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['watch', 'like', 'comment'], required: true },
    tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
    moduleOrder: { type: Number, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    commentText: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);


