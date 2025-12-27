const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  organization: { type: String, default: '', trim: true },
  description: { type: String, default: '', trim: true },
  bio: { type: String, default: '', trim: true }, // Keep for backward compatibility
  avatarUrl: { type: String, default: '' },
  bannerUrl: { type: String, default: '' },
  coverUrl: { type: String, default: '' }, // Keep for backward compatibility
  socialLinks: {
    website: { type: String, default: '' },
    twitter: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    youtube: { type: String, default: '' }
  },
  subscriberCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

ChannelSchema.index({ tutorId: 1 }, { unique: true });

ChannelSchema.statics.format = function(doc) {
  return {
    id: doc._id.toString(),
    tutorId: doc.tutorId.toString(),
    name: doc.name,
    organization: doc.organization,
    description: doc.description,
    bio: doc.bio, // Keep for backward compatibility
    avatarUrl: doc.avatarUrl,
    bannerUrl: doc.bannerUrl,
    coverUrl: doc.coverUrl, // Keep for backward compatibility
    socialLinks: doc.socialLinks || {},
    subscriberCount: doc.subscriberCount || 0,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};

module.exports = mongoose.model('Channel', ChannelSchema);


