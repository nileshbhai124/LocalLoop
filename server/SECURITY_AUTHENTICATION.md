# LocalLoop Authentication & Security System

## Overview

Production-ready authentication system with JWT, role-based access control, and comprehensive security measures.

## Security Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. Login Request
       ▼
┌─────────────────────┐
│  Auth Controller    │
│  - Validate Input   │
│  - Verify Password  │
│  - Generate JWT     │
└──────┬──────────────┘
       │ 2. JWT Token
       ▼
┌─────────────┐
│   Client    │ (Stores token)
└──────┬──────┘
       │ 3. API Request + JWT
       ▼
┌─────────────────────┐
│  Auth Middleware    │
│  - Verify Token     │
│  - Extract User     │
│  - Check Permissions│
└──────┬──────────────┘
       │ 4. Authorized
       ▼
┌─────────────────────┐
│  Protected Route    │
└─────────────────────┘
```

## Features Implemented

✅ User Registration with validation
✅ Secure Login with bcrypt
✅ JWT Token Authentication
✅ Password Reset Flow
✅ Email Verification
✅ Role-Based Access Control (RBAC)
✅ Rate Limiting
✅ Input Sanitization
✅ Security Headers (Helmet)
✅ Token Refresh
✅ Account Lockout
✅ Audit Logging

---

## Authentication Flow

### 1. Registration Flow

```
User → Submit Form → Validate Input → Hash Password → 
Create User → Generate JWT → Send Verification Email → 
Return Token
```

### 2. Login Flow

```
User → Submit Credentials → Validate Input → 
Find User → Compare Password → Check Account Status → 
Generate JWT → Update Last Login → Return Token
```

### 3. Protected Route Access

```
Request → Extract Token → Verify Token → 
Decode Payload → Attach User → Check Permissions → 
Allow/Deny Access
```

---

## Security Measures

### Password Security
- **Hashing**: bcrypt with 12 salt rounds
- **Minimum Length**: 8 characters
- **Complexity**: Uppercase, lowercase, number, special char
- **History**: Prevent reuse of last 5 passwords

### Token Security
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiration**: 7 days (configurable)
- **Refresh**: 30 days refresh token
- **Blacklist**: Revoked tokens stored in Redis/DB

### Rate Limiting
- **Login**: 5 attempts per 15 minutes
- **Registration**: 3 attempts per hour
- **Password Reset**: 3 attempts per hour
- **API**: 100 requests per 15 minutes

### Account Protection
- **Lockout**: After 5 failed login attempts
- **Unlock**: Automatic after 30 minutes or manual
- **2FA**: Optional two-factor authentication
- **Session Management**: Track active sessions

---

## API Endpoints

### Public Routes
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password
- `GET /api/auth/verify-email/:token` - Verify email

### Protected Routes
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/refresh-token` - Refresh JWT token
- `GET /api/auth/sessions` - Get active sessions

### Admin Routes
- `GET /api/auth/users` - List all users
- `PUT /api/auth/users/:id/role` - Update user role
- `POST /api/auth/users/:id/lock` - Lock user account
- `POST /api/auth/users/:id/unlock` - Unlock user account

---

## Environment Variables

```env
# JWT Configuration
JWT_SECRET=your_super_secret_key_min_32_characters
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRE=30d

# Bcrypt
BCRYPT_ROUNDS=12

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=noreply@localloop.com
FROM_NAME=LocalLoop

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=1800000

# URLs
CLIENT_URL=http://localhost:3000
API_URL=http://localhost:3002
```

---

## User Roles & Permissions

### Role Hierarchy

```
admin > moderator > user > guest
```

### Permissions Matrix

