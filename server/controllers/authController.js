const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');
const { generateToken } = require('../utils/jwt');
const { AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/response');
const { validatePassword } = require('../utils/passwordValidator');
const { 
  sendVerificationEmail, 
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendSecurityAlertEmail
} = require('../utils/emailService');
const crypto = require('crypto');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new AppError('User already exists', 400));
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return next(new AppError(passwordValidation.errors.join(', '), 400));
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    try {
      await sendVerificationEmail(user, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail registration if email fails
    }

    // Log security event
    await SecurityLog.create({
      user: user._id,
      event: 'login_success',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'low'
    });

    // Generate token
    const token = generateToken(user._id);

    ApiResponse.success(res, {
      token,
      user: user.getPublicProfile()
    }, 'User registered successfully. Please check your email to verify your account.', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      // Log failed attempt
      await SecurityLog.create({
        event: 'login_failed',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: { email, reason: 'User not found' },
        severity: 'medium'
      });
      return next(new AppError('Invalid credentials', 401));
    }

    // Check if account is locked
    if (user.isLocked) {
      await SecurityLog.create({
        user: user._id,
        event: 'login_failed',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: { reason: 'Account locked' },
        severity: 'high'
      });
      return next(new AppError('Account is temporarily locked due to multiple failed login attempts. Please try again later.', 423));
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      await SecurityLog.create({
        user: user._id,
        event: 'login_failed',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: { reason: 'Invalid password' },
        severity: 'medium'
      });
      
      return next(new AppError('Invalid credentials', 401));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new AppError('Account is deactivated', 403));
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Log successful login
    await SecurityLog.create({
      user: user._id,
      event: 'login_success',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'low'
    });

    // Generate token
    const token = generateToken(user._id);

    ApiResponse.success(res, {
      token,
      user: user.getPublicProfile()
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    ApiResponse.success(res, user, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};


// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Invalid or expired verification token', 400));
    }

    // Update user
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    // Log event
    await SecurityLog.create({
      user: user._id,
      event: 'email_verification',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'low'
    });

    ApiResponse.success(res, null, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    
    // Don't reveal if user exists
    if (!user) {
      return ApiResponse.success(res, null, 'If an account exists with that email, a password reset link has been sent');
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send email
    try {
      await sendPasswordResetEmail(user, resetToken);
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      return next(new AppError('Email could not be sent', 500));
    }

    // Log event
    await SecurityLog.create({
      user: user._id,
      event: 'password_reset_request',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'medium'
    });

    ApiResponse.success(res, null, 'If an account exists with that email, a password reset link has been sent');
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Validate new password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return next(new AppError(passwordValidation.errors.join(', '), 400));
    }

    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return next(new AppError('Invalid or expired reset token', 400));
    }

    // Check password history (prevent reuse of last 5 passwords)
    if (user.passwordHistory && user.passwordHistory.length > 0) {
      for (const oldPassword of user.passwordHistory.slice(-5)) {
        const isOldPassword = await bcrypt.compare(password, oldPassword.password);
        if (isOldPassword) {
          return next(new AppError('Cannot reuse recent passwords', 400));
        }
      }
    }

    // Save old password to history
    if (!user.passwordHistory) {
      user.passwordHistory = [];
    }
    user.passwordHistory.push({
      password: user.password,
      changedAt: Date.now()
    });

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.passwordChangedAt = Date.now();
    await user.save();

    // Send security alert
    try {
      await sendSecurityAlertEmail(user, 'Password Changed', {
        ipAddress: req.ip,
        location: 'Unknown'
      });
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }

    // Log event
    await SecurityLog.create({
      user: user._id,
      event: 'password_reset_success',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'high'
    });

    ApiResponse.success(res, null, 'Password reset successful');
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return next(new AppError(passwordValidation.errors.join(', '), 400));
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return next(new AppError('New password must be different from current password', 400));
    }

    // Check password history
    if (user.passwordHistory && user.passwordHistory.length > 0) {
      for (const oldPassword of user.passwordHistory.slice(-5)) {
        const isOldPassword = await bcrypt.compare(newPassword, oldPassword.password);
        if (isOldPassword) {
          return next(new AppError('Cannot reuse recent passwords', 400));
        }
      }
    }

    // Save old password to history
    if (!user.passwordHistory) {
      user.passwordHistory = [];
    }
    user.passwordHistory.push({
      password: user.password,
      changedAt: Date.now()
    });

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();

    // Send security alert
    try {
      await sendSecurityAlertEmail(user, 'Password Changed', {
        ipAddress: req.ip,
        location: 'Unknown'
      });
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }

    // Log event
    await SecurityLog.create({
      user: user._id,
      event: 'password_change',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'high'
    });

    ApiResponse.success(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // Log event
    await SecurityLog.create({
      user: req.user.id,
      event: 'logout',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'low'
    });

    // In a real app, you would invalidate the token here
    // For JWT, you might add it to a blacklist in Redis

    ApiResponse.success(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};
