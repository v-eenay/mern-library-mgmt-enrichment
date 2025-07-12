const express = require('express');
const { authenticate, requireLibrarian } = require('../middleware/auth');
const { validationMiddleware } = require('../services/validationService');
const reviewsController = require('../controllers/reviewsController');

const router = express.Router();

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review for a book
 *     description: |
 *       Create a new review for a book. Users can only review books they have borrowed and returned.
 *       Each user can only review a book once.
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewRequest'
 *           example:
 *             bookId: 507f1f77bcf86cd799439012
 *             rating: 4
 *             comment: Great book! Highly recommended.
 *     responses:
 *       201:
 *         description: Review created successfully
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
 *                   example: Review created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     review:
 *                       $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation error or duplicate review
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: You have already reviewed this book
 *               code: DUPLICATE_REVIEW
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/', authenticate, validationMiddleware.createReview, reviewsController.createReview);

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get all reviews
 *     description: Retrieve all reviews in the system with pagination (Librarian only).
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: All reviews retrieved successfully
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
 *                   example: All reviews retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Review'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', authenticate, requireLibrarian, validationMiddleware.pagination, reviewsController.getAllReviews);

/**
 * @swagger
 * /api/reviews/my-reviews:
 *   get:
 *     summary: Get user's reviews
 *     description: Retrieve all reviews written by the authenticated user.
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: User reviews retrieved successfully
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
 *                   example: User reviews retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Review'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/my-reviews', authenticate, validationMiddleware.pagination, reviewsController.getMyReviews);

/**
 * @swagger
 * /api/reviews/recent/list:
 *   get:
 *     summary: Get recent reviews
 *     description: Retrieve the most recent book reviews.
 *     tags: [Reviews]
 *     security: []
 *     responses:
 *       200:
 *         description: Recent reviews retrieved successfully
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
 *                   example: Recent reviews retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Review'
 */
router.get('/recent/list', reviewsController.getRecentReviews);

/**
 * @swagger
 * /api/reviews/top-rated/books:
 *   get:
 *     summary: Get top-rated books
 *     description: Retrieve books with the highest average ratings.
 *     tags: [Reviews]
 *     security: []
 *     responses:
 *       200:
 *         description: Top-rated books retrieved successfully
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
 *                   example: Top-rated books retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     books:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Book'
 */
router.get('/top-rated/books', reviewsController.getTopRatedBooks);

// @desc    Get review analytics and insights
// @route   GET /api/reviews/analytics/overview
// @access  Private (Librarian only)
router.get('/analytics/overview', authenticate, requireLibrarian, reviewsController.getReviewAnalytics);

// @desc    Get book rating insights
// @route   GET /api/reviews/insights/books
// @access  Private (Librarian only)
router.get('/insights/books', authenticate, requireLibrarian, reviewsController.getBookRatingInsights);

/**
 * @swagger
 * /api/reviews/book/{bookId}:
 *   get:
 *     summary: Get reviews for a book
 *     description: Retrieve all reviews for a specific book with pagination.
 *     tags: [Reviews]
 *     security: []
 *     parameters:
 *       - name: bookId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Book ID
 *         example: 507f1f77bcf86cd799439012
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Book reviews retrieved successfully
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
 *                   example: Book reviews retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Review'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/book/:bookId', validationMiddleware.pagination, reviewsController.getBookReviews);

// @desc    Get reviews by user ID (Librarian only)
// @route   GET /api/reviews/user/:userId
// @access  Private (Librarian only)
router.get('/user/:userId', authenticate, requireLibrarian, validationMiddleware.pagination, reviewsController.getUserReviews);

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     summary: Get review by ID
 *     description: Retrieve detailed information about a specific review.
 *     tags: [Reviews]
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Review retrieved successfully
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
 *                   example: Review retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     review:
 *                       $ref: '#/components/schemas/Review'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Update user's review
 *     description: Update an existing review. Users can only update their own reviews.
 *     tags: [Reviews]
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
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Updated book rating
 *                 example: 5
 *               comment:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Updated review comment
 *                 example: Amazing book! Even better on second read.
 *           example:
 *             rating: 5
 *             comment: Amazing book! Even better on second read.
 *     responses:
 *       200:
 *         description: Review updated successfully
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
 *                   example: Review updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     review:
 *                       $ref: '#/components/schemas/Review'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Delete review
 *     description: Delete a review. Users can only delete their own reviews.
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Review deleted successfully
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
 *                   example: Review deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', reviewsController.getReviewById);
router.put('/:id', authenticate, validationMiddleware.updateReview, reviewsController.updateReview);
router.delete('/:id', authenticate, reviewsController.deleteReview);

module.exports = router;
