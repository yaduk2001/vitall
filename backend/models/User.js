const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /[^@\s]+@[^@\s]+\.[^@\s]+/
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'user', 'organization', 'admin', 'content_creator'],
    required: true,
    default: 'student'
  },
  creatorType: {
    type: String,
    enum: ['vlogger', 'music_company', 'corporate', 'medical', null],
    default: null
  },
  isApproved: {
    type: Boolean,
    default: function () {
      // Students, Users (Consumers), and Admins are approved by default
      if (this.role === 'student' || this.role === 'user' || this.role === 'admin') return true;
      // Organizations (Tutors) and Content Creators (Vloggers, Music Companies, etc.) require approval
      return false;
    }
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  buddyConfig: {
    buddyName: { type: String, default: 'Nova' },
    persona: { type: String, default: 'mentor' },
    voice: { type: String, default: 'balanced' },
    palette: { type: String, default: 'aurora' },
    modelPath: { type: String, default: '/studybuddy/female buddy/hi4.glb' },
    topColor: { type: String, default: '#f97316' },
    bottomColor: { type: String, default: '#0f172a' },
    footwearColor: { type: String, default: '#2563eb' },
    hairColor: { type: String, default: '#d97706' }
  },
  streak: { type: Number, default: 0 },
  streakLastLoginDate: { type: Date, default: null }
}, {
  timestamps: true
});

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
