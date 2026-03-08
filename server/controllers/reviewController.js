const Review = require('../models/Review');
const Rental = require('../models/Rental');
const User = require('../models/User');
const Item = require('../models/Item');
const { AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/response');

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const { rental: rentalId, rating, comment } = req.body;

    // Get rental
    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return next(new AppError('Rental not found', 404));
    }

    // Check if rental is completed
    if (rental.status !== 'completed') {
      return next(new AppError('Can only review completed rentals', 400));
    }

    // Check if user is part of the rental
    const isOwner = rental.owner.toString() === req.user.id;
    const isBorrower = rental.borrower.toString() === req.user.id;

    if (!isOwner && !isBorrower) {
      return next(new AppError('Not authorized to review this rental', 403));
    }

    // Determine who is being reviewed
    const reviewedUserId = isOwner ? rental.borrower : rental.owner;

    // Check if review already exists
    const existingReview = await Review.findOne({
      reviewer: req.user.id,
      rental: rentalId
    });

    if (existingReview) {
      return next(new AppError('You have already reviewed this rental', 400));
    }

    // Create review
    const review = await Review.create({
      reviewer: req.user.id,
      reviewedUser: reviewedUserId,
      rental: rentalId,
      item: rental.item,
      rating,
      comment
    });

    // Update user rating
    await updateUserRating(reviewedUserId);

    // If reviewing as borrower, update item rating
    if (isBorrower) {
      await updateItemRating(rental.item);
    }

    const populatedReview = await Review.findById(review._id)
      .populate('reviewer', 'name avatar')
      .populate('reviewedUser', 'name avatar');

    ApiResponse.success(res, populatedReview, 'Review created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/:userId
// @access  Public
exports.getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewedUser: req.params.userId })
      .populate('reviewer', 'name avatar')
      .populate('item', 'title')
      .sort('-createdAt');

    ApiResponse.success(res, reviews, 'Reviews retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Helper function to update user rating
async function updateUserRating(userId) {
  const reviews = await Review.find({ reviewedUser: userId });
  
  if (reviews.length > 0) {
    const avgRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    
    await User.findByIdAndUpdate(userId, {
      rating: avgRating.toFixed(1),
      reviewCount: reviews.length
    });
  }
}

// Helper function to update item rating
async function updateItemRating(itemId) {
  const reviews = await Review.find({ item: itemId });
  
  if (reviews.length > 0) {
    const avgRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    
    await Item.findByIdAndUpdate(itemId, {
      rating: avgRating.toFixed(1),
      reviewCount: reviews.length
    });
  }
}
