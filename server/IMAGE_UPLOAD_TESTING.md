# Image Upload System - Testing Guide

## Overview
Comprehensive testing procedures for the LocalLoop image upload system with Cloudinary integration.

## Prerequisites
- Server running on http://localhost:3002
- Valid JWT token from authentication
- Cloudinary account configured
- Test images in various formats and sizes

---

## Test Categories

### 1. Configuration Testing

#### Test 1.1: Cloudinary Configuration
```bash
# Check if environment variables are set
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
echo $CLOUDINARY_API_SECRET
```

**Expected Result**: All variables should have values

#### Test 1.2: Server Startup
```bash
cd server
npm run dev
```

**Expected Result**: Server starts without Cloudinary configuration errors

---

## 2. Profile Picture Upload

### Test 2.1: Valid Profile Upload
```bash
curl -X POST http://localhost:3002/api/upload/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@test-profile.jpg"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "avatar": "https://res.cloudinary.com/...",
    "publicId": "localloop/users/user_..."
  }
}
```

**Verify:**
- Image uploaded to Cloudinary
- Image size is 400x400px
- Format is WebP (optimized)
- User avatar updated in database

### Test 2.2: Replace Existing Profile Picture
1. Upload first profile picture
2. Upload second profile picture

**Expected Result**: 
- Old image deleted from Cloudinary
- New image uploaded
- Database updated with new URL

### Test 2.3: Invalid File Type
```bash
curl -X POST http://localhost:3002/api/upload/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@document.pdf"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid file type. Allowed types: image/jpeg, image/jpg, image/png, image/webp"
}
```

### Test 2.4: File Too Large
```bash
# Upload file > 5MB
curl -X POST http://localhost:3002/api/upload/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@large-image.jpg"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "File size exceeds maximum limit of 5MB"
}
```

### Test 2.5: No File Provided
```bash
curl -X POST http://localhost:3002/api/upload/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "No files uploaded"
}
```

### Test 2.6: Unauthenticated Request
```bash
curl -X POST http://localhost:3002/api/upload/profile \
  -F "avatar=@test-profile.jpg"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

---

## 3. Item Images Upload

### Test 3.1: Multiple Images Upload
```bash
curl -X POST http://localhost:3002/api/upload/item \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "images=@item1.jpg" \
  -F "images=@item2.jpg" \
  -F "images=@item3.jpg"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Item images uploaded successfully",
  "data": [
    {
      "url": "https://res.cloudinary.com/...",
      "publicId": "localloop/items/...",
      "width": 1200,
      "height": 900,
      "format": "webp"
    }
  ]
}
```

**Verify:**
- All images uploaded
- Max dimensions 1200x900px
- Format optimized to WebP
- All images in localloop/items folder

### Test 3.2: Maximum Image Count
```bash
# Upload 6 images (max is 5)
curl -X POST http://localhost:3002/api/upload/item \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "images=@img1.jpg" \
  -F "images=@img2.jpg" \
  -F "images=@img3.jpg" \
  -F "images=@img4.jpg" \
  -F "images=@img5.jpg" \
  -F "images=@img6.jpg"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Too many files uploaded"
}
```

### Test 3.3: Single Item Image
```bash
curl -X POST http://localhost:3002/api/upload/item/single \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@item-single.jpg"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "localloop/items/...",
    "width": 1200,
    "height": 900,
    "format": "webp"
  }
}
```

### Test 3.4: Mixed Valid/Invalid Files
```bash
curl -X POST http://localhost:3002/api/upload/item \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "images=@valid.jpg" \
  -F "images=@invalid.txt"
