const express = require('express');
const {
  authenticate,
  requireLibrarian,
  requirePermission,
  optionalAuthenticate
} = require('../middleware/auth');
const { validationMiddleware } = require('../services/validationService');
const { uploadBookCover, uploadBookCoverMemory, handleMulterError } = require('../middleware/upload');
const { bookCoverUploadRateLimit, bookCoverUploadAbuseProtection } = require('../middleware/uploadRateLimit');
const { PERMISSIONS } = require('../services/rbacService');
const auditService = require('../services/auditService');
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

/**
 * @swagger
 * /api/books/search/advanced:
 *   get:
 *     summary: Advanced search books with comprehensive filtering
 *     description: Search books with advanced filtering options including title, author, category, rating range, and availability.
 *     tags: [Books]
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: title
 *         in: query
 *         schema:
 *           type: string
 *         description: Search by book title
 *         example: gatsby
 *       - name: author
 *         in: query
 *         schema:
 *           type: string
 *         description: Search by author name
 *         example: fitzgerald
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by category
 *         example: Fiction
 *       - name: minRating
 *         in: query
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *         description: Minimum average rating
 *         example: 4.0
 *       - name: maxRating
 *         in: query
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *         description: Maximum average rating
 *         example: 5.0
 *       - name: available
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Filter by availability
 *         example: true
 *     responses:
 *       200:
 *         description: Advanced search results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BooksListResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/search/advanced', validationMiddleware.advancedSearch, booksController.advancedSearchBooks);

/**
 * @swagger
 * /api/books/available/list:
 *   get:
 *     summary: Get available books
 *     description: Retrieve a list of books that are currently available for borrowing (available > 0).
 *     tags: [Books]
 *     security: []
 *     responses:
 *       200:
 *         description: Available books retrieved successfully
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
 *                   example: Available books retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     books:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Book'
 *                     count:
 *                       type: integer
 *                       description: Number of available books
 *                       example: 25
 */
router.get('/available/list', booksController.getAvailableBooks);

