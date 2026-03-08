const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  createdByIp: String,
  revokedAt: Date,
  revokedByIp: String,
  replacedByToken: String,
  isExpired: {
    type: Boolean,
    default: false
  },
  isRevoked: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Virtual for checking if token is active
refreshTokenSchema.virtual('isActive').get(function() {
  return !this.isRevoked && !this.isExpired && this.expiresAt > Date.now();
});

// Index for cleanup
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
