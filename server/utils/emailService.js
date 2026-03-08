const nodemailer = require('nodemailer');

/**
 * Email service for sending authentication emails
 */

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

/**
 * Send verification email
 * @param {Object} user - User object
 * @param {string} token - Verification token
 */
const sendVerificationEmail = async (user, token) => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: user.email,
    subject: 'Verify Your Email - LocalLoop',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16A34A;">Welcome to LocalLoop!</h2>
        <p>Hi ${user.name},</p>
        <p>Thank you for registering with LocalLoop. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #16A34A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">LocalLoop - Share What You Don't Need, Borrow What You Do</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send password reset email
 * @param {Object} user - User object
 * @param {string} token - Reset token
 */
const sendPasswordResetEmail = async (user, token) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: user.email,
    subject: 'Password Reset Request - LocalLoop',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16A34A;">Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #16A34A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p><strong>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</strong></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">LocalLoop - Share What You Don't Need, Borrow What You Do</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send welcome email
 * @param {Object} user - User object
 */
const sendWelcomeEmail = async (user) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: user.email,
    subject: 'Welcome to LocalLoop!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16A34A;">Welcome to LocalLoop!</h2>
        <p>Hi ${user.name},</p>
        <p>Your email has been verified successfully. You're all set to start sharing and borrowing items in your neighborhood!</p>
        <h3>What's Next?</h3>
        <ul>
          <li>Complete your profile</li>
          <li>Browse items in your area</li>
          <li>List your first item</li>
          <li>Connect with neighbors</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/dashboard" 
             style="background-color: #16A34A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        <p>Happy sharing!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">LocalLoop - Share What You Don't Need, Borrow What You Do</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

/**
 * Send security alert email
 * @param {Object} user - User object
 * @param {string} event - Security event
 * @param {Object} details - Event details
 */
const sendSecurityAlertEmail = async (user, event, details) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: user.email,
    subject: 'Security Alert - LocalLoop',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DC2626;">Security Alert</h2>
        <p>Hi ${user.name},</p>
        <p>We detected a security event on your account:</p>
        <div style="background-color: #FEE2E2; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <strong>Event:</strong> ${event}<br>
          <strong>Time:</strong> ${new Date().toLocaleString()}<br>
          <strong>IP Address:</strong> ${details.ipAddress || 'Unknown'}<br>
          <strong>Location:</strong> ${details.location || 'Unknown'}
        </div>
        <p>If this was you, you can safely ignore this email.</p>
        <p><strong>If this wasn't you, please secure your account immediately:</strong></p>
        <ul>
          <li>Change your password</li>
          <li>Review your account activity</li>
          <li>Contact support if needed</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/security" 
             style="background-color: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Secure My Account
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">LocalLoop - Share What You Don't Need, Borrow What You Do</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Security alert email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending security alert email:', error);
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendSecurityAlertEmail
};