```

**Expected Result**: Request rejected before any upload

---

## 4. Chat Attachments

### Test 4.1: Single Chat Attachment
```bash
curl -X POST http://localhost:3002/api/upload/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "attachment=@chat-image.jpg"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Attachment uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "localloop/messages/chat_...",
    "thumbnail": "https://res.cloudinary.com/.../thumbnail"
  }
}
```

**Verify:**
- Image uploaded to localloop/messages
- Max size 800x600px
- Thumbnail generated

---

## 5. Image Deletion

### Test 5.1: Delete Own Image
```bash
# First upload an image and get publicId
# Then delete it (replace / with -)
curl -X DELETE http://localhost:3002/api/upload/localloop-items-abc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully",
  "data": null
}
```

**Verify:**
- Image deleted from Cloudinary
- Image reference removed from database

### Test 5.2: Delete Someone Else's Image
```bash
# Try to delete image owned by another user
curl -X DELETE http://localhost:3002/api/upload/localloop-items-other-user-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Not authorized to delete this image"
}
```

### Test 5.3: Delete Multiple Images
```bash
curl -X POST http://localhost:3002/api/upload/delete-multiple \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "publicIds": [
      "localloop/items/abc123",
      "localloop/items/def456"
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "2 images deleted successfully",
  "data": null
}
```

### Test 5.4: Delete Non-Existent Image
```bash
curl -X DELETE http://localhost:3002/api/upload/localloop-items-nonexistent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Result**: Success (Cloudinary returns "not found" but doesn't error)

---

## 6. Image Replacement

### Test 6.1: Replace Item Image
```bash
# Replace first image (index 0) of an item
curl -X PUT http://localhost:3002/api/upload/item/ITEM_ID/image/0 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@new-image.jpg"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Image replaced successfully",
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "localloop/items/..."
  }
}
```

**Verify:**
- Old image deleted from Cloudinary
- New image uploaded
- Item images array updated

### Test 6.2: Invalid Image Index
```bash
# Try to replace image at index 10 (doesn't exist)
curl -X PUT http://localhost:3002/api/upload/item/ITEM_ID/image/10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@new-image.jpg"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid image index"
}
```

### Test 6.3: Replace Image of Someone Else's Item
```bash
curl -X PUT http://localhost:3002/api/upload/item/OTHER_USER_ITEM_ID/image/0 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@new-image.jpg"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Not authorized to update this item"
}
```

---

## 7. Responsive URLs

### Test 7.1: Generate Responsive URLs
```bash
curl -X GET "http://localhost:3002/api/upload/responsive/localloop-items-abc123?sizes=400,800,1200"
```

**Expected Response:**
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

### Test 7.2: Default Sizes
```bash
curl -X GET "http://localhost:3002/api/upload/responsive/localloop-items-abc123"
```

**Expected Result**: Returns URLs for default sizes (400, 800, 1200)

---

## 8. File Validation

### Test 8.1: MIME Type Spoofing
```bash
# Rename .txt file to .jpg and try to upload
curl -X POST http://localhost:3002/api/upload/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@fake-image.jpg"
```

**Expected Result**: Rejected due to MIME type mismatch

### Test 8.2: Path Traversal Attempt
```bash
curl -X POST http://localhost:3002/api/upload/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@../../etc/passwd"
```

**Expected Result**: Filename sanitized, path traversal prevented

### Test 8.3: Special Characters in Filename
```bash
curl -X POST http://localhost:3002/api/upload/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@test<script>alert('xss')</script>.jpg"
```

**Expected Result**: Filename sanitized, special characters removed

---

## 9. Performance Testing

### Test 9.1: Upload Speed
```bash
time curl -X POST http://localhost:3002/api/upload/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@test-image.jpg"
```

**Expected Result**: Upload completes in < 3 seconds

### Test 9.2: Concurrent Uploads
```bash
# Upload 5 images simultaneously
for i in {1..5}; do
  curl -X POST http://localhost:3002/api/upload/item/single \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -F "image=@test-$i.jpg" &
done
wait
```

**Expected Result**: All uploads succeed

### Test 9.3: Large File Upload
```bash
# Upload 4.9MB file (just under limit)
curl -X POST http://localhost:3002/api/upload/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@large-4.9mb.jpg"
```

**Expected Result**: Upload succeeds

---

## 10. Image Optimization

### Test 10.1: WebP Conversion
1. Upload JPEG image
2. Check response format

**Expected Result**: Format should be "webp"

### Test 10.2: Quality Optimization
1. Upload high-quality image
2. Compare original size vs uploaded size

**Expected Result**: Uploaded image should be smaller

### Test 10.3: Responsive Sizing
1. Upload 3000x2000px image
2. Check uploaded dimensions

**Expected Result**: 
- Profile: 400x400px
- Item: Max 1200x900px (maintains aspect ratio)

---

## 11. Integration Testing

### Test 11.1: Complete Item Creation Flow
1. Register user
2. Login to get token
3. Upload item images
4. Create item with image URLs
5. Verify item has images

