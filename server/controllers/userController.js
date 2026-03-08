const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/response');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    ApiResponse.success(res, user, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      bio: req.body.bio,
      avatar: req.body.avatar,
      location: req.body.location
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    ApiResponse.success(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    ApiResponse.success(res, user, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};
