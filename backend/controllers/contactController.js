const { ContactMessage } = require('../models');
const { sendSuccess, sendError, asyncHandler, isValidObjectId, getPagination } = require('../utils/helpers');

// @desc    Submit a contact message
// @route   POST /api/contact
// @access  Public
const submitMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, category, message, priority } = req.body;

  // Check for potential spam patterns
  const recentMessages = await ContactMessage.countDocuments({
    email: email.toLowerCase(),
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
  });

  if (recentMessages >= 3) {
    return sendError(res, 'Too many messages from this email address. Please wait before sending another message.', 429);
  }

  const contactMessage = new ContactMessage({
    name,
    email,
    subject,
    category: category || 'general_inquiry',
    message,
    priority: priority || 'medium',
    status: 'unread'
  });

  await contactMessage.save();

  // Determine response message based on category
  const categoryResponses = {
    'general_inquiry': 'Thank you for your inquiry. We will respond within 24 hours.',
    'book_request': 'Thank you for your book request. We will check availability and respond soon.',
    'technical_support': 'Thank you for reporting the technical issue. Our support team will assist you shortly.',
    'complaint': 'Thank you for your feedback. We take all complaints seriously and will investigate promptly.',
    'suggestion': 'Thank you for your suggestion. We appreciate your input and will consider it carefully.'
  };

  const responseMessage = categoryResponses[category] || 'Message submitted successfully. We will get back to you soon!';

  sendSuccess(res, responseMessage, {
    message: {
      id: contactMessage._id,
      name: contactMessage.name,
      email: contactMessage.email,
      subject: contactMessage.subject,
      category: contactMessage.category,
      categoryDisplay: contactMessage.categoryDisplay,
      priority: contactMessage.priority,
      priorityDisplay: contactMessage.priorityDisplay,
      message: contactMessage.message,
      status: contactMessage.status,
      createdAt: contactMessage.createdAt
    }
  }, 201);
});

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private (Librarian only)
const getAllMessages = asyncHandler(async (req, res) => {
  const {
    page = 0,
    limit = 10,
    search,
    email,
    days,
    status,
    category,
    priority,
    dateFrom,
    dateTo,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  const { limit: pageLimit, offset } = getPagination(page, limit);

  // Build query
  let query = {};

  if (email) {
    query.email = email.toLowerCase();
  }

  if (status) {
    query.status = status;
  }

  if (category) {
    query.category = category;
  }

  if (priority) {
    query.priority = priority;
  }

  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { subject: new RegExp(search, 'i') },
      { message: new RegExp(search, 'i') }
    ];
  }

  // Date filtering
  if (days) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - parseInt(days));
    query.createdAt = { $gte: dateThreshold };
  } else if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) {
      query.createdAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endDate;
    }
  }

  // Build sort object
  const sortObj = {};
  sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const messages = await ContactMessage.find(query)
    .populate('assignedTo', 'name email')
    .sort(sortObj)
    .limit(pageLimit)
    .skip(offset);

  const total = await ContactMessage.countDocuments(query);

  // Add computed fields
  const messagesWithDetails = messages.map(message => {
    const messageObj = message.toObject({ virtuals: true });
    return {
      ...messageObj,
      isOverdue: message.isOverdue,
      resolutionTime: message.resolutionTime
    };
  });

  sendSuccess(res, 'Contact messages retrieved successfully', {
    messages: messagesWithDetails,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    },
    filters: {
      status,
      category,
      priority,
      search,
      email,
      dateRange: (dateFrom || dateTo) ? { from: dateFrom, to: dateTo } : null
    }
  });
});

// @desc    Get contact message by ID
// @route   GET /api/contact/:id
// @access  Private (Librarian only)
const getMessageById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid message ID', 400);
  }

  const message = await ContactMessage.findById(id);
  if (!message) {
    return sendError(res, 'Message not found', 404);
  }

  sendSuccess(res, 'Contact message retrieved successfully', { message });
});

// @desc    Delete contact message
// @route   DELETE /api/contact/:id
// @access  Private (Librarian only)
const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid message ID', 400);
  }

  const message = await ContactMessage.findById(id);
  if (!message) {
    return sendError(res, 'Message not found', 404);
  }

  await ContactMessage.findByIdAndDelete(id);

  sendSuccess(res, 'Contact message deleted successfully');
});

// @desc    Get messages by email
// @route   GET /api/contact/email/:email
// @access  Private (Librarian only)
const getMessagesByEmail = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const { page = 0, limit = 10 } = req.query;

  // Validate email format
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return sendError(res, 'Invalid email format', 400);
  }

  const { limit: pageLimit, offset } = getPagination(page, limit);

  const messages = await ContactMessage.findByEmail(email)
    .limit(pageLimit)
    .skip(offset);

  const total = await ContactMessage.countDocuments({ email: email.toLowerCase() });

  sendSuccess(res, 'Messages by email retrieved successfully', {
    email,
    messages,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
});

// @desc    Get recent contact messages
// @route   GET /api/contact/recent/:days
// @access  Private (Librarian only)
const getRecentMessages = asyncHandler(async (req, res) => {
  const { days } = req.params;

  const daysNum = parseInt(days);
  if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
    return sendError(res, 'Days must be a number between 1 and 365', 400);
  }

  const messages = await ContactMessage.findRecent(daysNum);

  sendSuccess(res, `Contact messages from last ${daysNum} days retrieved successfully`, {
    days: daysNum,
    messages,
    count: messages.length
  });
});

