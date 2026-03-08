const Notification = require('../models/Notification');
const ApiResponse = require('../utils/response');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, read } = req.query;

    const query = { user: req.user.id };
    if (read !== undefined) {
      query.read = read === 'true';
    }

    const skip = (page - 1) * limit;
    const notifications = await Notification.find(query)
      .populate('relatedItem', 'title images')
      .populate('relatedUser', 'name avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);

    ApiResponse.paginated(res, notifications, page, limit, total, 'Notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    ApiResponse.success(res, notification, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );

    ApiResponse.success(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    ApiResponse.success(res, null, 'Notification deleted successfully');
  } catch (error) {
    next(error);
  }
};
