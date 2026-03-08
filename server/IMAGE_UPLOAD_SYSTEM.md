# LocalLoop Image Upload System Documentation

## Overview
Production-ready image upload system with Cloudinary integration, featuring secure uploads, automatic optimization, and comprehensive validation.

## Features

### Core Functionality ✅
- Single and multiple image uploads
- Profile picture management
- Item image management
- Chat attachments
- Image deletion with ownership verification
- Responsive image URL generation
- Automatic image optimization

### Security Features ✅
- JWT authentication required
- File type validation (MIME type + extension)
- File size limits (5MB per image)
- Filename sanitization
- Path traversal prevention
- Ownership verification for deletions
- MIME type spoofing protection

### Performance Features ✅
- Memory storage (no disk writes)
- Cloudinary CDN delivery
- Automatic format conversion (WebP support)
- Quality optimization
- Responsive image generation
- Lazy loading support

### Image Optimization ✅
- Automatic compression
- Format selection (auto WebP)
- Responsive sizing
- Face detection for profiles
- Thumbnail generation

## Architecture

### Upload Flow
```
User → Frontend → Backend (Multer) → Validation → Cloudinary → Database → Response
```

### Folder Structure
```
localloop/
├── users/          # Profile pictures
├── items/          # Item images
├── messages/       # Chat attachments
└── thumbnails/     # Generated thumbnails
```

## Configuration

### Environment Variables
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Upload Configurations

#### Profile Pictures
- Folder: `localloop/users`
- Size: 400x400px (cropped, face detection)
- Quality: auto:good
- Format: auto (WebP preferred)
- Max file size: 5MB

#### Item Images
- Folder: `localloop/items`
- Size: 1200x900px (max, maintains aspect ratio)
- Quality: auto:good
- Format: auto (WebP preferred)
- Max file size: 5MB
- Max count: 5 images per item

#### Chat Attachments
- Folder: `localloop/messages`
- Size: 800x600px (max)
- Quality: auto:eco
- Format: auto
- Max file size: 5MB

## API Endpoints

### Upload Profile Picture
```http
POST /api/upload/profile
Authorization: Bearer <token>
Content-Type: multipart/form-data

Field: avatar (single file)
```

**Request:**
```bash
curl -X POST http://localhost:3002/api/upload/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@profile.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "avatar": "https://res.cloudinary.com/...",
    "publicId": "localloop/users/user_123_1234567890"
  }
}
```

### Upload Item Images (Multiple)
```http
POST /api/upload/item
Authorization: Bearer <token>
Content-Type: multipart/form-data

Field: images (up to 5 files)
```

**Request:**
```bash
curl -X POST http://localhost:3002/api/upload/item \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg" \
  -F "images=@image3.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Item images uploaded successfully",
  "data": [
    {
      "url": "https://res.cloudinary.com/...",
      "publicId": "localloop/items/abc123",
      "width": 1200,
      "height": 900,
      "format": "webp"
    }
  ]
}
```

### Upload Single Item Image
```http
POST /api/upload/item/single
Authorization: Bearer <token>
Content-Type: multipart/form-data

Field: image (single file)
```

### Upload Chat Attachment
```http
POST /api/upload/chat
Authorization: Bearer <token>
Content-Type: multipart/form-data

Field: attachment (single file)
```

**Response:**
```json
{
  "success": true,
  "message": "Attachment uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "localloop/messages/chat_123_1234567890",
    "thumbnail": "https://res.cloudinary.com/.../thumbnail"
  }
}
```

### Delete Image
```http
DELETE /api/upload/:publicId
Authorization: Bearer <token>
```

**Note:** Replace `/` in publicId with `-` for URL encoding.

**Example:**
```bash
# Public ID: localloop/items/abc123
# URL: /api/upload/localloop-items-abc123

curl -X DELETE http://localhost:3002/api/upload/localloop-items-abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully",
  "data": null
}
```

### Delete Multiple Images
```http
POST /api/upload/delete-multiple
Authorization: Bearer <token>
Content-Type: application/json

Body: {
  "publicIds": ["localloop/items/abc123", "localloop/items/def456"]
}
```

### Get Responsive URLs
```http
GET /api/upload/responsive/:publicId?sizes=400,800,1200
```

**Response:**
```json
{
  "success": true,
  "message": "Responsive URLs generated successfully",
  "data": [
    {
      "width": 400,
      "url": "https://res.cloudinary.com/.../w_400/..."
    },
    {
      "width": 800,
      "url": "https://res.cloudinary.com/.../w_800/..."
    },
    {
      "width": 1200,
      "url": "https://res.cloudinary.com/.../w_1200/..."
    }
  ]
}
```

### Replace Item Image
```http
PUT /api/upload/item/:itemId/image/:imageIndex
Authorization: Bearer <token>
Content-Type: multipart/form-data

Field: image (single file)
```

**Example:**
```bash
# Replace the first image (index 0) of item
curl -X PUT http://localhost:3002/api/upload/item/ITEM_ID/image/0 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@new-image.jpg"
```

## File Validation

### Allowed File Types
- MIME Types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- Extensions: `.jpg`, `.jpeg`, `.png`, `.webp`

### File Size Limits
- Maximum: 5MB per file
- Enforced at multer level

### Security Checks
1. MIME type validation
2. File extension validation
3. MIME type vs extension matching
4. Filename sanitization
5. Path traversal prevention

