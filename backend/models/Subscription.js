const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
}, { timestamps: true });

SubscriptionSchema.index({ studentId: 1, tutorId: 1 }, { unique: true });

SubscriptionSchema.statics.format = function(doc) {
  return {
    id: doc._id.toString(),
    studentId: doc.studentId.toString(),
    tutorId: doc.tutorId.toString(),
    createdAt: doc.createdAt
  };
};

module.exports = mongoose.model('Subscription', SubscriptionSchema);


