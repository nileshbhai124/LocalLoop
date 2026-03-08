# LocalLoop Backend Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. MongoDB Setup

#### Option A: Local MongoDB
1. Install MongoDB from https://www.mongodb.com/try/download/community
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get connection string
4. Whitelist your IP address

### 3. Cloudinary Setup

1. Create account at https://cloudinary.com
2. Go to Dashboard
3. Copy:
   - Cloud Name
   - API Key
   - API Secret

### 4. Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` file with your credentials:
```env
NODE_ENV=development
PORT=3001

# MongoDB
MONGODB_URI=mongodb://localhost:27017/localloop
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/localloop

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
CLIENT_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 5. Create Uploads Directory

```bash
mkdir uploads
```

### 6. Start the Server

#### Development Mode (with auto-reload)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

You should see:
```
╔═══════════════════════════════════════╗
║   LocalLoop Server Running            ║
║   Port: 3001                          ║
║   Environment: development            ║
║   Database: Connected                 ║
╚═══════════════════════════════════════╝
```

### 7. Test the API

#### Health Check
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-03-10T10:00:00.000Z"
}
```

#### Register a User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Common Issues & Solutions

### Issue: MongoDB Connection Failed

**Solution:**
- Check if MongoDB is running: `mongod --version`
- Verify MONGODB_URI in .env
- Check firewall settings
- For Atlas: Verify IP whitelist

### Issue: Port Already in Use

**Solution:**
```bash
# Find process using port 3001
# Windows
netstat -ano | findstr :3001

# macOS/Linux
lsof -i :3001

# Kill the process or change PORT in .env
```

### Issue: Cloudinary Upload Fails

**Solution:**
- Verify Cloudinary credentials in .env
- Check internet connection
- Ensure uploads/ directory exists
- Check file size (max 5MB)

### Issue: JWT Token Invalid

**Solution:**
- Ensure JWT_SECRET is set in .env
- Check token expiration
- Verify Authorization header format: `Bearer <token>`

## Development Tips

### 1. Database GUI Tools
- MongoDB Compass (Official)
- Robo 3T
- Studio 3T

### 2. API Testing Tools
- Postman
- Insomnia
- Thunder Client (VS Code extension)

### 3. Logging
Development mode includes detailed logging with Morgan.

### 4. Hot Reload
Using nodemon for automatic server restart on file changes.

## Production Deployment

### 1. Environment Variables
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=strong_random_secret_key
```

### 2. Security Checklist
- [ ] Change JWT_SECRET to strong random string
- [ ] Use production MongoDB URI
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up rate limiting
- [ ] Enable MongoDB authentication
- [ ] Use environment-specific Cloudinary account

### 3. Deployment Platforms

#### Heroku
```bash
heroku create localloop-api
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_uri
git push heroku main
```

#### DigitalOcean
1. Create Droplet
2. Install Node.js and MongoDB
3. Clone repository
4. Set up PM2 for process management
5. Configure Nginx as reverse proxy

#### AWS EC2
1. Launch EC2 instance
2. Install dependencies
3. Configure security groups
4. Set up PM2 and Nginx
5. Use AWS DocumentDB for MongoDB

### 4. Process Management (PM2)
```bash
npm install -g pm2
pm2 start server.js --name localloop-api
pm2 startup
pm2 save
```

## Monitoring

### PM2 Monitoring
```bash
pm2 monit
pm2 logs
```

### Database Monitoring
- MongoDB Atlas Dashboard
- MongoDB Compass
- Custom logging middleware

## Backup Strategy

### MongoDB Backup
```bash
# Backup
mongodump --uri="mongodb://localhost:27017/localloop" --out=/backup/

# Restore
mongorestore --uri="mongodb://localhost:27017/localloop" /backup/localloop/
```

## Support

For issues or questions:
1. Check API_DOCUMENTATION.md
2. Review error logs
3. Check MongoDB connection
4. Verify environment variables

## Next Steps

1. Connect frontend application
2. Test all API endpoints
3. Set up Socket.io client
4. Configure Cloudinary image uploads
5. Test real-time messaging
6. Deploy to production

Happy coding! 🚀
