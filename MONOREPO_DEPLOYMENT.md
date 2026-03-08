# LocalLoop Monorepo Deployment Guide

## Overview
This guide covers deploying LocalLoop as a monorepo on Vercel with Next.js API routes replacing the Express backend.

## ⚠️ Important Limitations

### Socket.io Real-Time Chat
- **Does NOT work on Vercel** (serverless functions don't support persistent WebSocket connections)
- **Options:**
  1. Use polling-based chat (HTTP requests every few seconds)
  2. Deploy Socket.io separately on Render/Railway and connect from frontend
  3. Use Vercel's Edge Functions with Pusher/Ably for real-time features

### Serverless Function Limits
- **Execution time**: 10 seconds (Hobby), 60 seconds (Pro)
- **Memory**: 1024 MB (Hobby), 3008 MB (Pro)
- **Cold starts**: First request may be slow

---

## Architecture Changes

### Before (Separate Deployment)
```
Frontend (Vercel) → Backend (Render) → MongoDB Atlas
                    ↓
                Socket.io Server
```

### After (Monorepo)
```
Vercel (Next.js + API Routes) → MongoDB Atlas
```

---

## Step 1: Install Dependencies

```bash
npm install mongoose bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

---

## Step 2: Setup Environment Variables

### Local Development (.env.local)
Create `.env.local` in project root:

```env
NEXT_PUBLIC_API_URL=/api
MONGODB_URI=mongodb://localhost:27017/localloop
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Production (Vercel Dashboard)
Add these in Vercel Project Settings → Environment Variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/localloop
JWT_SECRET=<generate-strong-random-string>
JWT_REFRESH_SECRET=<generate-another-strong-random-string>
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_API_URL=/api
```

---

## Step 3: Setup MongoDB Atlas

1. Go to https://mongodb.com/cloud/atlas
2. Create free cluster (M0 Sandbox)
3. Create database user:
   - Username: `localloop`
   - Password: (generate strong password)
4. Network Access:
   - Add IP: `0.0.0.0/0` (allow from anywhere)
   - For production, restrict to Vercel IPs
5. Get connection string:
   ```
   mongodb+srv://localloop:<password>@cluster0.xxxxx.mongodb.net/localloop?retryWrites=true&w=majority
   ```

---

## Step 4: API Routes Structure

Your API routes are now in `app/api/`:

```
app/api/
├── auth/
│   ├── login/route.ts
│   └── register/route.ts
├── items/
│   ├── route.ts (GET all, POST create)
│   └── [id]/route.ts (GET, PUT, DELETE)
└── ... (other routes)
```

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get single item
- `POST /api/items` - Create item (auth required)
- `PUT /api/items/:id` - Update item (auth required)
- `DELETE /api/items/:id` - Delete item (auth required)

---

## Step 5: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository: `nileshbhai124/LocalLoop`
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Add environment variables (from Step 2)
6. Click "Deploy"

### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## Step 6: Verify Deployment

### Test API Endpoints

```bash
# Health check
curl https://your-app.vercel.app/api/items

# Register user
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Check Logs
- Go to Vercel Dashboard → Your Project → Functions
- Click on any function to see logs
- Check for errors or connection issues

---

## Step 7: Handle Chat System

Since Socket.io doesn't work on Vercel, choose one option:

### Option 1: Polling-Based Chat (Simple)

Update `components/ChatWindow.tsx` to poll for new messages:

```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await axios.get(`/api/messages/${conversationId}`);
    setMessages(response.data.messages);
  }, 3000); // Poll every 3 seconds

  return () => clearInterval(interval);
}, [conversationId]);
```

### Option 2: Separate Socket.io Server (Recommended)

1. Deploy Socket.io server to Render/Railway (keep `server/` folder)
2. Update frontend to connect to separate WebSocket URL:
   ```typescript
   const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'https://localloop-socket.onrender.com');
   ```

### Option 3: Use Third-Party Service

- **Pusher**: https://pusher.com (free tier: 100 connections)
- **Ably**: https://ably.com (free tier: 3M messages/month)
- **PubNub**: https://pubnub.com

---

## Step 8: Optimize for Production

### Enable Edge Runtime (Optional)

For faster API responses, use Edge Runtime:

```typescript
// app/api/items/route.ts
export const runtime = 'edge';
```

### Add Caching

```typescript
export const revalidate = 60; // Revalidate every 60 seconds
```

### Optimize Images

Images are already optimized via `next/image` component.

---

## Troubleshooting

### MongoDB Connection Errors

**Error**: `MongooseServerSelectionError`

**Solution**:
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Verify connection string is correct
- Check database user has read/write permissions

### JWT Errors

**Error**: `JsonWebTokenError: invalid signature`

**Solution**:
- Ensure `JWT_SECRET` is set in Vercel environment variables
- Regenerate tokens after changing secret

### API Route Not Found

**Error**: `404 Not Found`

**Solution**:
- Check file naming: `route.ts` not `route.tsx`
- Verify folder structure matches URL pattern
- Redeploy after adding new routes

### Cold Start Delays

**Issue**: First request is slow

**Solution**:
- Use Vercel Pro for faster cold starts
- Implement connection pooling for MongoDB
- Add loading states in frontend

---

## Performance Optimization

### MongoDB Connection Pooling

Already implemented in `lib/db.ts` with global caching.

### API Response Caching

```typescript
// Cache GET requests
export const revalidate = 60; // seconds

// Or use Next.js cache
import { unstable_cache } from 'next/cache';

const getCachedItems = unstable_cache(
  async () => await Item.find(),
  ['items'],
  { revalidate: 60 }
);
```

### Image Optimization

- Use `next/image` component (already implemented)
- Cloudinary auto-optimizes images
- Enable WebP format in Cloudinary

---

## Monitoring & Logging

### Vercel Analytics

Enable in Vercel Dashboard → Analytics

### Error Tracking

Add Sentry:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Database Monitoring

MongoDB Atlas provides built-in monitoring:
- Query performance
- Connection stats
- Storage usage

---

## Cost Estimation

### Free Tier Limits

**Vercel Hobby (Free)**:
- 100 GB bandwidth/month
- 100 GB-hours serverless function execution
- Unlimited API requests

**MongoDB Atlas M0 (Free)**:
- 512 MB storage
- Shared RAM
- No backups

**Cloudinary Free**:
- 25 GB storage
- 25 GB bandwidth/month

### When to Upgrade

Upgrade when you exceed:
- 1,000+ active users
- 10,000+ items
- 100 GB bandwidth/month

---

## Security Checklist

- [ ] Strong JWT secrets (32+ characters)
- [ ] MongoDB IP whitelist configured
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] Password hashing with bcrypt
- [ ] XSS protection enabled
- [ ] CORS configured properly