### Validation Errors
```json
{
  "success": false,
  "message": "Invalid file type. Allowed types: image/jpeg, image/jpg, image/png, image/webp"
}
```

```json
{
  "success": false,
  "message": "File size exceeds maximum limit of 5MB"
}
```

## Frontend Integration

### React/Next.js Example

#### Upload Profile Picture
```typescript
const uploadProfilePicture = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch('http://localhost:3002/api/upload/profile', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();
  return data;
};
```

#### Upload Multiple Item Images
```typescript
const uploadItemImages = async (files: File[]) => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('images', file);
  });

  const response = await fetch('http://localhost:3002/api/upload/item', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();
  return data;
};
```

#### Image Upload Component
```tsx
'use client';

import { useState } from 'react';

export default function ImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('Invalid file type');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB');
        return;
      }

      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/upload/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert('Upload successful!');
        console.log('Image URL:', data.data.avatar);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      {preview && (
        <img src={preview} alt="Preview" style={{ maxWidth: '200px' }} />
      )}
      
      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}
```

## Database Integration

### User Model (Avatar)
```javascript
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  avatar: {
    url: String,
    publicId: String
  }
});
```

### Item Model (Multiple Images)
```javascript
const itemSchema = new mongoose.Schema({
  title: String,
  description: String,
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});
```

### Message Model (Attachments)
```javascript
const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  message: String,
  attachments: [{
    url: String,
    publicId: String,
    thumbnail: String
  }]
});
```

## Error Handling

### Common Errors

#### No File Uploaded
```json
{
  "success": false,
  "message": "No files uploaded"
}
```

#### Invalid File Type
```json
{
  "success": false,
  "message": "Invalid file type. Allowed types: image/jpeg, image/jpg, image/png, image/webp"
}
```

#### File Too Large
```json
{
  "success": false,
  "message": "File size exceeds maximum limit of 5MB"
}
```

#### Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to delete this image"
}
```

#### Cloudinary Error
```json
{
  "success": false,
  "message": "Cloudinary upload failed: [error details]"
}
```

## Security Best Practices

### Implemented ✅
- JWT authentication for all uploads
- File type validation (MIME + extension)
- File size limits
- Filename sanitization
- Ownership verification for deletions
- MIME type spoofing protection
- Path traversal prevention
- Memory storage (no disk writes)

### Recommended
- Rate limiting on upload endpoints
- Virus scanning for uploaded files
- Content moderation (AI-based)
- Watermarking for sensitive content
- IP-based upload limits
- CAPTCHA for public uploads

## Performance Optimization

### Cloudinary Features Used
- Automatic format selection (WebP)
- Quality optimization (auto)
- CDN delivery
- Responsive images
- Lazy loading support
- Progressive JPEG

### Best Practices
- Use memory storage (no disk I/O)
- Upload directly to Cloudinary
- Store only URLs in database
- Generate thumbnails on-demand
- Use responsive images
- Implement lazy loading

## Testing

### Manual Testing

#### Test Profile Upload
```bash
curl -X POST http://localhost:3002/api/upload/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@test-image.jpg"
```

#### Test Item Images Upload
```bash
curl -X POST http://localhost:3002/api/upload/item \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

#### Test File Type Validation
```bash
# Should fail
curl -X POST http://localhost:3002/api/upload/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@document.pdf"
```

#### Test File Size Limit
```bash
# Upload file > 5MB (should fail)
curl -X POST http://localhost:3002/api/upload/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@large-image.jpg"
```

### Test Checklist
- [ ] Profile picture upload works
- [ ] Multiple item images upload works
- [ ] Single item image upload works
- [ ] Chat attachment upload works
- [ ] File type validation rejects invalid files
- [ ] File size limit enforced
- [ ] Image deletion works
- [ ] Ownership verification works
- [ ] Old images deleted when replacing
- [ ] Responsive URLs generated correctly
- [ ] Images optimized (WebP format)
- [ ] CDN delivery working

## Troubleshooting

### Cloudinary Configuration Error
```
Error: Cloudinary configuration is incomplete
```
**Solution:** Check environment variables are set correctly

### Upload Fails Silently
**Solution:** Check Cloudinary credentials and API limits

### Images Not Optimized
**Solution:** Verify transformation settings in cloudinary.js

### Large Upload Times
**Solution:** 
- Check file sizes
- Verify network connection
- Consider implementing upload progress

## Monitoring

### Metrics to Track
- Upload success rate
- Average upload time
- File size distribution
- Storage usage
- CDN bandwidth
- Error rates by type

### Cloudinary Dashboard
Monitor usage at: https://cloudinary.com/console

## Cost Optimization

### Cloudinary Free Tier
- 25 GB storage
- 25 GB bandwidth/month
- 25,000 transformations/month

### Tips to Reduce Costs
- Delete unused images
- Use appropriate quality settings
- Implement image compression
- Use lazy loading
- Cache transformed images
- Monitor usage regularly

## Future Enhancements

### Planned Features
- [ ] Video upload support
- [ ] Bulk image operations
- [ ] Image cropping/editing
- [ ] AI-based content moderation
- [ ] Automatic alt text generation
- [ ] Image compression before upload
- [ ] Progress tracking for uploads
- [ ] Drag-and-drop interface
- [ ] Image gallery management
- [ ] Backup to secondary storage

## Support

For issues:
1. Check Cloudinary dashboard for errors
2. Review server logs
3. Verify environment variables
4. Test with curl commands
5. Check file permissions

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: 2024
