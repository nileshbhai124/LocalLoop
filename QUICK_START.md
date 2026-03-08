# LocalLoop - Quick Start Guide

## Start Development Servers

### Frontend (Port 3001)
```bash
npm run dev
```
Visit: http://localhost:3001

### Backend (Port 3002)
```bash
cd server
npm start
```
API: http://localhost:3002/api

## Test Image Display

1. Open http://localhost:3001/browse
2. Verify 6 item cards show images
3. Click any item to view details
4. Check image carousel works

## Project Structure

```
localloop/
├── app/                    # Next.js pages
│   ├── browse/            # Browse items
│   ├── items/[id]/        # Item details
│   ├── dashboard/         # User dashboard
│   ├── login/             # Login page
│   └── signup/            # Signup page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── ItemCard.tsx      # Item display card
│   └── ChatWindow.tsx    # Chat interface
├── lib/                   # Utilities
│   ├── imageUtils.ts     # Image helpers
│   ├── axios.ts          # API client
│   └── utils.ts          # General utilities
├── public/               # Static files
│   └── images/           # Product images
├── server/               # Backend API
│   ├── controllers/      # Route handlers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   └── sockets/          # WebSocket handlers
└── types/                # TypeScript types

```

## Key Features

### Implemented ✅
- Image display with Cloudinary support
- Responsive UI with Tailwind CSS
- Item browsing and search
- User authentication (UI)
- Real-time chat system
- Image upload system
- Geolocation features
- Damage deposit system

### Backend API Endpoints
- `/api/auth/*` - Authentication
- `/api/items/*` - Item management
- `/api/upload/*` - Image uploads
- `/api/messages/*` - Messaging
- `/api/rentals/*` - Rental management
- `/api/damage/*` - Damage reports

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3002/api
```

### Backend (server/.env)
```
PORT=3002
MONGODB_URI=mongodb://localhost:27017/localloop
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Common Commands

### Install Dependencies
```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### Build for Production
```bash
# Frontend
npm run build
npm start

# Backend
cd server
npm start
```

### Run Tests
```bash
# Backend
cd server
npm test
```

## Documentation

- `README.md` - Project overview
- `IMAGE-FIX-SUMMARY.md` - Image system details
- `IMAGE_TESTING_GUIDE.md` - Testing instructions
- `FRONTEND_STATUS.md` - Frontend status
- `server/API_DOCUMENTATION.md` - API reference
- `server/DATABASE_ARCHITECTURE.md` - Database schema
- `server/SECURITY_AUTHENTICATION.md` - Auth system
- `server/CHAT_SYSTEM_README.md` - Chat features
- `server/IMAGE_UPLOAD_SYSTEM.md` - Upload system
- `server/GEOLOCATION_SYSTEM.md` - Location features
- `server/DAMAGE_DEPOSIT_SYSTEM.md` - Deposit handling

## Troubleshooting

### Images Not Loading
1. Check dev server is running
2. Verify files exist in `public/images/`
3. Check browser console for errors

### API Connection Failed
1. Verify backend is running on port 3002
2. Check CORS settings in backend
3. Verify API URL in frontend config

### Port Already in Use
```bash
# Kill process on port 3001
npx kill-port 3001

# Kill process on port 3002
npx kill-port 3002
```

## Support

For issues or questions:
1. Check documentation files
2. Review error logs in terminal
3. Check browser console
4. Verify environment variables

## Next Steps

1. Test image display
2. Connect to real backend API
3. Test authentication flow
4. Upload images via API
5. Test real-time chat
6. Deploy to production
