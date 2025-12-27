const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    type: { type: String, enum: ['video', 'audio'], default: 'video' },
    thumbnailUrl: { type: String, default: '' },
    contentUrl: { type: String, required: true },
    duration: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    tags: [{ type: String }],
    metadata: {
        singer: { type: String, default: '' },
        composer: { type: String, default: '' },
        director: { type: String, default: '' },
        producer: { type: String, default: '' },
        musicDirector: { type: String, default: '' },
        cast: { type: String, default: '' }, // Comma separated
        movieName: { type: String, default: '' },
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

ContentSchema.index({ creatorId: 1, title: 'text', description: 'text' });
ContentSchema.index({ 'metadata.movieName': 'text', 'metadata.singer': 'text' });

module.exports = mongoose.model('Content', ContentSchema);