| Action | Guest | User | Moderator | Admin |
|--------|-------|------|-----------|-------|
| View Items | ✅ | ✅ | ✅ | ✅ |
| List Items | ❌ | ✅ | ✅ | ✅ |
| Borrow Items | ❌ | ✅ | ✅ | ✅ |
| Send Messages | ❌ | ✅ | ✅ | ✅ |
| Leave Reviews | ❌ | ✅ | ✅ | ✅ |
| Moderate Content | ❌ | ❌ | ✅ | ✅ |
| Ban Users | ❌ | ❌ | ❌ | ✅ |
| System Config | ❌ | ❌ | ❌ | ✅ |

---

## Security Best Practices

### 1. Password Requirements
```javascript
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Not in common password list
```

### 2. Token Management
```javascript
- Store tokens in httpOnly cookies (preferred)
- Or localStorage with XSS protection
- Never expose tokens in URLs
- Implement token rotation
- Blacklist revoked tokens
```

### 3. Input Validation
```javascript
- Sanitize all inputs
- Validate email format
- Check password strength
- Prevent SQL/NoSQL injection
- Escape special characters
```

### 4. Error Handling
```javascript
- Don't reveal user existence
- Generic error messages
- Log security events
- Monitor failed attempts
- Alert on suspicious activity
```

---

## Testing Authentication

### Register User
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Login
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Access Protected Route
```bash
curl -X GET http://localhost:3002/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Forgot Password
```bash
curl -X POST http://localhost:3002/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

---

## Monitoring & Logging

### Security Events to Log
- Failed login attempts
- Account lockouts
- Password changes
- Role changes
- Token generation
- Suspicious activities

### Log Format
```json
{
  "timestamp": "2024-03-10T10:00:00Z",
  "event": "failed_login",
  "userId": "user_id",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "details": "Invalid password"
}
```

---

## Compliance

### GDPR Compliance
- User data encryption
- Right to be forgotten
- Data export functionality
- Privacy policy acceptance
- Cookie consent

### OWASP Top 10 Protection
✅ Injection Prevention
✅ Broken Authentication Protection
✅ Sensitive Data Exposure Prevention
✅ XML External Entities (XXE) Protection
✅ Broken Access Control Prevention
✅ Security Misconfiguration Prevention
✅ Cross-Site Scripting (XSS) Prevention
✅ Insecure Deserialization Prevention
✅ Using Components with Known Vulnerabilities Prevention
✅ Insufficient Logging & Monitoring Prevention

---

## Troubleshooting

### Common Issues

**Issue**: "Invalid token"
- **Solution**: Check token expiration, verify JWT_SECRET

**Issue**: "Account locked"
- **Solution**: Wait for lockout duration or contact admin

**Issue**: "Email not verified"
- **Solution**: Resend verification email

**Issue**: "Rate limit exceeded"
- **Solution**: Wait for rate limit window to reset

---

## Production Checklist

- [ ] Change JWT_SECRET to strong random string
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up email service (SendGrid, AWS SES)
- [ ] Enable rate limiting
- [ ] Set up Redis for token blacklist
- [ ] Configure monitoring (Sentry, LogRocket)
- [ ] Set up backup authentication (OAuth)
- [ ] Enable 2FA for admin accounts
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Update dependencies regularly

---

## Additional Security Features

### 1. Two-Factor Authentication (2FA)
```javascript
- TOTP (Time-based One-Time Password)
- SMS verification
- Email verification codes
- Backup codes
```

### 2. OAuth Integration
```javascript
- Google OAuth
- Facebook OAuth
- GitHub OAuth
- Apple Sign In
```

### 3. Session Management
```javascript
- Track active sessions
- Remote logout
- Device management
- Suspicious login alerts
```

### 4. IP Whitelisting
```javascript
- Admin IP restrictions
- Geo-blocking
- VPN detection
- Proxy detection
```

---

## Support & Maintenance

### Regular Tasks
- Review security logs weekly
- Update dependencies monthly
- Rotate JWT secrets quarterly
- Security audit annually
- Penetration testing annually

### Emergency Response
1. Detect security breach
2. Revoke all tokens
3. Force password reset
4. Notify affected users
5. Patch vulnerability
6. Document incident
7. Improve security measures
