const express = require('express');
const { authenticate, requireLibrarian } = require('../middleware/auth');
const { validationMiddleware } = require('../services/validationService');
const contactController = require('../controllers/contactController');

const router = express.Router();

// @desc    Submit a contact message
// @route   POST /api/contact
// @access  Public
router.post('/', validationMiddleware.submitContact, contactController.submitMessage);

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private (Librarian only)
router.get('/', authenticate, requireLibrarian, validationMiddleware.pagination, contactController.getAllMessages);

// @desc    Get contact message statistics
// @route   GET /api/contact/stats/overview
// @access  Private (Librarian only)
router.get('/stats/overview', authenticate, requireLibrarian, contactController.getContactStats);

// @desc    Get recent contact messages
// @route   GET /api/contact/recent/:days
// @access  Private (Librarian only)
router.get('/recent/:days', authenticate, requireLibrarian, contactController.getRecentMessages);

// @desc    Search contact messages
// @route   GET /api/contact/search/:term
// @access  Private (Librarian only)
router.get('/search/:term', authenticate, requireLibrarian, validationMiddleware.pagination, contactController.searchMessages);

// @desc    Get messages by email
// @route   GET /api/contact/email/:email
// @access  Private (Librarian only)
router.get('/email/:email', authenticate, requireLibrarian, validationMiddleware.pagination, contactController.getMessagesByEmail);

// @desc    Get contact message by ID
// @route   GET /api/contact/:id
// @access  Private (Librarian only)
router.get('/:id', authenticate, requireLibrarian, contactController.getMessageById);

// @desc    Delete contact message
// @route   DELETE /api/contact/:id
// @access  Private (Librarian only)
router.delete('/:id', authenticate, requireLibrarian, contactController.deleteMessage);

module.exports = router;
