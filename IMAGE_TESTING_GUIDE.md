# Image System Testing Guide

## Quick Start

### 1. Start the Development Servers

Frontend (port 3001):
```bash
npm run dev
```

Backend (port 3002):
```bash
cd server
npm start
```

### 2. Test Local Images

Visit: http://localhost:3001/browse

Expected behavior:
- All 6 item cards display images correctly
- Images: drill, camera, tent, mixer, ladder, projector
- Hover effects work smoothly
- Images maintain aspect ratio

### 3. Test Image Fallback

Temporarily break an image path in `app/browse/page.tsx`:
```typescript
images: ["/images/nonexistent.jpg"]
```

Expected behavior:
- Placeholder image displays instead
- No broken image icons
- Layout remains intact

### 4. Test Item Details Page

Click any item card to view details.

Expected behavior:
- Main image displays correctly
- Image carousel navigation works (if multiple images)
- Image indicators show current position
- Zoom/hover effects work

### 5. Test Cloudinary Integration

Once backend is running with Cloudinary configured:

1. Create a new item with image upload
2. Verify image uploads to Cloudinary
3. Check that Cloudinary URL displays on browse page
4. Confirm image loads from CDN

## Image URL Formats Supported

### Local Images
```typescript
images: ["/images/drill.jpg"]
```

### Cloudinary String URLs
```typescript
images: ["https://res.cloudinary.com/your-cloud/image/upload/v123/item.jpg"]
```

### Cloudinary Image Objects
```typescript
images: [
  {
    url: "https://res.cloudinary.com/your-cloud/image/upload/v123/item.jpg",
    publicId: "localloop/items/abc123"
  }
]
```

## Common Issues & Solutions

### Images Not Loading
1. Check Next.js dev server is running
2. Verify image files exist in `public/images/`
3. Check browser console for errors
4. Ensure `next.config.mjs` includes Cloudinary domain

### Cloudinary Images Not Loading
1. Verify Cloudinary domain in `next.config.mjs`
2. Check CORS settings on Cloudinary
3. Confirm image URLs are valid
4. Test URL directly in browser

### Placeholder Not Showing
1. Verify `/placeholder-item.jpg` exists in `public/`
2. Check error handler in component
3. Look for console errors

## Performance Testing

### Check Image Optimization
1. Open browser DevTools → Network tab
2. Filter by "Img"
3. Verify images are:
   - Served in WebP format (when supported)
   - Properly sized for viewport
   - Lazy loaded (except above fold)

### Lighthouse Audit
Run Lighthouse in Chrome DevTools:
- Performance score should be 90+
- Images should be properly sized
- Next.js Image optimization should be detected

## API Testing (Backend Integration)

### Upload Image
```bash
curl -X POST http://localhost:3002/api/upload/item \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@/path/to/image.jpg"
```

### Get Items with Images
```bash
curl http://localhost:3002/api/items
```

Response should include:
```json
{
  "images": [
    {
      "url": "https://res.cloudinary.com/...",
      "publicId": "localloop/items/..."
    }
  ]
}
```

## Browser Compatibility

Test in:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile browsers

All should display images correctly with Next.js Image component.

## Debugging Tips

### Enable Verbose Logging
Add to component:
```typescript
console.log('Image URL:', getFirstImageUrl(item.images));
```

### Check Image Load Events
```typescript
onLoad={() => console.log('Image loaded successfully')}
onError={(e) => console.error('Image failed to load:', e)}
```

### Verify Next.js Image Config
Check terminal output when starting dev server for any image configuration warnings.

## Success Criteria

✅ Local images display on browse page
✅ Placeholder shows for missing images
✅ Item details page shows images
✅ Image carousel works (multiple images)
✅ No console errors
✅ Images optimized by Next.js
✅ Cloudinary images load (when configured)
✅ Error handling prevents crashes
✅ Responsive images work on mobile

## Next Steps

After basic testing:
1. Integrate with real backend API
2. Test image upload flow
3. Verify image deletion
4. Test image replacement
5. Load test with many images
6. Optimize Cloudinary transformations
