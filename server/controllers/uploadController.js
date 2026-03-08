const {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  generateResponsiveUrls
} = require('../config/cloudinary');
const { AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/response');
const User = require('../models/User');
const Item = require('../models/Item');

// @desc    Upload profile picture
// @route   POST /api/upload/profile
// @access  Private
exports.uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload an image', 400));
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'profile', {
      public_id: `user_${req.user.id}_${Date.now()}`
    });

    // Delete old avatar from Cloudinary if exists
    if (req.user.avatar && req.user.avatar.publicId) {
      await deleteFromCloudinary(req.user.avatar.publicId).catch(err => 
        console.error('Failed to delete old avatar:', err)
      );
    }

    // Update user avatar in database
    req.user.avatar = {
      url: result.url,
      publicId: result.publicId
    };
    await req.user.save();

    ApiResponse.success(res, {
      avatar: result.url,
      publicId: result.publicId
    }, 'Profile picture uploaded successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Upload item images
// @route   POST /api/upload/item
// @access  Private
exports.uploadItemImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError('Please upload at least one image', 400));
    }

    // Limit to 5 images
    if (req.files.length > 5) {
      return next(new AppError('Maximum 5 images allowed per item', 400));
    }

    // Upload all images to Cloudinary
    const uploadedImages = await uploadMultipleToCloudinary(req.files, 'item');

    // Format response
    const images = uploadedImages.map(img => ({
      url: img.url,
      publicId: img.publicId,
      width: img.width,
      height: img.height,
      format: img.format
    }));

    ApiResponse.success(res, images, 'Item images uploaded successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Upload single item image
// @route   POST /api/upload/item/single
// @access  Private
exports.uploadSingleItemImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload an image', 400));
    }

    const result = await uploadToCloudinary(req.file.buffer, 'item');

    ApiResponse.success(res, {
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      format: result.format
    }, 'Image uploaded successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Upload chat attachment
// @route   POST /api/upload/chat
// @access  Private
exports.uploadChatAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload an attachment', 400));
    }

    const result = await uploadToCloudinary(req.file.buffer, 'chat', {
      public_id: `chat_${req.user.id}_${Date.now()}`
    });

    ApiResponse.success(res, {
      url: result.url,
      publicId: result.publicId,
      thumbnail: result.thumbnail
    }, 'Attachment uploaded successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete image by public ID
// @route   DELETE /api/upload/:publicId
// @access  Private
exports.deleteImage = async (req, res, next) => {
  try {
    // Decode public ID (replace - with /)
    const publicId = req.params.publicId.replace(/-/g, '/');

    // Verify ownership (check if image belongs to user's items or profile)
    const isOwner = await verifyImageOwnership(req.user.id, publicId);
    
    if (!isOwner && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to delete this image', 403));
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(publicId);

    // Remove from database if it's a profile picture
    if (req.user.avatar && req.user.avatar.publicId === publicId) {
      req.user.avatar = undefined;
      await req.user.save();
    }

    ApiResponse.success(res, null, 'Image deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete multiple images
// @route   POST /api/upload/delete-multiple
// @access  Private
exports.deleteMultipleImages = async (req, res, next) => {
  try {
    const { publicIds } = req.body;

    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return next(new AppError('Please provide public IDs to delete', 400));
    }

    // Verify ownership for all images
    for (const publicId of publicIds) {
      const isOwner = await verifyImageOwnership(req.user.id, publicId);
      if (!isOwner && req.user.role !== 'admin') {
        return next(new AppError(`Not authorized to delete image: ${publicId}`, 403));
      }
    }

    // Delete from Cloudinary
    await deleteMultipleFromCloudinary(publicIds);

    ApiResponse.success(res, null, `${publicIds.length} images deleted successfully`);
  } catch (error) {
    next(error);
  }
};

// @desc    Get responsive image URLs
// @route   GET /api/upload/responsive/:publicId
// @access  Public
exports.getResponsiveUrls = async (req, res, next) => {
  try {
    const publicId = req.params.publicId.replace(/-/g, '/');
    const sizes = req.query.sizes ? req.query.sizes.split(',').map(Number) : [400, 800, 1200];

    const urls = generateResponsiveUrls(publicId, sizes);

    ApiResponse.success(res, urls, 'Responsive URLs generated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Replace item image
// @route   PUT /api/upload/item/:itemId/image/:imageIndex
// @access  Private
exports.replaceItemImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload an image', 400));
    }

    const { itemId, imageIndex } = req.params;
    const index = parseInt(imageIndex);

    // Find item
    const item = await Item.findById(itemId);
    if (!item) {
      return next(new AppError('Item not found', 404));
    }

    // Verify ownership
    if (item.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to update this item', 403));
    }

    // Validate index
    if (index < 0 || index >= item.images.length) {
      return next(new AppError('Invalid image index', 400));
    }

    // Delete old image
    const oldImage = item.images[index];
    if (oldImage.publicId) {
      await deleteFromCloudinary(oldImage.publicId).catch(err =>
        console.error('Failed to delete old image:', err)
      );
    }

    // Upload new image
    const result = await uploadToCloudinary(req.file.buffer, 'item');

    // Update item
    item.images[index] = {
      url: result.url,
      publicId: result.publicId
    };
    await item.save();

    ApiResponse.success(res, {
      url: result.url,
      publicId: result.publicId
    }, 'Image replaced successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to verify image ownership
 * @param {string} userId - User ID
 * @param {string} publicId - Cloudinary public ID
 */
const verifyImageOwnership = async (userId, publicId) => {
  try {
    // Check if it's user's profile picture
    const user = await User.findById(userId);
    if (user && user.avatar && user.avatar.publicId === publicId) {
      return true;
    }

    // Check if it's in user's items
    const item = await Item.findOne({
      owner: userId,
      'images.publicId': publicId
    });
    
    return !!item;
  } catch (error) {
    console.error('Error verifying image ownership:', error);
    return false;
  }
};

module.exports = {
  uploadProfilePicture: exports.uploadProfilePicture,
  uploadItemImages: exports.uploadItemImages,
  uploadSingleItemImage: exports.uploadSingleItemImage,
  uploadChatAttachment: exports.uploadChatAttachment,
  deleteImage: exports.deleteImage,
  deleteMultipleImages: exports.deleteMultipleImages,
  getResponsiveUrls: exports.getResponsiveUrls,
  replaceItemImage: exports.replaceItemImage
};
