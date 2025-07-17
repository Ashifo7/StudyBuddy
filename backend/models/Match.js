const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  userA: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userB: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  lastMessageAt: { type: Date }
});

// Ensure uniqueness of user pairs (always store smaller userId as userA)
matchSchema.pre('save', function(next) {
  if (this.userA > this.userB) {
    const temp = this.userA;
    this.userA = this.userB;
    this.userB = temp;
  }
  next();
});

matchSchema.index({ userA: 1, userB: 1 }, { unique: true });

module.exports = mongoose.model('Match', matchSchema);
