# Security Testing Guide for LocalLoop

## Overview

This guide provides comprehensive testing procedures for the authentication and security features of LocalLoop.

## Test Environment Setup

```bash
# Install dependencies
npm install

# Set up test environment variables
cp .env.example .env.test

# Start test server
NODE_ENV=test npm run dev
```

---

## Authentication Tests

### 1. User Registration

#### Test Case 1.1: Successful Registration
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your account.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "...",
      "name": "Test User",
      "email": "test@example.com",
      "isVerified": false
    }
  }
}
```

#### Test Case 1.2: Weak Password Rejection
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test2@example.com",
    "password": "weak"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Password must be at least 8 characters long, Password must contain at least one uppercase letter..."
}
```

#### Test Case 1.3: Duplicate Email
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "User already exists"
}
```

---

### 2. User Login

#### Test Case 2.1: Successful Login
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "...",
      "name": "Test User",
      "email": "test@example.com"
    }
  }
}
```

#### Test Case 2.2: Invalid Credentials
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword123!"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

#### Test Case 2.3: Account Lockout (After 5 Failed Attempts)
```bash
# Attempt 1-5 with wrong password
for i in {1..5}; do
  curl -X POST http://localhost:3002/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "WrongPassword"
    }'
done

# 6th attempt
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response (6th attempt):**
```json
{
  "success": false,
  "message": "Account is temporarily locked due to multiple failed login attempts. Please try again later."
}
```

---

### 3. Email Verification

#### Test Case 3.1: Verify Email
```bash
# Get token from email or database
TOKEN="your_verification_token_here"

curl -X GET http://localhost:3002/api/auth/verify-email/$TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### Test Case 3.2: Invalid/Expired Token
```bash
curl -X GET http://localhost:3002/api/auth/verify-email/invalid_token
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid or expired verification token"
}
```

---

### 4. Password Reset

#### Test Case 4.1: Request Password Reset
```bash
curl -X POST http://localhost:3002/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "If an account exists with that email, a password reset link has been sent"
}
```

#### Test Case 4.2: Reset Password
```bash
# Get token from email
TOKEN="your_reset_token_here"

curl -X POST http://localhost:3002/api/auth/reset-password/$TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewSecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

#### Test Case 4.3: Password History Check
```bash
# Try to reset with old password
curl -X POST http://localhost:3002/api/auth/reset-password/$TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Cannot reuse recent passwords"
}
```

---

### 5. Protected Routes

#### Test Case 5.1: Access Without Token
```bash
curl -X GET http://localhost:3002/api/auth/me
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

#### Test Case 5.2: Access With Valid Token
```bash
TOKEN="your_jwt_token_here"

curl -X GET http://localhost:3002/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "_id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "user"
  }
}
```

#### Test Case 5.3: Access With Expired Token
```bash
# Use an expired token
curl -X GET http://localhost:3002/api/auth/me \
  -H "Authorization: Bearer expired_token"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Token expired"
}
```

---

### 6. Role-Based Access Control

#### Test Case 6.1: User Accessing User Route
```bash
USER_TOKEN="user_jwt_token"

curl -X GET http://localhost:3002/api/items \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected:** Success (200)

#### Test Case 6.2: User Accessing Admin Route
```bash
USER_TOKEN="user_jwt_token"

curl -X GET http://localhost:3002/api/admin/users \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "User role 'user' is not authorized to access this route"
}
```

#### Test Case 6.3: Admin Accessing Admin Route
```bash
ADMIN_TOKEN="admin_jwt_token"

curl -X GET http://localhost:3002/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected:** Success (200)

---

### 7. Rate Limiting

#### Test Case 7.1: Exceed Login Rate Limit
```bash
# Make 6 login requests within 15 minutes
for i in {1..6}; do
  curl -X POST http://localhost:3002/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "SecurePass123!"
    }'
  echo "\nAttempt $i"
done
```

**Expected Response (6th attempt):**
```json
{
  "success": false,
  "message": "Too many authentication attempts, please try again later"
}
```

---

### 8. Change Password

