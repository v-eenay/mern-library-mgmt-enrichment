const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { ContactMessage } = require('../models');
const { authenticate, requireLibrarian } = require('../middleware/auth');
const { sendSuccess, sendError, asyncHandler, isValidObjectId, getPagination } = require('../utils/helpers');

const router = express.Router();

// @desc    Submit a contact message
// @route   POST /api/contact
// @access  Public
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { name, email, message } = req.body;

  const contactMessage = new ContactMessage({
    name,
    email,
    message
  });

  await contactMessage.save();

  sendSuccess(res, 'Message submitted successfully. We will get back to you soon!', {
    message: {
      id: contactMessage._id,
      name: contactMessage.name,
      email: contactMessage.email,
      message: contactMessage.message,
      createdAt: contactMessage.createdAt
    }
  }, 201);
}));

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private (Librarian only)
router.get('/', authenticate, requireLibrarian, [
  query('page')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Page must be a non-negative integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search term must not be empty'),
  query('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { page = 0, limit = 10, search, email, days } = req.query;
  const { limit: pageLimit, offset } = getPagination(page, limit);

  // Build query
  let query = {};
  
  if (email) {
    query.email = email.toLowerCase();
  }
  
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { message: new RegExp(search, 'i') }
    ];
  }
  
  if (days) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - parseInt(days));
    query.createdAt = { $gte: dateThreshold };
  }

  const messages = await ContactMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(pageLimit)
    .skip(offset);

  const total = await ContactMessage.countDocuments(query);

  sendSuccess(res, 'Contact messages retrieved successfully', {
    messages,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
}));

// @desc    Get contact message by ID
// @route   GET /api/contact/:id
// @access  Private (Librarian only)
router.get('/:id', authenticate, requireLibrarian, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid message ID', 400);
  }

  const message = await ContactMessage.findById(id);
  if (!message) {
    return sendError(res, 'Message not found', 404);
  }

  sendSuccess(res, 'Contact message retrieved successfully', { message });
}));

// @desc    Delete contact message
// @route   DELETE /api/contact/:id
// @access  Private (Librarian only)
router.delete('/:id', authenticate, requireLibrarian, asyncHandler(async (req, res) => {
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
}));

// @desc    Get messages by email
// @route   GET /api/contact/email/:email
// @access  Private (Librarian only)
router.get('/email/:email', authenticate, requireLibrarian, [
  query('page')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Page must be a non-negative integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

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
}));

// @desc    Get recent contact messages
// @route   GET /api/contact/recent/:days
// @access  Private (Librarian only)
router.get('/recent/:days', authenticate, requireLibrarian, asyncHandler(async (req, res) => {
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
}));

// @desc    Search contact messages
// @route   GET /api/contact/search/:term
// @access  Private (Librarian only)
router.get('/search/:term', authenticate, requireLibrarian, [
  query('page')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Page must be a non-negative integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

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
}));

// @desc    Get contact message statistics
// @route   GET /api/contact/stats/overview
// @access  Private (Librarian only)
router.get('/stats/overview', authenticate, requireLibrarian, asyncHandler(async (req, res) => {
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
}));

module.exports = router;
