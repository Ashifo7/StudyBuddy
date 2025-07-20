const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const e2eMessageController = require('../controllers/e2eMessageController');

// Create a new encrypted message
router.post('/messages', requireAuth, e2eMessageController.createMessage);

// Get all messages for a match/chat
router.get('/messages/:matchId', requireAuth, e2eMessageController.getMessagesForMatch);

module.exports = router; 