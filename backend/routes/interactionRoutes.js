const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');
const requireAuth = require('../middleware/requireAuth');

// 1. Create or update interaction (like/dislike)
router.post('/', requireAuth, interactionController.createOrUpdateInteraction);

// 2. Get all interactions for the current user
router.get('/my', requireAuth, interactionController.getUserInteractions);

// 3. Get all interactions targeting a user (who liked/disliked me)
router.get('/target/:id?', requireAuth, interactionController.getTargetUserInteractions);

// 4. Remove interaction
router.delete('/', requireAuth, interactionController.removeInteraction);

// 5. Change interaction type (like <-> dislike)
router.put('/change-type', requireAuth, interactionController.changeInteractionType);

// 6. Get mutual likes for the current user only
router.get('/my-mutual', requireAuth, interactionController.getMutualLikes);

module.exports = router; 