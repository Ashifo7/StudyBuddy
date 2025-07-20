const mongoose = require('mongoose');

const e2eMessageSchema = new mongoose.Schema({
  matchId: { type: String, required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  encryptedMessage: { type: String, required: true },
  aesKeyForSender: { type: String, required: true },
  aesKeyForReceiver: { type: String, required: true },
  iv: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('EtoEMessage', e2eMessageSchema);