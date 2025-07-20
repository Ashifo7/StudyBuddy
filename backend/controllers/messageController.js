const Message = require('../models/Message');
const Match = require('../models/Match');
const User = require('../models/User');
const mongoose = require('mongoose');
const Interaction = require('../models/Interaction');

module.exports = {
    // 1. Send a message
    sendMessage: async (req, res) => {
        try {
            const { matchId, receiverId, content, type } = req.body;
            let match = null;
            // If matchId is provided, use it. Otherwise, find or create a match.
            if (matchId) {
                match = await Match.findById(matchId);
                if (!match) return res.status(404).json({ success: false, error: 'Match not found' });
            } else {
                // Find or create match between sender and receiver
                const userA = mongoose.Types.ObjectId(req.user.id) < mongoose.Types.ObjectId(receiverId) ? req.user.id : receiverId;
                const userB = mongoose.Types.ObjectId(req.user.id) < mongoose.Types.ObjectId(receiverId) ? receiverId : req.user.id;
                match = await Match.findOne({ userA, userB });
                if (!match) {
                    match = await Match.create({ userA, userB, deletedBy: [] });
                } else if (match.deletedBy && match.deletedBy.includes(req.user.id)) {
                    // If user had previously deleted, remove from deletedBy
                    match.deletedBy = match.deletedBy.filter(id => id.toString() !== req.user.id);
                    await match.save();
                }
            }
            // Create message
            const message = await Message.create({
                matchId: match._id,
                senderId: req.user.id,
                receiverId,
                content,
                type: type || 'text'
            });
            // Update lastMessageAt
            match.lastMessageAt = new Date();
            await match.save();
            res.status(201).json({ success: true, message });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 2. Get all messages for a match
    getMessagesForMatch: async (req, res) => {
        try {
            const { matchId } = req.params;
            const messages = await Message.find({ matchId }).sort({ createdAt: 1 });
            res.json({ success: true, messages });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 3. Delete a message (hard delete)
    deleteMessage: async (req, res) => {
        try {
            const { messageId } = req.params;
            const message = await Message.findById(messageId);
            if (!message) return res.status(404).json({ success: false, error: 'Message not found' });
            // Only sender or receiver can delete
            if (message.senderId.toString() !== req.user.id && message.receiverId.toString() !== req.user.id) {
                return res.status(403).json({ success: false, error: 'Not authorized' });
            }
            await message.deleteOne();
            res.json({ success: true, message: 'Message deleted' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 4. Get all matches for the current user
    getUserMatches: async (req, res) => {
        try {
            // Find all users the current user liked
            const myLikes = await Interaction.find({ userId: req.user.id, type: 'like' });
            const likedUserIds = myLikes.map(i => i.targetUserId.toString());
            // Find all users who liked the current user
            const likedMe = await Interaction.find({ targetUserId: req.user.id, type: 'like' });
            const likedMeUserIds = likedMe.map(i => i.userId.toString());
            // Only users who both liked and were liked by the current user, and not the current user
            const mutualUserIds = likedUserIds.filter(id => likedMeUserIds.includes(id) && id !== req.user.id.toString());
            // Ensure a Match exists for each mutual pair
            for (const otherUserId of mutualUserIds) {
                const userA = req.user.id.toString() < otherUserId ? req.user.id.toString() : otherUserId;
                const userB = req.user.id.toString() < otherUserId ? otherUserId : req.user.id.toString();
                let match = await Match.findOne({ userA, userB });
                if (!match) {
                    await Match.create({ userA, userB, deletedBy: [] });
                }
            }
            // Now fetch all matches for the current user
            const matches = await Match.find({
                $and: [
                    { $or: [ { userA: req.user.id }, { userB: req.user.id } ] },
                    { deletedBy: { $ne: req.user.id } }
                ]
            }).sort({ lastMessageAt: -1, createdAt: -1 });
            res.json({ success: true, matches });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 5. Delete a match (delete chat)
    deleteMatch: async (req, res) => {
        try {
            const { matchId } = req.params;
            const match = await Match.findById(matchId);
            if (!match) return res.status(404).json({ success: false, error: 'Match not found' });
            // Add user to deletedBy if not already present
            if (!match.deletedBy.map(id => id.toString()).includes(req.user.id)) {
                match.deletedBy.push(req.user.id);
                await match.save();
            }
            // If both users have deleted, delete match and all messages
            if (match.deletedBy.length === 2) {
                await Message.deleteMany({ matchId: match._id });
                await match.deleteOne();
                return res.json({ success: true, message: 'Match and all messages deleted for both users.' });
            }
            res.json({ success: true, message: 'Match deleted for current user.' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}; 