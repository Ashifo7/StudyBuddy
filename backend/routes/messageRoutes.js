const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const requireAuth = require('../middleware/requireAuth');


// 4. Get all matches for the current user
router.get('/matches', requireAuth, messageController.getUserMatches);

// 5. Delete a match (delete chat)
router.delete('/matches/:matchId', requireAuth, messageController.deleteMatch);





// 2. Get all messages for a match
router.get('/:matchId', requireAuth, messageController.getMessagesForMatch);

// 3. Delete a message
router.delete('/:messageId', requireAuth, messageController.deleteMessage);
// 1. Send a message
router.post('/', requireAuth, messageController.sendMessage);
module.exports = router; 