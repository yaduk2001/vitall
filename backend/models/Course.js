const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  order: { type: Number, required: true },
  type: { type: String, enum: ['video', 'document'], default: 'video' },
  videoUrl: { type: String, default: '' },
  resourceUrl: { type: String, default: '' },
  documentUrl: { type: String, default: '' },
  documentType: { type: String, default: '' }, // pdf, txt, doc, etc.
  documentName: { type: String, default: '' },
  durationSeconds: { type: Number, default: 0 },
  lessonId: { type: String, default: '' } // AI Tutor Lesson ID
}, { _id: false });

const CourseSchema = new mongoose.Schema({
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  thumbnailUrl: { type: String, default: '' },
  tags: [{ type: String }],
  modules: { type: [ModuleSchema], default: [] },
  isActive: { type: Boolean, default: true },
  isPaid: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, { timestamps: true });

CourseSchema.index({ tutorId: 1, title: 'text', description: 'text' });

CourseSchema.statics.format = function (doc) {
  return {
    id: doc._id.toString(),
    tutorId: doc.tutorId.toString(),
    title: doc.title,
    description: doc.description,
    thumbnailUrl: doc.thumbnailUrl,
    tags: doc.tags,
    modules: doc.modules,
    isPaid: doc.isPaid,
    price: doc.price,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};

module.exports = mongoose.model('Course', CourseSchema);