#### Test Case 8.1: Successful Password Change
```bash
TOKEN="your_jwt_token"

curl -X PUT http://localhost:3002/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePass123!",
    "newPassword": "NewSecurePass456!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### Test Case 8.2: Wrong Current Password
```bash
curl -X PUT http://localhost:3002/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "WrongPassword",
    "newPassword": "NewSecurePass456!"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

---

## Security Vulnerability Tests

### 1. SQL/NoSQL Injection

#### Test Case: NoSQL Injection in Login
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": {"$ne": null},
    "password": {"$ne": null}
  }'
```

**Expected:** Should be blocked by validation

### 2. XSS (Cross-Site Scripting)

#### Test Case: XSS in Registration
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>alert(\"XSS\")</script>",
    "email": "xss@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected:** Script tags should be sanitized

### 3. JWT Token Manipulation

#### Test Case: Modified Token
```bash
# Modify the payload of a valid JWT token
MODIFIED_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.MODIFIED_PAYLOAD.signature"

curl -X GET http://localhost:3002/api/auth/me \
  -H "Authorization: Bearer $MODIFIED_TOKEN"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid token"
}
```

### 4. CSRF (Cross-Site Request Forgery)

#### Test Case: CSRF Attack Simulation
```bash
# Attempt to make request from different origin
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://malicious-site.com" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected:** Should be blocked by CORS policy

---

## Performance Tests

### 1. Concurrent Login Requests
```bash
# Use Apache Bench or similar tool
ab -n 1000 -c 100 -p login.json -T application/json \
  http://localhost:3002/api/auth/login
```

### 2. Token Verification Performance
```bash
# Measure response time for protected routes
time curl -X GET http://localhost:3002/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Security Audit Checklist

- [ ] All passwords are hashed with bcrypt (12+ rounds)
- [ ] JWT tokens expire after configured time
- [ ] Rate limiting is active on auth endpoints
- [ ] Account lockout after failed attempts
- [ ] Email verification is required
- [ ] Password reset tokens expire
- [ ] Security events are logged
- [ ] HTTPS is enforced in production
- [ ] CORS is properly configured
- [ ] Input validation on all endpoints
- [ ] SQL/NoSQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Sensitive data not exposed in responses
- [ ] Error messages don't reveal system info
- [ ] Dependencies are up to date

---

## Automated Testing

### Jest Test Example

```javascript
describe('Authentication', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123!'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should reject weak passwords', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test2@example.com',
          password: 'weak'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
```

---

## Monitoring & Alerts

### Security Events to Monitor

1. **Failed Login Attempts**
   - Alert if > 10 failed attempts from same IP in 5 minutes

2. **Account Lockouts**
   - Alert on multiple account lockouts

3. **Password Reset Requests**
   - Alert if > 5 requests from same IP in 1 hour

4. **Suspicious Activity**
   - Multiple accounts from same IP
   - Login from unusual location
   - Rapid API requests

### Log Analysis

```bash
# Check failed login attempts
grep "login_failed" logs/security.log | wc -l

# Check account lockouts
grep "account_locked" logs/security.log

# Check password resets
grep "password_reset" logs/security.log
```

---

## Production Security Checklist

- [ ] Change JWT_SECRET to strong random string
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up email service (SendGrid, AWS SES)
- [ ] Enable rate limiting
- [ ] Set up Redis for token blacklist
- [ ] Configure monitoring (Sentry, LogRocket)
- [ ] Set up backup authentication (OAuth)
- [ ] Enable 2FA for admin accounts
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Update dependencies regularly
- [ ] Set up WAF (Web Application Firewall)
- [ ] Configure DDoS protection
- [ ] Implement IP whitelisting for admin routes

---

## Incident Response

### Steps to Take if Security Breach Detected

1. **Immediate Actions**
   - Revoke all active tokens
   - Lock affected accounts
   - Block suspicious IPs

2. **Investigation**
   - Review security logs
   - Identify breach vector
   - Assess damage

3. **Remediation**
   - Patch vulnerability
   - Force password reset for affected users
   - Update security measures

4. **Communication**
   - Notify affected users
   - Document incident
   - Report to authorities if required

5. **Prevention**
   - Implement additional security measures
   - Update security policies
   - Conduct security training

---

## Support

For security issues or questions:
- Email: security@localloop.com
- Report vulnerabilities responsibly
- Do not disclose publicly before patch
