const express = require('express');
const {
  authenticate,
  requireLibrarian,
  requirePermission,
  requireMinimumRole,
  optionalAuthenticate
} = require('../middleware/auth');
const { validationMiddleware } = require('../services/validationService');
const { uploadBookCover, uploadBookCoverMemory, handleMulterError } = require('../middleware/upload');
const { bookCoverUploadRateLimit, bookCoverUploadAbuseProtection } = require('../middleware/uploadRateLimit');
const { PERMISSIONS } = require('../services/rbacService');
const auditService = require('../services/auditService');
const securityMiddleware = require('../middleware/securityMiddleware');
const booksController = require('../controllers/booksController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     BookRequest:
 *       type: object
 *       required:
 *         - title
 *         - author
 *         - isbn
 *         - category
 *         - quantity
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *           description: Book title
 *           example: The Great Gatsby
 *         author:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           pattern: '^[a-zA-Z\s\-\.\'']+$'
 *           description: Book author (letters, spaces, hyphens, periods, apostrophes only)
 *           example: F. Scott Fitzgerald
 *         isbn:
 *           type: string
 *           pattern: '^[0-9X-]{10,17}$'
 *           description: International Standard Book Number
 *           example: 978-0-7432-7356-5
 *         category:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           pattern: '^[a-zA-Z\s\-&]+$'
 *           description: Book category
 *           example: Fiction
 *         description:
 *           type: string
 *           maxLength: 1000
 *           description: Book description
 *           example: A classic American novel set in the Jazz Age
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           maximum: 10000
 *           description: Total number of copies
 *           example: 5
 *         coverImage:
 *           type: string
 *           format: uri
 *           description: URL to book cover image
 *           example: http://localhost:5000/uploads/books/cover-123.jpg
 *
 *     BookResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/Book'
 *         - type: object
 *           properties:
 *             reviews:
 *               type: array
 *               description: Book reviews (when fetching single book)
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: objectId
 *                   userId:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                   rating:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   comment:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *
 *     BooksListResponse:
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
 *             books:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *             pagination:
 *               $ref: '#/components/schemas/Pagination'
 *             filters:
 *               type: object
 *               properties:
 *                 search:
 *                   type: string
 *                 category:
 *                   type: string
 *                 author:
 *                   type: string
 *                 available:
 *                   type: boolean
 */

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Get all books with pagination, search, and filtering
 *     description: |
 *       Retrieve a paginated list of books with optional search and filtering capabilities.
 *
 *       **Search Features:**
 *       - Search by title, author, or description
 *       - Filter by category, author, or availability
 *       - Sort by title, author, createdAt, or averageRating
 *
 *       **Public Access:** No authentication required
 *     tags: [Books]
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by book category
 *         example: Fiction
 *       - name: author
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by book author
 *         example: F. Scott Fitzgerald
 *       - name: available
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Filter by availability status
 *         example: true
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: [title, author, createdAt, averageRating]
 *           default: createdAt
 *         description: Sort field
 *         example: title
 *       - name: sortOrder
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *         example: asc
 *     responses:
 *       200:
 *         description: Books retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BooksListResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/', validationMiddleware.bookQuery, booksController.getAllBooks);

// @desc    Advanced search books with comprehensive filtering
// @route   GET /api/books/search/advanced
// @access  Public
router.get('/search/advanced', validationMiddleware.advancedSearch, booksController.advancedSearchBooks);

// @desc    Get available books
// @route   GET /api/books/available/list
// @access  Public
router.get('/available/list', booksController.getAvailableBooks);

// @desc    Search books by category
// @route   GET /api/books/category/:category
// @access  Public
router.get('/category/:category', booksController.getBooksByCategory);

// @desc    Get book by ID with reviews
// @route   GET /api/books/:id
// @access  Public
router.get('/:id', booksController.getBookById);

// @desc    Create new book
// @route   POST /api/books
// @access  Private (Librarian only)
router.post('/',
  authenticate,
  requirePermission(PERMISSIONS.BOOK_CREATE),
  validationMiddleware.createBook,
  auditService.createAuditMiddleware('BOOK_CREATE', 'Book', 'MEDIUM'),
  booksController.createBook
);

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Librarian only)
router.put('/:id',
  authenticate,
  requirePermission(PERMISSIONS.BOOK_UPDATE),
  validationMiddleware.updateBook,
  auditService.createAuditMiddleware('BOOK_UPDATE', 'Book', 'MEDIUM'),
  booksController.updateBook
);

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Librarian only)
router.delete('/:id',
  authenticate,
  requirePermission(PERMISSIONS.BOOK_DELETE),
  auditService.createAuditMiddleware('BOOK_DELETE', 'Book', 'HIGH'),
  booksController.deleteBook
);

// @desc    Upload book cover image
// @route   POST /api/books/:id/upload-cover
// @access  Private (Librarian only)
router.post('/:id/upload-cover',
  authenticate,
  requireLibrarian,
  bookCoverUploadRateLimit,
  uploadBookCover.single('coverImage'),
  handleMulterError,
  booksController.uploadBookCover
);

// @desc    Update book cover image
// @route   PUT /api/books/:id/update-cover
// @access  Private (Librarian only)
router.put('/:id/update-cover',
  authenticate,
  requireLibrarian,
  bookCoverUploadRateLimit,
  uploadBookCover.single('coverImage'),
  handleMulterError,
  booksController.updateBookCover
);

// @desc    Upload book cover with enhanced processing
// @route   POST /api/books/:id/cover
// @access  Private (Librarian only)
router.post('/:id/cover',
  authenticate,
  requireLibrarian,
  bookCoverUploadRateLimit,
  bookCoverUploadAbuseProtection,
  uploadBookCoverMemory.single('coverImage'),
  handleMulterError,
  booksController.uploadBookCoverEnhanced
);

// @desc    Delete book cover image
// @route   DELETE /api/books/:id/cover
// @access  Private (Librarian only)
router.delete('/:id/cover',
  authenticate,
  requireLibrarian,
  booksController.deleteBookCover
);

// @desc    Cleanup orphaned image files
// @route   POST /api/books/cleanup-orphaned-images
// @access  Private (Librarian only)
router.post('/cleanup-orphaned-images',
  authenticate,
  requireLibrarian,
  booksController.cleanupOrphanedImages
);

module.exports = router;
