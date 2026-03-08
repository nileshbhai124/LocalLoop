# Deploy LocalLoop to Vercel - Quick Start

## Step 1: Setup MongoDB Atlas (5 minutes)

1. Go to https://mongodb.com/cloud/atlas
2. Click "Try Free" and sign up
3. Create a free M0 cluster:
   - Cloud Provider: AWS
   - Region: Mumbai (ap-south-1) - closest to India
   - Cluster Name: LocalLoop
4. Create Database User:
   - Click "Database Access" → "Add New Database User"
   - Username: `localloop`
   - Password: Click "Autogenerate Secure Password" (SAVE THIS!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"
5. Setup Network Access:
   - Click "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"
6. Get Connection String:
   - Click "Database" → "Connect" → "Connect your application"
   - Copy the connection string (looks like):
   ```
   mongodb+srv://localloop:<password>@localloop.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual password
   - Add database name: `mongodb+srv://localloop:YOUR_PASSWORD@localloop.xxxxx.mongodb.net/localloop?retryWrites=true&w=majority`

---

## Step 2: Generate JWT Secrets (1 minute)

Open terminal and run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it twice to get two different secrets. Save both!

Example output:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

## Step 3: Deploy to Vercel (3 minutes)

### 3.1 Go to Vercel
1. Open https://vercel.com
2. Click "Sign Up" or "Login"
3. Choose "Continue with GitHub"
4. Authorize Vercel

### 3.2 Import Project
1. Click "Add New..." → "Project"
2. Find your repository: `nileshbhai124/LocalLoop`
3. Click "Import"

### 3.3 Configure Project
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (leave as is)
- **Build Command**: `npm run build` (auto-filled)
- **Output Directory**: `.next` (auto-filled)
- **Install Command**: `npm install` (auto-filled)

### 3.4 Add Environment Variables

Click "Environment Variables" and add these:

| Name | Value |
|------|-------|
| `MONGODB_URI` | Your MongoDB connection string from Step 1 |
| `JWT_SECRET` | First secret from Step 2 |
| `JWT_REFRESH_SECRET` | Second secret from Step 2 |
| `NEXT_PUBLIC_API_URL` | `/api` |

**Example:**
```
MONGODB_URI = mongodb+srv://localloop:MyP@ssw0rd@localloop.abc123.mongodb.net/localloop?retryWrites=true&w=majority
JWT_SECRET = a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_REFRESH_SECRET = z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1
NEXT_PUBLIC_API_URL = /api
```

### 3.5 Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. You'll see "Congratulations!" when done

---

## Step 4: Test Your Deployment (2 minutes)

### 4.1 Visit Your Site
Click "Visit" or go to: `https://your-project-name.vercel.app`

### 4.2 Test Features

**✅ Should Work:**
- Browse items page
- View item details
- Register new account
- Login
- View profile
- Search and filter items

**❌ Won't Work Yet:**
- Renting items
- Sending messages
- Leaving reviews
- Notifications

### 4.3 Test Registration
1. Click "Sign Up"
2. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
3. Click "Sign Up"
4. You should see success message and be logged in

### 4.4 Test Login
1. Click "Login"
2. Use the credentials you just created
3. Should redirect to dashboard

---

## Step 5: Get Your Live URL

Your app is now live at:
```
https://your-project-name.vercel.app
```

You can also add a custom domain in Vercel settings!

---

## Troubleshooting

### Build Failed
**Check Vercel logs:**
1. Go to Vercel Dashboard
2. Click your project
3. Click "Deployments"
4. Click the failed deployment
5. Check the build logs

**Common issues:**
- Missing environment variables
- MongoDB connection string incorrect
- Syntax errors in code

### MongoDB Connection Error
**Error**: "MongooseServerSelectionError"

**Fix:**
1. Check MongoDB Atlas → Network Access
2. Ensure `0.0.0.0/0` is whitelisted
3. Verify connection string has correct password
4. Check database user has read/write permissions

### API Routes Not Working
**Error**: 404 or 500 errors

**Fix:**
1. Check Vercel → Functions tab for error logs
2. Verify environment variables are set
3. Redeploy: Vercel Dashboard → Deployments → "..." → "Redeploy"

### Images Not Loading
**Fix:**
- Images from Unsplash should work automatically
- Check browser console for errors
- Verify `next.config.mjs` has correct domains

---

## What's Next?

After deployment, you can:

1. **Share your link** with friends/testers
2. **Add custom domain** (Vercel Settings → Domains)
3. **Monitor usage** (Vercel Dashboard → Analytics)
4. **View logs** (Vercel Dashboard → Functions)

---

## Important Notes

### Free Tier Limits
- **Vercel**: 100 GB bandwidth/month
- **MongoDB Atlas**: 512 MB storage
- **No credit card required**

### Current Functionality
This deployment includes:
- ✅ Full UI/UX with 50 items
- ✅ User authentication
- ✅ Item browsing and search
- ⏳ Rentals, messages, reviews (coming soon)

### Security
- ✅ HTTPS enabled automatically
- ✅ JWT authentication
- ✅ Password hashing
- ✅ MongoDB connection encrypted

---

## Quick Reference

### Your URLs
- **Live Site**: `https://your-project-name.vercel.app`
- **Vercel Dashboard**: https://vercel.com/dashboard
- **MongoDB Atlas**: https://cloud.mongodb.com
- **GitHub Repo**: https://github.com/nileshbhai124/LocalLoop

### Support
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Docs**: https://docs.atlas.mongodb.com
- **Next.js Docs**: https://nextjs.org/docs

---

## Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string copied
- [ ] JWT secrets generated
- [ ] Vercel account created
- [ ] Repository imported to Vercel
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Site tested (registration/login)
- [ ] Live URL shared

---

**Estimated Total Time**: 10-15 minutes

**Your app will be live at**: `https://[your-project-name].vercel.app`

Good luck! 🚀
