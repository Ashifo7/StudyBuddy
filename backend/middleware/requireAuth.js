// middleware/requireAuth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, error: 'User not found' });
        }

        if (user.preferences && user.preferences.banned) {
            return res.status(403).json({ success: false, error: 'User is banned' });
        }

        // Add user info to request
        req.user = { id: user._id, isAdmin: user.isAdmin || false };
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
};
