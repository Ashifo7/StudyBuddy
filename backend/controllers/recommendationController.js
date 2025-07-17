const User = require('../models/User');

function scoreUser(mainUser, candidate) {
    let score = 0;
    // 1. Age difference (closer is better)
    if (mainUser.personalInfo && mainUser.personalInfo.age && candidate.personalInfo && candidate.personalInfo.age) {
        const ageDiff = Math.abs(mainUser.personalInfo.age - candidate.personalInfo.age);
        score += Math.max(0, 30 - ageDiff); // Max 30 points, less for bigger difference
    }
    // 2. Shared subjectsInterested
    if (Array.isArray(mainUser.subjectsInterested) && Array.isArray(candidate.subjectsInterested)) {
        const sharedSubjects = mainUser.subjectsInterested.filter(subj => candidate.subjectsInterested.includes(subj));
        score += sharedSubjects.length * 10; // 10 points per shared subject
    }
    // 3. Shared languages
    if (Array.isArray(mainUser.personalInfo?.languages) && Array.isArray(candidate.personalInfo?.languages)) {
        const sharedLangs = mainUser.personalInfo.languages.filter(lang => candidate.personalInfo.languages.includes(lang));
        score += sharedLangs.length * 5; // 5 points per shared language
    }
    // 4. Study time
    if (mainUser.studyTime && candidate.studyTime) {
        score += mainUser.studyTime === candidate.studyTime ? 20 : 0;
    }
    return score;
}

module.exports = {
    getRecommendations: async (req, res) => {
        try {
            // Get current user
            const mainUser = await User.findById(req.user.id).select('personalInfo subjectsInterested studyTime');
            if (!mainUser) return res.status(404).json({ success: false, error: 'User not found' });
            // Get all other users' limited info
            const candidates = await User.find({ _id: { $ne: req.user.id } })
                .select('name location personalInfo preferences profilePic _id subjectsInterested studyTime')
                .lean();
            // Score and sort
            const scored = candidates.map(user => ({ ...user, score: scoreUser(mainUser, user) }));
            scored.sort((a, b) => b.score - a.score);
            res.json({ success: true, users: scored });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}; 