/**
 * @swagger
 * /api/books/category/{category}:
 *   get:
 *     summary: Get books by category
 *     description: Retrieve all books belonging to a specific category.
 *     tags: [Books]
 *     security: []
 *     parameters:
 *       - name: category
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Book category name
 *         example: Fiction
 *     responses:
 *       200:
 *         description: Books in category retrieved successfully
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
 *                   example: Books in category retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     books:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Book'
 *                     category:
 *                       type: string
 *                       example: Fiction
 *                     count:
 *                       type: integer
 *                       example: 15
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/category/:category', booksController.getBooksByCategory);

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Get book by ID with reviews
 *     description: Retrieve detailed information about a specific book including its reviews and ratings.
 *     tags: [Books]
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Book retrieved successfully
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
 *                   example: Book retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     book:
 *                       $ref: '#/components/schemas/BookResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', booksController.getBookById);

/**
 * @swagger
 * /api/books:
 *   post:
 *     summary: Create new book
 *     description: |
 *       Add a new book to the library catalog. Only librarians and admins can create books.
 *
 *       **Required Permission:** `book:create`
 *     tags: [Books]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookRequest'
 *           example:
 *             title: The Great Gatsby
 *             author: F. Scott Fitzgerald
 *             isbn: 978-0-7432-7356-5
 *             category: Fiction
 *             description: A classic American novel set in the Jazz Age
 *             quantity: 5
 *     responses:
 *       201:
 *         description: Book created successfully
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
 *                   example: Book created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     book:
 *                       $ref: '#/components/schemas/Book'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/',
  authenticate,
  requirePermission(PERMISSIONS.BOOK_CREATE),
  validationMiddleware.createBook,
  auditService.createAuditMiddleware('BOOK_CREATE', 'Book', 'MEDIUM'),
  booksController.createBook
);

/**
 * @swagger
 * /api/books/{id}:
 *   put:
 *     summary: Update book
 *     description: |
 *       Update an existing book's information. Only librarians and admins can update books.
 *
 *       **Required Permission:** `book:update`
 *     tags: [Books]
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
 *             $ref: '#/components/schemas/BookRequest'
 *           example:
 *             title: The Great Gatsby (Updated Edition)
 *             author: F. Scott Fitzgerald
 *             isbn: 978-0-7432-7356-5
 *             category: Classic Fiction
 *             description: A classic American novel set in the Jazz Age - Updated description
 *             quantity: 7
 *     responses:
 *       200:
 *         description: Book updated successfully
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
 *                   example: Book updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     book:
 *                       $ref: '#/components/schemas/Book'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id',
  authenticate,
  requirePermission(PERMISSIONS.BOOK_UPDATE),
  validationMiddleware.updateBook,
  auditService.createAuditMiddleware('BOOK_UPDATE', 'Book', 'MEDIUM'),
  booksController.updateBook
);

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     summary: Delete book
 *     description: |
 *       Delete a book from the library catalog. Only librarians and admins can delete books.
 *       Books with active borrows cannot be deleted.
 *
 *       **Required Permission:** `book:delete`
 *     tags: [Books]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Book deleted successfully
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
 *                   example: Book deleted successfully
 *       400:
 *         description: Cannot delete book with active borrows
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Cannot delete book with active borrows
 *               code: BOOK_HAS_ACTIVE_BORROWS
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id',
  authenticate,
  requirePermission(PERMISSIONS.BOOK_DELETE),
  auditService.createAuditMiddleware('BOOK_DELETE', 'Book', 'HIGH'),
  booksController.deleteBook
);

/**
 * @swagger
 * /api/books/{id}/upload-cover:
 *   post:
 *     summary: Upload book cover image
 *     description: |
 *       Upload a cover image for a book. Only librarians and admins can upload covers.
 *
 *       **File Requirements:**
 *       - Supported formats: JPG, JPEG, PNG, GIF
 *       - Maximum file size: 5MB
 *       - Rate limited to 10 uploads per hour
 *     tags: [Books]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Book cover image file
 *             required:
 *               - coverImage
 *     responses:
 *       200:
 *         description: Cover image uploaded successfully
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
 *                   example: Cover image uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     book:
 *                       $ref: '#/components/schemas/Book'
 *                     coverUrl:
 *                       type: string
 *                       example: http://localhost:5000/uploads/books/cover-123.jpg
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/:id/upload-cover',
  authenticate,
  requireLibrarian,
  bookCoverUploadRateLimit,
  uploadBookCover.single('coverImage'),
  handleMulterError,
  booksController.uploadBookCover
);

/**
 * @swagger
 * /api/books/{id}/update-cover:
 *   put:
 *     summary: Update book cover image
 *     description: Replace an existing book cover image with a new one.
 *     tags: [Books]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: New book cover image file
 *             required:
 *               - coverImage
 *     responses:
 *       200:
 *         description: Cover image updated successfully
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
 *                   example: Cover image updated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id/update-cover',
  authenticate,
  requireLibrarian,
  bookCoverUploadRateLimit,
  uploadBookCover.single('coverImage'),
  handleMulterError,
  booksController.updateBookCover
);

/**
 * @swagger
 * /api/books/{id}/cover:
 *   delete:
 *     summary: Delete book cover image
 *     description: Remove the cover image from a book.
 *     tags: [Books]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Cover image deleted successfully
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
 *                   example: Cover image deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id/cover',
  authenticate,
  requireLibrarian,
  booksController.deleteBookCover
);

/**
 * @swagger
 * /api/books/cleanup-orphaned-images:
 *   post:
 *     summary: Cleanup orphaned image files
 *     description: Remove orphaned book cover images that are no longer referenced by any books.
 *     tags: [Books]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
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
 *                   example: Cleanup completed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedFiles:
 *                       type: integer
 *                       example: 3
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/cleanup-orphaned-images',
  authenticate,
  requireLibrarian,
  booksController.cleanupOrphanedImages
);

module.exports = router;
