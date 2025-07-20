const Interaction = require('../models/Interaction');
const User = require('../models/User');
const Match = require('../models/Match');

module.exports = {
    // 1. Create or update interaction (like/dislike)
    createOrUpdateInteraction: async (req, res) => {
        try {
            const { targetUserId, type } = req.body;
            if (!targetUserId || !['like', 'dislike'].includes(type)) {
                return res.status(400).json({ success: false, error: 'targetUserId and valid type are required.' });
            }
            if (req.user.id === targetUserId) {
                return res.status(400).json({ success: false, error: 'You cannot interact with yourself.' });
            }
            let interaction = await Interaction.findOne({ userId: req.user.id, targetUserId });
            if (interaction) {
                interaction.type = type;
                await interaction.save();
            } else {
                interaction = await Interaction.create({ userId: req.user.id, targetUserId, type });
            }
            res.json({ success: true, interaction });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 2. Get all interactions for the current user
    getUserInteractions: async (req, res) => {
        try {
            const { type } = req.query;
            const filter = { userId: req.user.id };
            if (type) filter.type = type;
            const interactions = await Interaction.find(filter).populate('targetUserId', 'name email profilePic');
            res.json({ success: true, interactions });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 3. Get all interactions targeting a user (who liked/disliked me)
    getTargetUserInteractions: async (req, res) => {
        try {
            const { type } = req.query;
            const targetUserId = req.params.id || req.user.id;
            const filter = { targetUserId };
            if (type) filter.type = type;
            const interactions = await Interaction.find(filter).populate('userId', 'name email profilePic');
            res.json({ success: true, interactions });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 4. Remove interaction
    removeInteraction: async (req, res) => {
        try {
            const { targetUserId } = req.body;
            if (!targetUserId) {
                return res.status(400).json({ success: false, error: 'targetUserId is required.' });
            }
            const result = await Interaction.findOneAndDelete({ userId: req.user.id, targetUserId });
            if (!result) {
                return res.status(404).json({ success: false, error: 'Interaction not found.' });
            }
            res.json({ success: true, message: 'Interaction removed.' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 5. Change interaction type (like <-> dislike)
    changeInteractionType: async (req, res) => {
        try {
            const { targetUserId } = req.body;
            if (!targetUserId) {
                return res.status(400).json({ success: false, error: 'targetUserId is required.' });
            }
            let interaction = await Interaction.findOne({ userId: req.user.id, targetUserId });
            if (!interaction) {
                return res.status(404).json({ success: false, error: 'Interaction not found.' });
            }
            interaction.type = interaction.type === 'like' ? 'dislike' : 'like';
            await interaction.save();
            res.json({ success: true, interaction });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 6. Get mutual likes (users who liked each other with the current user only)
    getMutualLikes: async (req, res) => {
        try {
            // Find all users the current user liked
            const myLikes = await Interaction.find({ userId: req.user.id, type: 'like' });
            const likedUserIds = myLikes.map(i => i.targetUserId.toString());
            // Find all users who liked the current user
            const likedMe = await Interaction.find({ targetUserId: req.user.id, type: 'like' });
            const likedMeUserIds = likedMe.map(i => i.userId.toString());
            // Only users who both liked and were liked by the current user, and not the current user
            const mutualUserIds = likedUserIds.filter(id => likedMeUserIds.includes(id) && id !== req.user.id);

            // Ensure a Match exists for each mutual pair
            for (const otherUserId of mutualUserIds) {
                const userA = req.user.id < otherUserId ? req.user.id : otherUserId;
                const userB = req.user.id < otherUserId ? otherUserId : req.user.id;
                let match = await Match.findOne({ userA, userB });
                if (!match) {
                    await Match.create({ userA, userB, deletedBy: [] });
                }
            }

            const users = await User.find({ _id: { $in: mutualUserIds } }).select('name email profilePic');
            res.json({ success: true, users });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}; 