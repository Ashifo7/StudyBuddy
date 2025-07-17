// middleware/requireAdmin.js
module.exports = function requireAdmin(req, res, next) {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
};
