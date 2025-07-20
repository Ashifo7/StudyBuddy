const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  passwordHash: {
    type: String,
    select: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  oauthProvider: {
    type: String,
    enum: ['google', 'facebook', null],
    default: null
  },
  oauthId: String,
  profilePic: String,
  bio: { type: String, trim: true },
  studyGoals: { type: String, trim: true },
  subjectsInterested: {
    type: [String]
    // No required or custom validator here
  },
  studyTime: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night']
  },
  location: {
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number]  // [longitude, latitude]
      }
    },
    formattedAddress: String
  },
  matches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  stats: {
    studySessionsCount: { type: Number, default: 0 },
    matchesCount: { type: Number, default: 0 },
    successfulSessionsCount: { type: Number, default: 0 },
    totalStudyHours: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 }
  },
  socketId: String,
  isOnline: {
    type: Boolean,
    default: false
  },
  personalInfo: {
    gender: {
      type: String,
      enum: ['male', 'female', 'confused']
    },
    age: Number,
    dateOfBirth: Date,
    nationality: { type: String, trim: true },
    languages: [String],
    timezone: String,
    religion: String,
    ethnicity: String,
    culturalBackground: String,
    privacySettings: {
      showAge: { type: Boolean, default: true },
      showGender: { type: Boolean, default: true },
      showReligion: { type: Boolean, default: false },
      showEthnicity: { type: Boolean, default: false },
      showCulturalBackground: { type: Boolean, default: false }
    }
  },
  preferences: {
    preferredGender: [String],
    ageRange: {
      min: { type: Number, default: 18, min: 13 },
      max: { type: Number, default: 30, max: 100 }
    },
    languagePreference: [String],
    culturalPreferences: {
      sameReligion: { type: Boolean, default: false },
      sameEthnicity: { type: Boolean, default: false },
      sameCulturalBackground: { type: Boolean, default: false }
    }
  },
  profileComplete: {
    type: Boolean,
    default: false
  },
  publicKey: {
    type: String,
    required: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 2dsphere index for geospatial queries
userSchema.index({ 'location.coordinates': '2dsphere' });

// Additional indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ subjectsInterested: 1 });
userSchema.index({ 'preferences.preferredGender': 1 });

// Virtual: full location string
userSchema.virtual('fullLocation').get(function () {
  return `${this.location.city}, ${this.location.state}`;
});

// Pre-save hook to ensure location is only set if complete
userSchema.pre('save', function(next) {
  if (
    this.location &&
    (
      !this.location.state ||
      !this.location.city ||
      !this.location.coordinates ||
      !Array.isArray(this.location.coordinates.coordinates) ||
      this.location.coordinates.coordinates.length !== 2
    )
  ) {
    this.location = undefined;
  }
  next();
});

// Encrypt password if not using OAuth and modified
userSchema.pre('save', async function(next) {
  if (this.oauthProvider || !this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// JWT token method
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Compare entered password to stored hash
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
