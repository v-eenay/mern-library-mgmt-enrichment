const express = require('express');
const {
  authenticate,
  requireLibrarian,
  requirePermission,
  requireResourceOwnership
} = require('../middleware/auth');
const { validationMiddleware } = require('../services/validationService');
const { PERMISSIONS } = require('../services/rbacService');
const auditService = require('../services/auditService');
const borrowsController = require('../controllers/borrowsController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     BorrowRequest:
 *       type: object
 *       required:
 *         - bookId
 *       properties:
 *         bookId:
 *           type: string
 *           format: objectId
 *           description: ID of the book to borrow
 *           example: 507f1f77bcf86cd799439012
 *
 *     BorrowResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [success]
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             borrow:
 *               allOf:
 *                 - $ref: '#/components/schemas/Borrow'
 *                 - type: object
 *                   properties:
 *                     userId:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                     bookId:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         author:
 *                           type: string
 *                         isbn:
 *                           type: string
 *
 *     BorrowsListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [success]
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             borrows:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BorrowResponse'
 *             pagination:
 *               $ref: '#/components/schemas/Pagination'
 *             stats:
 *               type: object
 *               properties:
 *                 totalBorrows:
 *                   type: integer
 *                 activeBorrows:
 *                   type: integer
 *                 overdueBorrows:
 *                   type: integer
 */

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/borrows:
 *   post:
 *     summary: Borrow a book
 *     description: |
 *       Create a new borrow record for a book. The user must be authenticated and have borrowing permissions.
 *
 *       **Business Rules:**
 *       - User can borrow maximum 5 books at a time
 *       - Book must be available (available > 0)
 *       - User cannot borrow the same book twice while it's still borrowed
 *       - Due date is automatically set to 30 days from borrow date
 *
 *       **Required Permission:** `borrow:create`
 *     tags: [Borrowing]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BorrowRequest'
 *           example:
 *             bookId: 507f1f77bcf86cd799439012
 *     responses:
 *       201:
 *         description: Book borrowed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BorrowResponse'
 *             example:
 *               status: success
 *               message: Book borrowed successfully
 *               data:
 *                 borrow:
 *                   id: 507f1f77bcf86cd799439013
 *                   userId:
 *                     id: 507f1f77bcf86cd799439011
 *                     name: John Doe
 *                     email: john.doe@example.com
 *                   bookId:
 *                     id: 507f1f77bcf86cd799439012
 *                     title: The Great Gatsby
 *                     author: F. Scott Fitzgerald
 *                     isbn: 978-0-7432-7356-5
 *                   borrowDate: 2023-01-15T10:30:00.000Z
 *                   dueDate: 2023-02-15T10:30:00.000Z
 *                   status: borrowed
 *                   renewalCount: 0
 *       400:
 *         description: Bad Request - Validation errors or business rule violations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               book_not_available:
 *                 summary: Book not available
 *                 value:
 *                   status: error
 *                   message: Book is not available for borrowing
 *                   code: BOOK_NOT_AVAILABLE
 *               borrow_limit_exceeded:
 *                 summary: Borrow limit exceeded
 *                 value:
 *                   status: error
 *                   message: You have reached the maximum borrowing limit (5 books)
 *                   code: BORROW_LIMIT_EXCEEDED
 *               already_borrowed:
 *                 summary: Book already borrowed
 *                 value:
 *                   status: error
 *                   message: You have already borrowed this book
 *                   code: BOOK_ALREADY_BORROWED
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Book not found
 *               code: BOOK_NOT_FOUND
 */
router.post('/',
  requirePermission(PERMISSIONS.BORROW_CREATE),
  validationMiddleware.borrowBook,
  auditService.createAuditMiddleware('BORROW_CREATE', 'Borrow', 'MEDIUM'),
  borrowsController.borrowBook
);

// @desc    Return a book
// @route   PUT /api/borrows/:id/return
// @access  Private (Own borrows or Librarian)
router.put('/:id/return',
  requireResourceOwnership('id', PERMISSIONS.BORROW_UPDATE_OWN, PERMISSIONS.BORROW_UPDATE_ANY),
  auditService.createAuditMiddleware('BORROW_RETURN', 'Borrow', 'MEDIUM'),
  borrowsController.returnBook
);

// @desc    Extend due date for a borrow
// @route   PUT /api/borrows/:id/extend
// @access  Private (Librarian only)
router.put('/:id/extend',
  requirePermission(PERMISSIONS.BORROW_EXTEND),
  validationMiddleware.extendDueDate,
  auditService.createAuditMiddleware('BORROW_EXTEND', 'Borrow', 'MEDIUM'),
  borrowsController.extendDueDate
);

// @desc    Get user's borrow history
// @route   GET /api/borrows/my-borrows
// @access  Private
router.get('/my-borrows', validationMiddleware.pagination, borrowsController.getMyBorrows);

// @desc    Get user's overdue borrows
// @route   GET /api/borrows/my-overdue
// @access  Private
router.get('/my-overdue', borrowsController.getMyOverdueBorrows);

// @desc    Get borrow statistics
// @route   GET /api/borrows/stats/overview
// @access  Private (Librarian only)
router.get('/stats/overview', requireLibrarian, borrowsController.getBorrowStats);

// @desc    Get overdue borrows
// @route   GET /api/borrows/overdue
// @access  Private (Librarian only)
router.get('/overdue', requireLibrarian, validationMiddleware.pagination, borrowsController.getOverdueBorrows);

// @desc    Update overdue statuses
// @route   POST /api/borrows/update-overdue
// @access  Private (Librarian only)
router.post('/update-overdue', requireLibrarian, borrowsController.updateOverdueStatuses);

// @desc    Get active borrows for a specific book
// @route   GET /api/borrows/book/:bookId/active
// @access  Private (Librarian only)
router.get('/book/:bookId/active', requireLibrarian, borrowsController.getActiveBorrowsByBook);

// @desc    Get all borrows (Librarian only)
// @route   GET /api/borrows
// @access  Private (Librarian only)
router.get('/', requireLibrarian, validationMiddleware.pagination, borrowsController.getAllBorrows);

// @desc    Get borrow by ID
// @route   GET /api/borrows/:id
// @access  Private
router.get('/:id', borrowsController.getBorrowById);

module.exports = router;

