const Rental = require('../models/Rental');
const Item = require('../models/Item');
const Notification = require('../models/Notification');
const { AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/response');

// @desc    Create rental request
// @route   POST /api/rentals/request
// @access  Private
exports.createRentalRequest = async (req, res, next) => {
  try {
    const { item: itemId, startDate, endDate, message } = req.body;

    // Get item
    const item = await Item.findById(itemId);
    if (!item) {
      return next(new AppError('Item not found', 404));
    }

    // Check if item is available
    if (!item.availability) {
      return next(new AppError('Item is not available', 400));
    }

    // Check if user is trying to borrow their own item
    if (item.owner.toString() === req.user.id) {
      return next(new AppError('You cannot borrow your own item', 400));
    }

    // Calculate total price
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const totalPrice = days * item.pricePerDay;

    // Create rental
    const rental = await Rental.create({
      item: itemId,
      borrower: req.user.id,
      owner: item.owner,
      startDate,
      endDate,
      totalPrice,
      message,
      status: 'pending'
    });

    // Create notification for owner
    await Notification.create({
      user: item.owner,
      type: 'borrow-request',
      title: 'New Borrow Request',
      message: `${req.user.name} wants to borrow your ${item.title}`,
      relatedItem: itemId,
      relatedRental: rental._id,
      relatedUser: req.user.id
    });

    const populatedRental = await Rental.findById(rental._id)
      .populate('item', 'title images pricePerDay')
      .populate('borrower', 'name avatar')
      .populate('owner', 'name avatar');

    ApiResponse.success(res, populatedRental, 'Rental request created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Approve rental request
// @route   PUT /api/rentals/:id/approve
// @access  Private
exports.approveRental = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return next(new AppError('Rental not found', 404));
    }

    // Check if user is the owner
    if (rental.owner.toString() !== req.user.id) {
      return next(new AppError('Not authorized to approve this rental', 403));
    }

    // Check if rental is pending
    if (rental.status !== 'pending') {
      return next(new AppError('Rental is not pending', 400));
    }

    rental.status = 'approved';
    await rental.save();

    // Update item availability
    await Item.findByIdAndUpdate(rental.item, { availability: false });

    // Create notification for borrower
    await Notification.create({
      user: rental.borrower,
      type: 'approval',
      title: 'Rental Approved',
      message: 'Your rental request has been approved',
      relatedItem: rental.item,
      relatedRental: rental._id
    });

    const populatedRental = await Rental.findById(rental._id)
      .populate('item', 'title images')
      .populate('borrower', 'name avatar')
      .populate('owner', 'name avatar');

    ApiResponse.success(res, populatedRental, 'Rental approved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Reject rental request
// @route   PUT /api/rentals/:id/reject
// @access  Private
exports.rejectRental = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return next(new AppError('Rental not found', 404));
    }

    // Check if user is the owner
    if (rental.owner.toString() !== req.user.id) {
      return next(new AppError('Not authorized to reject this rental', 403));
    }

    // Check if rental is pending
    if (rental.status !== 'pending') {
      return next(new AppError('Rental is not pending', 400));
    }

    rental.status = 'rejected';
    await rental.save();

    // Create notification for borrower
    await Notification.create({
      user: rental.borrower,
      type: 'rejection',
      title: 'Rental Rejected',
      message: 'Your rental request has been rejected',
      relatedItem: rental.item,
      relatedRental: rental._id
    });

    ApiResponse.success(res, rental, 'Rental rejected successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get user rentals
// @route   GET /api/rentals/user
// @access  Private
exports.getUserRentals = async (req, res, next) => {
  try {
    const { type = 'borrower', status } = req.query;

    const query = {};
    query[type] = req.user.id;

    if (status) {
      query.status = status;
    }

    const rentals = await Rental.find(query)
      .populate('item', 'title images pricePerDay')
      .populate('borrower', 'name avatar')
      .populate('owner', 'name avatar')
      .sort('-createdAt');

    ApiResponse.success(res, rentals, 'Rentals retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Complete rental
// @route   PUT /api/rentals/:id/complete
// @access  Private
exports.completeRental = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return next(new AppError('Rental not found', 404));
    }

    // Check if user is the owner
    if (rental.owner.toString() !== req.user.id) {
      return next(new AppError('Not authorized to complete this rental', 403));
    }

    rental.status = 'completed';
    await rental.save();

    // Update item availability
    await Item.findByIdAndUpdate(rental.item, { availability: true });

    ApiResponse.success(res, rental, 'Rental completed successfully');
  } catch (error) {
    next(error);
  }
};
