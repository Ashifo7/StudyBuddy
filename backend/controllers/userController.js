const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;

// In-memory OTP store: { email: { otp, expiresAt, userData } }
const otpStore = {};

// Email sending utility
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

// Filter user fields before sending in response
const filterUser = (user) => {
    const obj = user.toObject ? user.toObject() : user;
    delete obj.passwordHash;
    return obj;
};

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

module.exports = {
    // Step 1: Register - send OTP
    registerUser: async (req, res) => {
        try {
            const { name, email, password, subjectsInterested, studyTime, location, adminCode } = req.body;
            if (!name || !email || !password || !subjectsInterested || !studyTime || !location) {
                return res.status(400).json({ success: false, error: 'Missing required fields' });
            }
            const existing = await User.findOne({ email });
            if (existing) {
                return res.status(409).json({ success: false, error: 'Email already registered' });
            }
            // Determine if this should be an admin registration
            const isAdmin = adminCode && adminCode === process.env.ADMIN_REGISTRATION_CODE;
            // Generate OTP
            const otp = generateOtp();
            const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min expiry
            otpStore[email] = {
                otp,
                expiresAt,
                userData: { name, email, password, subjectsInterested, studyTime, location, isAdmin }
            };
            // Send OTP email
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: email,
                subject: 'Your Study Buddy OTP',
                text: `Your OTP for Study Buddy registration is: ${otp}`
            });
            res.json({ success: true, message: 'OTP sent to email. Please verify to complete registration.' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // Step 2: Verify OTP and create user
    verifyOtp: async (req, res) => {
        try {
            const { email, otp } = req.body;
            const record = otpStore[email];
            if (!record) {
                return res.status(400).json({ success: false, error: 'No OTP request found for this email.' });
            }
            if (Date.now() > record.expiresAt) {
                delete otpStore[email];
                return res.status(400).json({ success: false, error: 'OTP expired. Please register again.' });
            }
            if (record.otp !== otp) {
                return res.status(400).json({ success: false, error: 'Invalid OTP.' });
            }
            // Create user
            const { name, password, subjectsInterested, studyTime, location, isAdmin } = record.userData;
            const user = new User({ name, email, passwordHash: password, subjectsInterested, studyTime, location, isAdmin });
            await user.save();
            const token = user.getSignedJwtToken();
            delete otpStore[email];
            res.status(201).json({ success: true, user: filterUser(user), token });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 🔐 Google OAuth (placeholder)
    googleOAuth: async (req, res) => {
        res.status(501).json({ success: false, error: 'Google OAuth not implemented in controller' });
    },

    // Google OAuth callback handler
    googleOAuthCallback: async (req, res) => {
        try {
            const user = req.user;
            if (!user) {
                return res.redirect(`${process.env.CLIENT_URL}/oauth-callback?error=google_auth_failed`);
            }
            // If user was just created, allow login. If user already existed, check if it's a Google user
            if (user.oauthProvider === 'google' || !user.passwordHash) {
                const token = user.getSignedJwtToken();
                return res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${token}`);
            } else {
                // Email exists but not a Google user
                return res.redirect(`${process.env.CLIENT_URL}/oauth-callback?error=email_exists`);
            }
        } catch (err) {
            return res.redirect(`${process.env.CLIENT_URL}/oauth-callback?error=server_error`);
        }
    },

    // Login endpoint
    loginUser: async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, error: 'Email and password are required.' });
            }
            const user = await User.findOne({ email }).select('+passwordHash preferences');
            if (!user) {
                return res.status(401).json({ success: false, error: 'Invalid email or password.' });
            }
            if (user.preferences && user.preferences.banned) {
                return res.status(403).json({ success: false, error: 'User is banned.' });
            }
            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return res.status(401).json({ success: false, error: 'Invalid email or password.' });
            }
            const token = user.getSignedJwtToken();
            res.json({ success: true, user: filterUser(user), token });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 📖 Read: Get user profile by ID
    getUserById: async (req, res) => {
        try {
            const user = await User.findById(req.params.id).select('-passwordHash');
            if (!user) return res.status(404).json({ success: false, error: 'User not found' });
            res.json({ success: true, user });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 📖 Read: Get current authenticated user
    getCurrentUser: async (req, res) => {
        try {
            const user = await User.findById(req.user.id).select('-passwordHash');
            if (!user) return res.status(404).json({ success: false, error: 'User not found' });
            res.json({ success: true, user });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 📖 Read: List users (with optional filters)
    listUsers: async (req, res) => {
        try {
            const filters = {};
            if (req.query.subject) filters.subjectsInterested = req.query.subject;
            if (req.query.city) filters['location.city'] = req.query.city;
            if (req.query.state) filters['location.state'] = req.query.state;
            if (req.query.isOnline) filters.isOnline = req.query.isOnline === 'true';

            const users = await User.find(filters).select('-passwordHash');
            res.json({ success: true, users });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // ✏️ Update: Profile details (except email/password)
    updateProfile: async (req, res) => {
        try {
            const updates = req.body;
            delete updates.passwordHash;
            delete updates.email;

            const user = await User.findByIdAndUpdate(req.user.id, updates, {
                new: true,
                runValidators: true
            }).select('-passwordHash');

            if (!user) return res.status(404).json({ success: false, error: 'User not found' });

            res.json({ success: true, user });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 🔐 Update: Change password
    changePassword: async (req, res) => {
        try {
            const { oldPassword, newPassword } = req.body;
            if (!oldPassword || !newPassword)
                return res.status(400).json({ success: false, error: 'Both passwords required' });

            const user = await User.findById(req.user.id).select('+passwordHash');
            if (!user) return res.status(404).json({ success: false, error: 'User not found' });

            const isMatch = await user.matchPassword(oldPassword);
            if (!isMatch)
                return res.status(401).json({ success: false, error: 'Old password incorrect' });

            user.passwordHash = newPassword; // Will be hashed on save
            await user.save();

            res.json({ success: true, message: 'Password updated successfully' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 🖼️ Upload: Profile picture (file upload)
    uploadProfilePicture: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No file uploaded' });
            }
            // Only allow image files
            if (!req.file.mimetype.startsWith('image/')) {
                return res.status(400).json({ success: false, error: 'Only image files are allowed' });
            }
            // Upload to Cloudinary
            const streamifier = require('streamifier');
            const streamUpload = (buffer) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: 'study_buddy/profile_pics', resource_type: 'image' },
                        (error, result) => {
                            if (result) resolve(result);
                            else reject(error);
                        }
                    );
                    streamifier.createReadStream(buffer).pipe(stream);
                });
            };
            const result = await streamUpload(req.file.buffer);
            // Save URL to user
            const user = await User.findByIdAndUpdate(
                req.user.id,
                { profilePic: result.secure_url },
                { new: true }
            );
            if (!user) return res.status(404).json({ success: false, error: 'User not found' });
            res.json({ success: true, url: result.secure_url, user: filterUser(user) });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // ⚙️ Update: Preferences
    updatePreferences: async (req, res) => {
        try {
            const { preferences } = req.body;
            if (!preferences)
                return res.status(400).json({ success: false, error: 'No preferences provided' });

            const user = await User.findByIdAndUpdate(req.user.id, { preferences }, {
                new: true,
                runValidators: true
            });

            res.json({ success: true, user: filterUser(user) });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // ⏱️ Update: Online status or last seen
    updateStatus: async (req, res) => {
        try {
            const { isOnline } = req.body;
            const user = await User.findByIdAndUpdate(req.user.id, { isOnline }, { new: true });
            if (!user) return res.status(404).json({ success: false, error: 'User not found' });

            res.json({ success: true, user: filterUser(user) });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 🆕 Flexible: Update any user fields (partial update, except restricted fields)
    updateAnyFields: async (req, res) => {
        try {
            const updates = { ...req.body };
            // Prevent updating restricted fields
            delete updates._id;
            delete updates.email;
            delete updates.passwordHash;
            delete updates.isAdmin;
            delete updates.oauthProvider;
            delete updates.profileComplete; // Optionally restrict this

            // Clean up incomplete or invalid location.coordinates
            if (updates.location) {
                const coords = updates.location.coordinates?.coordinates;
                if (
                    !Array.isArray(coords) ||
                    coords.length !== 2 ||
                    coords.some(c => typeof c !== 'number' || isNaN(c))
                ) {
                    delete updates.location.coordinates;
                }
                // Optionally, remove location entirely if all fields are empty
                if (
                    !updates.location.state &&
                    !updates.location.city &&
                    !updates.location.formattedAddress &&
                    !updates.location.coordinates
                ) {
                    delete updates.location;
                }
            }

            const user = await User.findByIdAndUpdate(
                req.user.id,
                { $set: updates },
                { new: true, runValidators: true }
            ).select('-passwordHash');

            if (!user) return res.status(404).json({ success: false, error: 'User not found' });
            res.json({ success: true, user });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // ❌ Delete: Soft delete user
    deactivateAccount: async (req, res) => {
        try {
            const user = await User.findByIdAndUpdate(req.user.id, {
                email: `deactivated_${Date.now()}_${req.user.id}`,
                isOnline: false
            }, { new: true });

            res.json({ success: true, message: 'Account deactivated successfully' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 🔒 Admin: Ban a user
    banUser: async (req, res) => {
        try {
            const user = await User.findByIdAndUpdate(req.params.id, {
                'preferences.banned': true
            }, { new: true });

            if (!user) return res.status(404).json({ success: false, error: 'User not found' });
            res.json({ success: true, message: 'User banned' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // 🔓 Admin: Unban a user
    unbanUser: async (req, res) => {
        try {
            const user = await User.findByIdAndUpdate(req.params.id, {
                'preferences.banned': false
            }, { new: true });

            if (!user) return res.status(404).json({ success: false, error: 'User not found' });
            res.json({ success: true, message: 'User unbanned' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // ❌ Admin: Permanently delete user
    deleteUser: async (req, res) => {
        try {
            const user = await User.findByIdAndDelete(req.params.id);
            if (!user) return res.status(404).json({ success: false, error: 'User not found' });
            res.json({ success: true, message: 'User deleted permanently' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // Get all users with limited info for internal recommendation engine
    getLimitedUsers: async (req, res) => {
        try {
            const users = await User.find({ _id: { $ne: req.user.id } }) // Exclude current user
                .select('name location personalInfo preferences profilePic _id')
                .lean(); // Use .lean() for faster read-only queries
            res.json({ success: true, users });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // Forgot password: send OTP
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ success: false, error: 'Email is required.' });
            // For security, always respond with success
            const user = await User.findOne({ email });
            if (user) {
                const otp = generateOtp();
                const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min expiry
                otpStore[`reset_${email}`] = { otp, expiresAt };
                await transporter.sendMail({
                    from: process.env.SMTP_USER,
                    to: email,
                    subject: 'Your Study Buddy Password Reset OTP',
                    text: `Your OTP for password reset is: ${otp}`
                });
            }
            res.json({ success: true, message: 'If this email is registered, an OTP has been sent.' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // Reset password with OTP
    resetPassword: async (req, res) => {
        try {
            const { email, otp, newPassword } = req.body;
            if (!email || !otp || !newPassword) {
                return res.status(400).json({ success: false, error: 'Email, OTP, and new password are required.' });
            }
            const record = otpStore[`reset_${email}`];
            if (!record) {
                return res.status(400).json({ success: false, error: 'No OTP request found for this email.' });
            }
            if (Date.now() > record.expiresAt) {
                delete otpStore[`reset_${email}`];
                return res.status(400).json({ success: false, error: 'OTP expired. Please request again.' });
            }
            if (record.otp !== otp) {
                return res.status(400).json({ success: false, error: 'Invalid OTP.' });
            }
            const user = await User.findOne({ email }).select('+passwordHash');
            if (!user) {
                return res.status(400).json({ success: false, error: 'No user found for this email.' });
            }
            user.passwordHash = newPassword;
            await user.save();
            delete otpStore[`reset_${email}`];
            res.json({ success: true, message: 'Password has been reset successfully.' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // Complete profile for Google OAuth users
    completeProfile: async (req, res) => {
        try {
            const { location, subjectsInterested, studyTime } = req.body;
            if (!location || !location.state || !location.city || !location.coordinates || !Array.isArray(subjectsInterested) || subjectsInterested.length === 0 || !studyTime) {
                return res.status(400).json({ success: false, error: 'Missing required fields: location, subjectsInterested, or studyTime.' });
            }
            const user = await User.findByIdAndUpdate(
                req.user.id,
                {
                    location,
                    subjectsInterested,
                    studyTime,
                    profileComplete: true
                },
                { new: true, runValidators: true }
            ).select('-passwordHash');
            if (!user) return res.status(404).json({ success: false, error: 'User not found' });
            res.json({ success: true, user });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // Set or update public key for E2EE
    setPublicKey: async (req, res) => {
        try {
            const { publicKey } = req.body;
            if (!publicKey) {
                return res.status(400).json({ success: false, error: 'publicKey is required.' });
            }
            const user = await User.findByIdAndUpdate(
                req.user.id,
                { publicKey },
                { new: true, runValidators: true }
            ).select('-passwordHash');
            if (!user) return res.status(404).json({ success: false, error: 'User not found' });
            res.json({ success: true, user });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
};
