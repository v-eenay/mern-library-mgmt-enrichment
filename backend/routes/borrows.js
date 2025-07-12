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

/**
 * @swagger
 * /api/borrows/{id}/return:
 *   put:
 *     summary: Return a book
 *     description: |
 *       Mark a borrowed book as returned. Users can return their own borrows, librarians can return any borrow.
 *
 *       **Required Permission:** `borrow:update:own` (own borrows) or `borrow:update:any` (librarian)
 *     tags: [Borrowing]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Book returned successfully
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
 *                   example: Book returned successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     borrow:
 *                       $ref: '#/components/schemas/Borrow'
 *       400:
 *         description: Book already returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Book has already been returned
 *               code: BOOK_ALREADY_RETURNED
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id/return',
  requireResourceOwnership('id', PERMISSIONS.BORROW_UPDATE_OWN, PERMISSIONS.BORROW_UPDATE_ANY),
  auditService.createAuditMiddleware('BORROW_RETURN', 'Borrow', 'MEDIUM'),
  borrowsController.returnBook
);

/**
 * @swagger
 * /api/borrows/{id}/extend:
 *   put:
 *     summary: Extend due date for a borrow
 *     description: |
 *       Extend the due date for a borrowed book. Only librarians and admins can extend due dates.
 *
 *       **Required Permission:** `borrow:extend`
 *     tags: [Borrowing]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 30
 *                 description: Number of days to extend
 *                 example: 14
 *             required:
 *               - days
 *     responses:
 *       200:
 *         description: Due date extended successfully
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
 *                   example: Due date extended successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     borrow:
 *                       $ref: '#/components/schemas/Borrow'
 *                     newDueDate:
 *                       type: string
 *                       format: date-time
 *                       example: '2023-03-15T10:30:00.000Z'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id/extend',
  requirePermission(PERMISSIONS.BORROW_EXTEND),
  validationMiddleware.extendDueDate,
  auditService.createAuditMiddleware('BORROW_EXTEND', 'Borrow', 'MEDIUM'),
  borrowsController.extendDueDate
);

/**
 * @swagger
 * /api/borrows/my-borrows:
 *   get:
 *     summary: Get user's borrow history
 *     description: Retrieve the authenticated user's borrowing history with pagination.
 *     tags: [Borrowing]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Borrow history retrieved successfully
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
 *                   example: Borrow history retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     borrows:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Borrow'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/my-borrows', validationMiddleware.pagination, borrowsController.getMyBorrows);

/**
 * @swagger
 * /api/borrows/my-overdue:
 *   get:
 *     summary: Get user's overdue borrows
 *     description: Retrieve the authenticated user's overdue borrowed books.
 *     tags: [Borrowing]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Overdue borrows retrieved successfully
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
 *                   example: Overdue borrows retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     borrows:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Borrow'
 *                     count:
 *                       type: integer
 *                       example: 2
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/my-overdue', borrowsController.getMyOverdueBorrows);

/**
 * @swagger
 * /api/borrows/stats/overview:
 *   get:
 *     summary: Get borrow statistics
 *     description: Retrieve comprehensive borrowing statistics for librarians and admins.
 *     tags: [Borrowing]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Borrow statistics retrieved successfully
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
 *                   example: Borrow statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalBorrows:
 *                       type: integer
 *                       example: 150
 *                     activeBorrows:
 *                       type: integer
 *                       example: 45
 *                     overdueBorrows:
 *                       type: integer
 *                       example: 8
 *                     returnedBorrows:
 *                       type: integer
 *                       example: 97
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/stats/overview', requireLibrarian, borrowsController.getBorrowStats);

/**
 * @swagger
 * /api/borrows/overdue:
 *   get:
 *     summary: Get overdue borrows
 *     description: Retrieve all overdue borrowed books for librarian management.
 *     tags: [Borrowing]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Overdue borrows retrieved successfully
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
 *                   example: Overdue borrows retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     borrows:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Borrow'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/overdue', requireLibrarian, validationMiddleware.pagination, borrowsController.getOverdueBorrows);

/**
 * @swagger
 * /api/borrows/update-overdue:
 *   post:
 *     summary: Update overdue statuses
 *     description: Update the status of all overdue borrows in the system.
 *     tags: [Borrowing]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Overdue statuses updated successfully
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
 *                   example: Overdue statuses updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: integer
 *                       example: 5
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/update-overdue', requireLibrarian, borrowsController.updateOverdueStatuses);

/**
 * @swagger
 * /api/borrows/book/{bookId}/active:
 *   get:
 *     summary: Get active borrows for a specific book
 *     description: Retrieve all active borrows for a specific book.
 *     tags: [Borrowing]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - name: bookId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Book ID
 *         example: 507f1f77bcf86cd799439012
 *     responses:
 *       200:
 *         description: Active borrows retrieved successfully
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
 *                   example: Active borrows retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     borrows:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Borrow'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/book/:bookId/active', requireLibrarian, borrowsController.getActiveBorrowsByBook);

/**
 * @swagger
 * /api/borrows:
 *   get:
 *     summary: Get all borrows
 *     description: Retrieve all borrows in the system with pagination (Librarian only).
 *     tags: [Borrowing]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: All borrows retrieved successfully
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
 *                   example: All borrows retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     borrows:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Borrow'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', requireLibrarian, validationMiddleware.pagination, borrowsController.getAllBorrows);

/**
 * @swagger
 * /api/borrows/{id}:
 *   get:
 *     summary: Get borrow by ID
 *     description: Retrieve detailed information about a specific borrow record.
 *     tags: [Borrowing]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Borrow retrieved successfully
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
 *                   example: Borrow retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     borrow:
 *                       $ref: '#/components/schemas/Borrow'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', borrowsController.getBorrowById);

module.exports = router;

