const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Upload configurations for different resource types
 */
const uploadConfigs = {
  profile: {
    folder: 'localloop/users',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  },
  item: {
    folder: 'localloop/items',
    transformation: [
      { width: 1200, height: 900, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  },
  chat: {
    folder: 'localloop/messages',
    transformation: [
      { width: 800, height: 600, crop: 'limit' },
      { quality: 'auto:eco' },
      { fetch_format: 'auto' }
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  },
  thumbnail: {
    folder: 'localloop/thumbnails',
    transformation: [
      { width: 200, height: 200, crop: 'fill' },
      { quality: 'auto:low' },
      { fetch_format: 'auto' }
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
};

/**
 * Upload image to Cloudinary from buffer (memory storage)
 * @param {Buffer} buffer - Image buffer from multer
 * @param {string} type - Upload type (profile, item, chat)
 * @param {object} options - Additional upload options
 */
const uploadToCloudinary = async (buffer, type = 'item', options = {}) => {
  try {
    const config = uploadConfigs[type] || uploadConfigs.item;
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: config.folder,
          transformation: config.transformation,
          allowed_formats: config.allowed_formats,
          resource_type: 'image',
          ...options
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes,
              thumbnail: result.eager?.[0]?.secure_url || result.secure_url
            });
          }
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Upload multiple images
 * @param {Array} files - Array of file buffers
 * @param {string} type - Upload type
 */
const uploadMultipleToCloudinary = async (files, type = 'item') => {
  try {
    const uploadPromises = files.map(file => 
      uploadToCloudinary(file.buffer, type)
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    throw new Error(`Multiple upload failed: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error('Failed to delete image');
    }
    
    return result;
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array} publicIds - Array of public IDs
 */
const deleteMultipleFromCloudinary = async (publicIds) => {
  try {
    const deletePromises = publicIds.map(id => deleteFromCloudinary(id));
    return await Promise.all(deletePromises);
  } catch (error) {
    throw new Error(`Multiple delete failed: ${error.message}`);
  }
};

/**
 * Generate responsive image URLs
 * @param {string} publicId - Cloudinary public ID
 * @param {Array} sizes - Array of width sizes
 */
const generateResponsiveUrls = (publicId, sizes = [400, 800, 1200]) => {
  return sizes.map(width => ({
    width,
    url: cloudinary.url(publicId, {
      width,
      crop: 'scale',
      quality: 'auto',
      fetch_format: 'auto'
    })
  }));
};

/**
 * Get optimized image URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {object} transformations - Custom transformations
 */
const getOptimizedUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    quality: 'auto',
    fetch_format: 'auto',
    ...transformations
  });
};

/**
 * Validate Cloudinary configuration
 */
const validateConfig = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error('Cloudinary configuration is incomplete. Check environment variables.');
  }
  
  return true;
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  generateResponsiveUrls,
  getOptimizedUrl,
  validateConfig,
  uploadConfigs
};
