const EtoEMessage = require('../models/EtoE');

// POST /messages - Create a new encrypted message
exports.createMessage = async (req, res) => {
  try {
    const { matchId, senderId, receiverId, encryptedMessage, aesKeyForSender, aesKeyForReceiver, iv } = req.body;
    if (!matchId || !senderId || !receiverId || !encryptedMessage || !aesKeyForSender || !aesKeyForReceiver || !iv) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const message = await EtoEMessage.create({
      matchId,
      senderId,
      receiverId,
      encryptedMessage,
      aesKeyForSender,
      aesKeyForReceiver,
      iv,
      timestamp: new Date()
    });
    res.status(201).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /messages/:matchId - Get all messages for a match/chat
exports.getMessagesForMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    if (!matchId) {
      return res.status(400).json({ success: false, error: 'Missing matchId' });
    }
    const messages = await EtoEMessage.find({ matchId }).sort({ timestamp: 1 });
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}; 