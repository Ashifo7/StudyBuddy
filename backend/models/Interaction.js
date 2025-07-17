const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'dislike'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🧠 Virtual: readable summary of interaction
interactionSchema.virtual('summary').get(function () {
  return `User ${this.userId} ${this.type}d User ${this.targetUserId}`;
});

// ❌ Prevent liking/disliking oneself
interactionSchema.pre('validate', function(next) {
  if (this.userId.equals(this.targetUserId)) {
    return next(new Error('You cannot interact with yourself.'));
  }
  next();
});

// 🧩 Unique pair index to avoid duplicate interactions
interactionSchema.index({ userId: 1, targetUserId: 1 }, { unique: true });

// ⚡ Index to optimize queries like "Who liked me?"
interactionSchema.index({ targetUserId: 1, type: 1 });

module.exports = mongoose.model('Interaction', interactionSchema);
