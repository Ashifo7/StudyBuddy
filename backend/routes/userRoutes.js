const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const recommendationController = require('../controllers/recommendationController');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Public routes
router.post('/register', userController.registerUser);
router.post('/verify-otp', userController.verifyOtp);
router.post('/login', userController.loginUser);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
// Google OAuth routes
const passport = require('passport');
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/' }), userController.googleOAuthCallback);


// Protected routes
router.put('/me/public-key', requireAuth, userController.setPublicKey);
router.get('/me', requireAuth, userController.getCurrentUser);
router.get('/', requireAuth, userController.listUsers);
router.put('/me', requireAuth, userController.updateProfile);
router.put('/me/password', requireAuth, userController.changePassword);
router.put('/me/preferences', requireAuth, userController.updatePreferences);
router.put('/me/status', requireAuth, userController.updateStatus);
router.put('/complete-profile', requireAuth, userController.completeProfile);
router.post('/me/profile-pic/upload', requireAuth, upload.single('profilePic'), userController.uploadProfilePicture);

// 🆕 Flexible update route
router.patch('/me/any', requireAuth, userController.updateAnyFields);

// Recommendation endpoint
router.get('/recommendations', requireAuth, recommendationController.getRecommendations);

// Internal endpoint for recommendation engine
router.get('/internal/recommendation-data', requireAuth, userController.getLimitedUsers);

router.delete('/me', requireAuth, userController.deactivateAccount);
router.get('/:id', userController.getUserById);
// Admin routes
router.put('/:id/ban', requireAuth, requireAdmin, userController.banUser);
router.put('/:id/unban', requireAuth, requireAdmin, userController.unbanUser);
router.delete('/:id', requireAuth, requireAdmin, userController.deleteUser);

module.exports = router;