### Test 11.2: Profile Update Flow
1. Login user
2. Upload profile picture
3. Get user profile
4. Verify avatar URL present

### Test 11.3: Image Deletion on Item Delete
1. Create item with images
2. Delete item
3. Verify images deleted from Cloudinary

---

## 12. Error Handling

### Test 12.1: Cloudinary API Error
1. Set invalid Cloudinary credentials
2. Try to upload image

**Expected Result**: Proper error message returned

### Test 12.2: Network Timeout
1. Simulate slow network
2. Upload large image

**Expected Result**: Timeout handled gracefully

### Test 12.3: Database Error
1. Disconnect database
2. Try to upload profile picture

**Expected Result**: Error caught and returned

---

## Automated Testing Script

```bash
#!/bin/bash

# Set variables
API_URL="http://localhost:3002/api/upload"
TOKEN="your_jwt_token_here"

echo "Starting Image Upload System Tests..."

# Test 1: Profile Upload
echo "Test 1: Profile Upload"
curl -X POST $API_URL/profile \
  -H "Authorization: Bearer $TOKEN" \
  -F "avatar=@test-profile.jpg" \
  -w "\nStatus: %{http_code}\n"

# Test 2: Item Images Upload
echo "Test 2: Item Images Upload"
curl -X POST $API_URL/item \
  -H "Authorization: Bearer $TOKEN" \
  -F "images=@item1.jpg" \
  -F "images=@item2.jpg" \
  -w "\nStatus: %{http_code}\n"

# Test 3: Invalid File Type
echo "Test 3: Invalid File Type"
curl -X POST $API_URL/profile \
  -H "Authorization: Bearer $TOKEN" \
  -F "avatar=@document.pdf" \
  -w "\nStatus: %{http_code}\n"

# Test 4: File Too Large
echo "Test 4: File Too Large"
curl -X POST $API_URL/profile \
  -H "Authorization: Bearer $TOKEN" \
  -F "avatar=@large-image.jpg" \
  -w "\nStatus: %{http_code}\n"

# Test 5: Unauthenticated
echo "Test 5: Unauthenticated"
curl -X POST $API_URL/profile \
  -F "avatar=@test-profile.jpg" \
  -w "\nStatus: %{http_code}\n"

echo "Tests completed!"
```

---

## Test Checklist

### Basic Functionality
- [ ] Profile picture upload works
- [ ] Multiple item images upload works
- [ ] Single item image upload works
- [ ] Chat attachment upload works
- [ ] Image deletion works
- [ ] Multiple image deletion works
- [ ] Image replacement works
- [ ] Responsive URLs generated

### Security
- [ ] Authentication required
- [ ] File type validation works
- [ ] File size limit enforced
- [ ] MIME type spoofing prevented
- [ ] Path traversal prevented
- [ ] Filename sanitization works
- [ ] Ownership verification works

### Optimization
- [ ] Images converted to WebP
- [ ] Images compressed
- [ ] Correct dimensions applied
- [ ] CDN delivery working
- [ ] Thumbnails generated

### Error Handling
- [ ] Invalid file type rejected
- [ ] File too large rejected
- [ ] No file uploaded handled
- [ ] Unauthorized access blocked
- [ ] Non-existent image handled
- [ ] Invalid index handled

---

## Performance Benchmarks

### Expected Performance
- Profile upload: < 2 seconds
- Item images (3 images): < 5 seconds
- Image deletion: < 1 second
- Responsive URL generation: < 100ms

### Load Testing
```bash
# Test with Apache Bench
ab -n 100 -c 10 -H "Authorization: Bearer TOKEN" \
  -p upload-data.txt \
  -T "multipart/form-data; boundary=----WebKitFormBoundary" \
  http://localhost:3002/api/upload/profile
```

---

## Troubleshooting

### Upload Fails
1. Check Cloudinary credentials
2. Verify file type and size
3. Check authentication token
4. Review server logs

### Images Not Optimized
1. Verify Cloudinary transformation settings
2. Check upload configuration
3. Test with different image formats

### Slow Uploads
1. Check file sizes
2. Verify network connection
3. Monitor Cloudinary dashboard
4. Check server resources

---

**Status**: Ready for Testing
**Last Updated**: 2024
