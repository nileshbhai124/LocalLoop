const express = require('express');
const router = express.Router();
const {
  uploadProfilePicture,
  uploadItemImages,
  uploadSingleItemImage,
  uploadChatAttachment,
  deleteImage,
  deleteMultipleImages,
  getResponsiveUrls,
  replaceItemImage
} = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const {
  uploadMiddlewares,
  handleMulterError,
  validateUploadedFiles,
  logUploadDetails
} = require('../middleware/upload');

// Profile picture upload
router.post(
  '/profile',
  protect,
  uploadMiddlewares.profile,
  handleMulterError,
  validateUploadedFiles,
  logUploadDetails,
  uploadProfilePicture
);

// Item images upload (multiple)
router.post(
  '/item',
  protect,
  uploadMiddlewares.items,
  handleMulterError,
  validateUploadedFiles,
  logUploadDetails,
  uploadItemImages
);

// Single item image upload
router.post(
  '/item/single',
  protect,
  uploadMiddlewares.itemSingle,
  handleMulterError,
  validateUploadedFiles,
  logUploadDetails,
  uploadSingleItemImage
);

// Chat attachment upload
router.post(
  '/chat',
  protect,
  uploadMiddlewares.chat,
  handleMulterError,
  validateUploadedFiles,
  logUploadDetails,
  uploadChatAttachment
);

// Replace specific item image
router.put(
  '/item/:itemId/image/:imageIndex',
  protect,
  uploadMiddlewares.itemSingle,
  handleMulterError,
  validateUploadedFiles,
  logUploadDetails,
  replaceItemImage
);

// Delete single image
router.delete('/:publicId', protect, deleteImage);

// Delete multiple images
router.post('/delete-multiple', protect, deleteMultipleImages);

// Get responsive URLs (public)
router.get('/responsive/:publicId', getResponsiveUrls);

module.exports = router;
