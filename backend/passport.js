const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');

module.exports = function(passport) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/users/google/callback',
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;
            let user = await User.findOne({ email });
            if (!user) {
                user = new User({
                    name: profile.displayName,
                    email,
                    oauthProvider: 'google',
                    oauthId: profile.id,
                    profilePic: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined,
                    isOnline: false,
                    profileComplete: false
                    // Do NOT set location here
                });
                await user.save();
            }
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
}; 