// @desc    Search contact messages
// @route   GET /api/contact/search/:term
// @access  Private (Librarian only)
const searchMessages = asyncHandler(async (req, res) => {
  const { term } = req.params;
  const { page = 0, limit = 10 } = req.query;

  if (!term || term.trim().length === 0) {
    return sendError(res, 'Search term cannot be empty', 400);
  }

  const { limit: pageLimit, offset } = getPagination(page, limit);

  const messages = await ContactMessage.searchByNameOrEmail(term.trim())
    .limit(pageLimit)
    .skip(offset);

  const total = await ContactMessage.countDocuments({
    $or: [
      { name: new RegExp(term, 'i') },
      { email: new RegExp(term, 'i') }
    ]
  });

  sendSuccess(res, 'Search results retrieved successfully', {
    searchTerm: term,
    messages,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
});

// @desc    Get contact message statistics
// @route   GET /api/contact/stats/overview
// @access  Private (Librarian only)
const getContactStats = asyncHandler(async (req, res) => {
  const stats = await ContactMessage.getStats();

  // Get top email senders
  const topSenders = await ContactMessage.aggregate([
    {
      $group: {
        _id: '$email',
        name: { $first: '$name' },
        messageCount: { $sum: 1 },
        lastMessage: { $max: '$createdAt' }
      }
    },
    {
      $sort: { messageCount: -1 }
    },
    {
      $limit: 5
    },
    {
      $project: {
        _id: 0,
        email: '$_id',
        name: 1,
        messageCount: 1,
        lastMessage: 1
      }
    }
  ]);

  sendSuccess(res, 'Contact message statistics retrieved successfully', {
    stats: {
      ...stats,
      topSenders
    }
  });
});

// @desc    Update contact message status
// @route   PUT /api/contact/:id/status
// @access  Private (Librarian only)
const updateMessageStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes, assignedTo } = req.body;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid message ID', 400);
  }

  const message = await ContactMessage.findById(id);
  if (!message) {
    return sendError(res, 'Contact message not found', 404);
  }

  // Update status using instance methods
  switch (status) {
    case 'read':
      await message.markAsRead();
      break;
    case 'in_progress':
      await message.markAsInProgress(assignedTo);
      break;
    case 'resolved':
      await message.markAsResolved(notes);
      break;
    case 'archived':
      await message.archive();
      break;
    default:
      message.status = status;
      if (notes) message.notes = notes;
      if (assignedTo) message.assignedTo = assignedTo;
      await message.save();
  }

  // Populate the updated message
  await message.populate('assignedTo', 'name email');

  sendSuccess(res, 'Message status updated successfully', {
    message: {
      ...message.toObject({ virtuals: true }),
      isOverdue: message.isOverdue,
      resolutionTime: message.resolutionTime
    }
  });
});

// @desc    Get messages by status
// @route   GET /api/contact/status/:status
// @access  Private (Librarian only)
const getMessagesByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  const { page = 0, limit = 10 } = req.query;

  const validStatuses = ['unread', 'read', 'in_progress', 'resolved', 'archived'];
  if (!validStatuses.includes(status)) {
    return sendError(res, 'Invalid status', 400);
  }

  const { limit: pageLimit, offset } = getPagination(page, limit);

  const messages = await ContactMessage.findByStatus(status)
    .populate('assignedTo', 'name email')
    .limit(pageLimit)
    .skip(offset);

  const total = await ContactMessage.countDocuments({ status });

  sendSuccess(res, `${status} messages retrieved successfully`, {
    status,
    messages,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
});

// @desc    Get overdue messages
// @route   GET /api/contact/overdue
// @access  Private (Librarian only)
const getOverdueMessages = asyncHandler(async (req, res) => {
  const { page = 0, limit = 10 } = req.query;
  const { limit: pageLimit, offset } = getPagination(page, limit);

  const messages = await ContactMessage.findOverdue()
    .populate('assignedTo', 'name email')
    .limit(pageLimit)
    .skip(offset);

  const total = await ContactMessage.countDocuments({
    status: 'unread',
    createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });

  sendSuccess(res, 'Overdue messages retrieved successfully', {
    messages,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
});

// @desc    Get enhanced contact statistics
// @route   GET /api/contact/analytics/enhanced
// @access  Private (Librarian only)
const getEnhancedContactStats = asyncHandler(async (req, res) => {
  const [basicStats, enhancedStats] = await Promise.all([
    ContactMessage.getStats(),
    ContactMessage.getEnhancedStats()
  ]);

  const combinedStats = {
    ...basicStats,
    ...enhancedStats
  };

  sendSuccess(res, 'Enhanced contact statistics retrieved successfully', {
    stats: combinedStats
  });
});

module.exports = {
  submitMessage,
  getAllMessages,
  getMessageById,
  updateMessageStatus,
  deleteMessage,
  getMessagesByEmail,
  getMessagesByStatus,
  getOverdueMessages,
  getRecentMessages,
  searchMessages,
  getContactStats,
  getEnhancedContactStats
};
