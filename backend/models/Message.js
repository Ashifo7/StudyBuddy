const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  chatRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true,
    index: true
  },
  content: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return this.type !== 'text' || (v && v.length > 0 && v.length <= 5000);
      },
      message: 'Text messages must be between 1 and 5000 characters'
    }
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'link', 'studyMaterial'],
    default: 'text'
  },
  mediaUrl: String,
  metadata: {
    fileName: { type: String, trim: true },
    fileSize: Number,
    mimeType: String,
    dimensions: {
      width: Number,
      height: Number
    },
    duration: Number,
    thumbnail: String
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent',
    index: true
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: Date
  }],
  replyTo: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    content: String
  },
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: { type: String, trim: true },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  deletedAt: Date,
  studySessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudySession'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
messageSchema.index({ chatRoomId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, createdAt: -1 });

// Virtual: Check if message is deletable (within 24h)
messageSchema.virtual('isDeletable').get(function () {
  if (!this.createdAt) return false;
  const hours = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
  return hours <= 24;
});

// Mark message as read
messageSchema.methods.markAsRead = async function (userId) {
  const alreadyRead = this.readBy.some(read => read.userId.equals(userId));
  if (!alreadyRead) {
    this.readBy.push({ userId, readAt: new Date() });
    await this.save();
  }
};

// Add or update a reaction
messageSchema.methods.addReaction = async function (userId, reactionType) {
  const reaction = this.reactions.find(r => r.userId.equals(userId));
  if (reaction) {
    reaction.type = reactionType;
  } else {
    this.reactions.push({ userId, type: reactionType });
  }
  await this.save();
};

// Pre-save hook for edit tracking
messageSchema.pre('save', function (next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editHistory.push({
      content: this.content,
      editedAt: new Date()
    });
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);
