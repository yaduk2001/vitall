const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for backward compatibility
    thumbnailUrl: { type: String, default: '' }, // Keep for backward compatibility
    videoUrl: { type: String, default: '' }, // Keep for backward compatibility
    // New fields for Atlas storage
    thumbnailData: { type: String }, // Base64 encoded thumbnail
    videoData: { type: String }, // Base64 encoded video
    thumbnailMimeType: { type: String }, // e.g., 'image/png'
    videoMimeType: { type: String }, // e.g., 'video/mp4'
    durationSeconds: { type: Number, default: 0 },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

VideoSchema.index({ title: 'text', description: 'text' });

VideoSchema.statics.format = function format(videoDoc) {
  return {
    id: videoDoc._id.toString(),
    title: videoDoc.title,
    description: videoDoc.description,
    tutorId: videoDoc.tutorId ? videoDoc.tutorId.toString() : null,
    thumbnailUrl: videoDoc.thumbnailUrl,
    videoUrl: videoDoc.videoUrl,
    // New Atlas storage fields
    thumbnailData: videoDoc.thumbnailData,
    videoData: videoDoc.videoData,
    thumbnailMimeType: videoDoc.thumbnailMimeType,
    videoMimeType: videoDoc.videoMimeType,
    durationSeconds: videoDoc.durationSeconds,
    tags: videoDoc.tags,
    createdAt: videoDoc.createdAt,
    updatedAt: videoDoc.updatedAt
  };
};

module.exports = mongoose.model('Video', VideoSchema);


