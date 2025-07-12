const express = require('express');
const { authenticate, requireLibrarian } = require('../middleware/auth');
const { validationMiddleware } = require('../services/validationService');
const { contactFormRateLimit, contactSpamProtection } = require('../middleware/uploadRateLimit');
const contactController = require('../controllers/contactController');

const router = express.Router();

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit a contact message
 *     description: |
 *       Submit a contact message to the library. This endpoint is rate limited and includes spam protection.
 *
 *       **Rate Limits:**
 *       - 5 messages per 15 minutes per IP
 *       - Spam protection with progressive delays
 *     tags: [Contact]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactRequest'
 *           example:
 *             name: John Doe
 *             email: john.doe@example.com
 *             subject: Question about book availability
 *             message: I would like to know if you have any books by Stephen King available for borrowing.
 *     responses:
 *       201:
 *         description: Message submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Message submitted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       $ref: '#/components/schemas/ContactMessage'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *   get:
 *     summary: Get all contact messages
 *     description: Retrieve all contact messages with pagination (Librarian only).
 *     tags: [Contact]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Contact messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Contact messages retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ContactMessage'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', contactFormRateLimit, contactSpamProtection, validationMiddleware.submitContact, contactController.submitMessage);
router.get('/', authenticate, requireLibrarian, validationMiddleware.pagination, contactController.getAllMessages);

/**
 * @swagger
 * /api/contact/stats/overview:
 *   get:
 *     summary: Get contact message statistics
 *     description: Retrieve basic statistics about contact messages for librarian dashboard.
 *     tags: [Contact]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Contact statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Contact statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalMessages:
 *                       type: integer
 *                       example: 150
 *                     pendingMessages:
 *                       type: integer
 *                       example: 25
 *                     readMessages:
 *                       type: integer
 *                       example: 100
 *                     respondedMessages:
 *                       type: integer
 *                       example: 25
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/stats/overview', authenticate, requireLibrarian, contactController.getContactStats);

/**
 * @swagger
 * /api/contact/analytics/enhanced:
 *   get:
 *     summary: Get enhanced contact analytics
 *     description: Retrieve detailed analytics and insights about contact messages.
 *     tags: [Contact]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Enhanced contact analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Enhanced contact analytics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     messagesByMonth:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                             example: "2023-01"
 *                           count:
 *                             type: integer
 *                             example: 15
 *                     averageResponseTime:
 *                       type: number
 *                       example: 2.5
 *                     topSubjects:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           subject:
 *                             type: string
 *                             example: Book availability
 *                           count:
 *                             type: integer
 *                             example: 8
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/analytics/enhanced', authenticate, requireLibrarian, contactController.getEnhancedContactStats);

// @desc    Get messages by status
// @route   GET /api/contact/status/:status
// @access  Private (Librarian only)
router.get('/status/:status', authenticate, requireLibrarian, validationMiddleware.pagination, contactController.getMessagesByStatus);

// @desc    Get overdue messages
// @route   GET /api/contact/overdue
// @access  Private (Librarian only)
router.get('/overdue', authenticate, requireLibrarian, validationMiddleware.pagination, contactController.getOverdueMessages);

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

// @desc    Update contact message status
// @route   PUT /api/contact/:id/status
// @access  Private (Librarian only)
router.put('/:id/status', authenticate, requireLibrarian, validationMiddleware.updateContactStatus, contactController.updateMessageStatus);

// @desc    Delete contact message
// @route   DELETE /api/contact/:id
// @access  Private (Librarian only)
router.delete('/:id', authenticate, requireLibrarian, contactController.deleteMessage);

module.exports = router;
