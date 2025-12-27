const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Message text is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  sender: {
    type: String,
    default: 'Anonymous',
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted timestamp
messageSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toLocaleString();
});

// Index for better query performance
messageSchema.index({ timestamp: -1 });
messageSchema.index({ text: 'text' }); // Text search index

// Pre-save middleware
messageSchema.pre('save', function(next) {
  if (this.isModified('text')) {
    this.text = this.text.trim();
  }
  next();
});

// Static method to get recent messages
messageSchema.statics.getRecentMessages = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Instance method to format message
messageSchema.methods.formatMessage = function() {
  return {
    id: this._id,
    text: this.text,
    sender: this.sender,
    timestamp: this.timestamp,
    formattedTimestamp: this.formattedTimestamp
  };
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
