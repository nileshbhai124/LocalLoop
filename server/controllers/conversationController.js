const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/response');

// @desc    Get all conversations for user
// @route   GET /api/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, archived = false } = req.query;

    const query = {
      participants: userId,
      isActive: true,
      ...(archived === 'true' ? { archivedBy: userId } : { archivedBy: { $ne: userId } })
    };

    const skip = (page - 1) * limit;

    const conversations = await Conversation.find(query)
      .populate('participants', 'name avatar isActive lastLogin')
      .populate('itemId', 'title images pricePerDay')
      .populate('lastMessage.sender', 'name avatar')
      .sort({ 'lastMessage.timestamp': -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Add unread count for current user
    const conversationsWithUnread = conversations.map(conv => ({
      ...conv,
      unreadCount: conv.unreadCount?.[userId] || 0,
      otherParticipant: conv.participants.find(p => p._id.toString() !== userId)
    }));

    const total = await Conversation.countDocuments(query);

    ApiResponse.paginated(
      res,
      conversationsWithUnread,
      page,
      limit,
      total,
      'Conversations retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get single conversation
// @route   GET /api/conversations/:id
// @access  Private
exports.getConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'name avatar email isActive')
      .populate('itemId', 'title images pricePerDay owner');

    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    // Check if user is participant
    if (!conversation.isParticipant(req.user.id)) {
      return next(new AppError('Not authorized to access this conversation', 403));
    }

    ApiResponse.success(res, conversation, 'Conversation retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Create or get conversation
// @route   POST /api/conversations
// @access  Private
exports.createConversation = async (req, res, next) => {
  try {
    const { participantId, itemId } = req.body;
    const userId = req.user.id;

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId] },
      ...(itemId && { itemId })
    });

    if (conversation) {
      return ApiResponse.success(res, conversation, 'Conversation already exists');
    }

    // Create new conversation
    conversation = await Conversation.create({
      participants: [userId, participantId],
      itemId,
      unreadCount: {
        [userId]: 0,
        [participantId]: 0
      }
    });

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name avatar')
      .populate('itemId', 'title images');

    ApiResponse.success(res, populatedConversation, 'Conversation created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Archive conversation
// @route   PUT /api/conversations/:id/archive
// @access  Private
exports.archiveConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    if (!conversation.isParticipant(req.user.id)) {
      return next(new AppError('Not authorized', 403));
    }

    // Add user to archivedBy array
    if (!conversation.archivedBy.includes(req.user.id)) {
      conversation.archivedBy.push(req.user.id);
      await conversation.save();
    }

    ApiResponse.success(res, conversation, 'Conversation archived successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Unarchive conversation
// @route   PUT /api/conversations/:id/unarchive
// @access  Private
exports.unarchiveConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    if (!conversation.isParticipant(req.user.id)) {
      return next(new AppError('Not authorized', 403));
    }

    // Remove user from archivedBy array
    conversation.archivedBy = conversation.archivedBy.filter(
      id => id.toString() !== req.user.id
    );
    await conversation.save();

    ApiResponse.success(res, conversation, 'Conversation unarchived successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete conversation
// @route   DELETE /api/conversations/:id
// @access  Private
exports.deleteConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    if (!conversation.isParticipant(req.user.id)) {
      return next(new AppError('Not authorized', 403));
    }

    // Soft delete: mark as inactive
    conversation.isActive = false;
    await conversation.save();

    // Optionally delete all messages
    // await Message.deleteMany({ conversation: conversation._id });

    ApiResponse.success(res, null, 'Conversation deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread conversations count
// @route   GET /api/conversations/unread/count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId,
      isActive: true,
      archivedBy: { $ne: userId }
    }).lean();

    const totalUnread = conversations.reduce((sum, conv) => {
      return sum + (conv.unreadCount?.[userId] || 0);
    }, 0);

    ApiResponse.success(res, { 
      totalUnread,
      conversationsWithUnread: conversations.filter(c => c.unreadCount?.[userId] > 0).length
    }, 'Unread count retrieved successfully');
  } catch (error) {
    next(error);
  }
};
