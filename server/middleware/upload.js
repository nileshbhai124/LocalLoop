const multer = require('multer');
const path = require('path');
const { AppError } = require('../utils/errorHandler');

/**
 * Allowed image MIME types
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

/**
 * Allowed file extensions
 */
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Maximum file sizes (in bytes)
 */
const MAX_FILE_SIZES = {
  profile: 5 * 1024 * 1024,  // 5MB for profile pictures
  item: 5 * 1024 * 1024,     // 5MB for item images
  chat: 5 * 1024 * 1024,     // 5MB for chat attachments
  default: 5 * 1024 * 1024   // 5MB default
};

/**
 * Sanitize filename to prevent security issues
 * @param {string} filename - Original filename
 */
const sanitizeFilename = (filename) => {
  // Remove any path traversal attempts
  const basename = path.basename(filename);
  
  // Remove special characters except dots and hyphens
  const sanitized = basename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
  
  return sanitized;
};

/**
 * Validate file type
 * @param {object} file - Multer file object
 */
const validateFileType = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();
  
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
    };
  }
  
  // Check file extension
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`
    };
  }
  
  // Additional security: Check if MIME type matches extension
  const mimeExtMap = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/jpg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp']
  };
  
  const expectedExts = mimeExtMap[mimeType] || [];
  if (!expectedExts.includes(ext)) {
    return {
      valid: false,
      error: 'File extension does not match file type'
    };
  }
  
  return { valid: true };
};

/**
 * Configure multer storage (memory storage for Cloudinary)
 */
const storage = multer.memoryStorage();

/**
 * File filter function
 * @param {string} uploadType - Type of upload (profile, item, chat)
 */
const createFileFilter = (uploadType = 'default') => {
  return (req, file, cb) => {
    // Validate file type
    const validation = validateFileType(file);
    
    if (!validation.valid) {
      return cb(new AppError(validation.error, 400), false);
    }
    
    // Sanitize filename
    file.originalname = sanitizeFilename(file.originalname);
    
    cb(null, true);
  };
};

/**
 * Create multer upload middleware
 * @param {string} uploadType - Type of upload
 * @param {number} maxCount - Maximum number of files
 */
const createUploadMiddleware = (uploadType = 'default', maxCount = 1) => {
  const maxSize = MAX_FILE_SIZES[uploadType] || MAX_FILE_SIZES.default;
  
  return multer({
    storage: storage,
    fileFilter: createFileFilter(uploadType),
    limits: {
      fileSize: maxSize,
      files: maxCount
    }
  });
};

/**
 * Multer error handler middleware
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File size exceeds maximum limit of 5MB', 400));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Too many files uploaded', 400));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Unexpected field in upload', 400));
    }
    return next(new AppError(`Upload error: ${err.message}`, 400));
  }
  next(err);
};

/**
 * Pre-configured upload middlewares
 */
const uploadMiddlewares = {
  // Single profile picture
  profile: createUploadMiddleware('profile', 1).single('avatar'),
  
  // Multiple item images (up to 5)
  items: createUploadMiddleware('item', 5).array('images', 5),
  
  // Single item image
  itemSingle: createUploadMiddleware('item', 1).single('image'),
  
  // Chat attachment (single)
  chat: createUploadMiddleware('chat', 1).single('attachment'),
  
  // Multiple chat attachments (up to 3)
  chatMultiple: createUploadMiddleware('chat', 3).array('attachments', 3)
};

/**
 * Validate uploaded files exist
 */
const validateUploadedFiles = (req, res, next) => {
  if (!req.file && (!req.files || req.files.length === 0)) {
    return next(new AppError('No files uploaded', 400));
  }
  next();
};

/**
 * Log upload details (for debugging)
 */
const logUploadDetails = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    if (req.file) {
      console.log('Single file upload:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }
    if (req.files && req.files.length > 0) {
      console.log(`Multiple files upload: ${req.files.length} files`);
      req.files.forEach((file, index) => {
        console.log(`File ${index + 1}:`, {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });
      });
    }
  }
  next();
};

module.exports = {
  uploadMiddlewares,
  createUploadMiddleware,
  handleMulterError,
  validateUploadedFiles,
  logUploadDetails,
  sanitizeFilename,
  validateFileType,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZES
};
