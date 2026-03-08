# LocalLoop Deployment Guide

## Overview
LocalLoop consists of two parts that need separate deployment:
1. **Frontend (Next.js)** → Deploy to Vercel
2. **Backend (Express + Socket.io)** → Deploy to Render/Railway

---

## Part 1: Deploy Backend to Render

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with your GitHub account
3. Authorize Render to access your repository

### Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `nileshbhai124/LocalLoop`
3. Configure the service:
   - **Name**: `localloop-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or paid for production)

### Step 3: Add Environment Variables
In Render dashboard, add these environment variables:

```
NODE_ENV=production
PORT=3002
MONGODB_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<generate-strong-random-string>
JWT_REFRESH_SECRET=<generate-another-strong-random-string>
CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
CLOUDINARY_API_KEY=<your-cloudinary-key>
CLOUDINARY_API_SECRET=<your-cloudinary-secret>
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<your-email>
EMAIL_PASSWORD=<your-app-password>
FRONTEND_URL=https://your-vercel-app.vercel.app
GOOGLE_MAPS_API_KEY=<your-google-maps-key>
```

### Step 4: Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Note your backend URL: `https://localloop-backend.onrender.com`

---

## Part 2: Setup MongoDB Atlas

### Step 1: Create Database
1. Go to https://mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user with password
4. Whitelist all IPs: `0.0.0.0/0` (for production, restrict this)
5. Get connection string

### Step 2: Update Connection String
Replace in Render environment variables:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/localloop?retryWrites=true&w=majority
```

---

## Part 3: Deploy Frontend to Vercel

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with your GitHub account
3. Import your repository

### Step 2: Configure Project
1. Click "Import Project"
2. Select `nileshbhai124/LocalLoop`
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Step 3: Add Environment Variables
Add this environment variable in Vercel:

```
NEXT_PUBLIC_API_URL=https://localloop-backend.onrender.com/api
```

### Step 4: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. Your app will be live at: `https://localloop-xyz.vercel.app`

### Step 5: Update Backend CORS
Update `FRONTEND_URL` in Render to your Vercel URL:
```
FRONTEND_URL=https://localloop-xyz.vercel.app
```

---

## Part 4: Setup Cloudinary

1. Go to https://cloudinary.com
2. Create free account
3. Get credentials from dashboard:
   - Cloud Name
   - API Key
   - API Secret
4. Add to Render environment variables

---

## Part 5: Post-Deployment Checklist

### Backend Health Check
```bash
curl https://localloop-backend.onrender.com/api/health
```

### Frontend Check
1. Visit your Vercel URL
2. Open browser console
3. Check for API connection errors
4. Test login/signup functionality

### Update CORS Settings
In `server/server.js`, ensure CORS allows your Vercel domain:
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
};
```

---

## Alternative: Deploy Backend to Railway

### Quick Setup
1. Go to https://railway.app
2. "New Project" → "Deploy from GitHub"
3. Select your repository
4. Set root directory: `server`
5. Add same environment variables as Render
6. Railway will auto-detect Node.js and deploy

---

## Environment Variables Summary

### Backend (Render/Railway)
```env
NODE_ENV=production
PORT=3002
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=https://your-app.vercel.app
GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

---

## Important Notes

### Free Tier Limitations
- **Render Free**: Backend sleeps after 15 min inactivity (cold starts)
- **Vercel Free**: 100GB bandwidth/month, serverless functions
- **MongoDB Atlas Free**: 512MB storage

### Production Recommendations
1. Use paid tiers for better performance
2. Set up custom domain
3. Enable HTTPS (automatic on Vercel/Render)
4. Configure proper CORS origins
5. Set up monitoring (Sentry, LogRocket)
6. Enable rate limiting
7. Set up backup strategy for MongoDB

### Socket.io Considerations
- Socket.io works on Render/Railway (persistent connections)
- Won't work well on Vercel serverless
- Consider using Vercel + separate WebSocket service

---

## Troubleshooting

### Backend not connecting
- Check Render logs
- Verify MongoDB connection string
- Check environment variables

### Frontend API errors
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check browser console for CORS errors
- Ensure backend is running

### Images not loading
- Verify Cloudinary credentials
- Check image domains in `next.config.mjs`
- Test Cloudinary upload manually

---

## Quick Deploy Commands

### Update and Redeploy
```bash
# Make changes
git add .
git commit -m "Update for production"
git push origin main

# Vercel and Render will auto-deploy
```

### Manual Vercel Deploy
```bash
npm install -g vercel
vercel --prod
```

---

## Support Resources
- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- Next.js Deployment: https://nextjs.org/docs/deployment
