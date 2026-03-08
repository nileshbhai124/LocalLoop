const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');

// Validation middleware to check for errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return next(new AppError(errorMessages.join(', '), 400));
  }
  next();
};

// User validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate
];

// Item validation rules
const createItemValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['Tools', 'Electronics', 'Books', 'Sports Equipment', 'Kitchen', 'Garden', 'Other'])
    .withMessage('Invalid category'),
  body('condition')
    .notEmpty().withMessage('Condition is required')
    .isIn(['new', 'like-new', 'good', 'fair'])
    .withMessage('Invalid condition'),
  body('pricePerDay')
    .notEmpty().withMessage('Price per day is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('location.address')
    .trim()
    .notEmpty().withMessage('Address is required'),
  body('location.city')
    .trim()
    .notEmpty().withMessage('City is required'),
  validate
];

// Rental validation rules
const createRentalValidation = [
  body('item')
    .notEmpty().withMessage('Item ID is required')
    .isMongoId().withMessage('Invalid item ID'),
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Invalid start date format'),
  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('Invalid end date format'),
  body('message')
    .optional()
    .isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters'),
  validate
];

// Review validation rules
const createReviewValidation = [
  body('rental')
    .notEmpty().withMessage('Rental ID is required')
    .isMongoId().withMessage('Invalid rental ID'),
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .notEmpty().withMessage('Comment is required')
    .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
  validate
];

// ID validation
const mongoIdValidation = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  createItemValidation,
  createRentalValidation,
  createReviewValidation,
  mongoIdValidation
};