---

## Backup Strategy

### MongoDB Backups

**Free Tier**: No automatic backups

**Paid Tier**: 
- Continuous backups
- Point-in-time recovery
- Download snapshots

**Manual Backup**:
```bash
mongodump --uri="mongodb+srv://..." --out=./backup
```

---

## Rollback Plan

### Revert to Previous Deployment

```bash
# Via CLI
vercel rollback

# Or in Vercel Dashboard
Deployments → Select previous → Promote to Production
```

### Database Rollback

Restore from backup:
```bash
mongorestore --uri="mongodb+srv://..." ./backup
```

---

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Setup `.env.local` with MongoDB URI
3. ✅ Test locally: `npm run dev`
4. ✅ Deploy to Vercel
5. ✅ Add environment variables in Vercel
6. ✅ Test production deployment
7. ⚠️ Decide on chat solution (polling vs separate server)
8. ✅ Setup monitoring and error tracking
9. ✅ Configure custom domain (optional)
10. ✅ Enable analytics

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Mongoose**: https://mongoosejs.com/docs/guide.html

---

## Current Status

✅ **Completed**:
- API routes for auth (login, register)
- API routes for items (CRUD)
- MongoDB connection with caching
- User and Item models
- JWT authentication
- Environment configuration

⚠️ **Pending**:
- Additional API routes (rentals, reviews, messages, etc.)
- Chat system adaptation (Socket.io alternative)
- File upload handling
- Rate limiting middleware
- Complete testing

🔄 **In Progress**:
- Converting remaining Express routes to Next.js API routes
