const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  event: {
    type: String,
    required: true,
    enum: [
      'login_success',
      'login_failed',
      'logout',
      'password_change',
      'password_reset_request',
      'password_reset_success',
      'email_verification',
      'account_locked',
      'account_unlocked',
      'role_changed',
      'token_refresh',
      'suspicious_activity'
    ],
    index: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: String,
  location: {
    country: String,
    city: String,
    coordinates: [Number]
  },
  details: mongoose.Schema.Types.Mixed,
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for querying
securityLogSchema.index({ user: 1, event: 1, timestamp: -1 });
securityLogSchema.index({ ipAddress: 1, timestamp: -1 });
securityLogSchema.index({ severity: 1, timestamp: -1 });

// TTL index - Auto-delete logs older than 90 days
securityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('SecurityLog', securityLogSchema);
