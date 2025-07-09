const express = require('express');
const { authenticate, requireLibrarian } = require('../middleware/auth');
const { validationMiddleware } = require('../services/validationService');
const reviewsController = require('../controllers/reviewsController');

const router = express.Router();

// @desc    Create a review for a book
// @route   POST /api/reviews
// @access  Private
router.post('/', authenticate, validationMiddleware.createReview, reviewsController.createReview);

// @desc    Get all reviews (Librarian only)
// @route   GET /api/reviews
// @access  Private (Librarian only)
router.get('/', authenticate, requireLibrarian, validationMiddleware.pagination, reviewsController.getAllReviews);

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
router.get('/my-reviews', authenticate, validationMiddleware.pagination, reviewsController.getMyReviews);

// @desc    Get recent reviews
// @route   GET /api/reviews/recent/list
// @access  Public
router.get('/recent/list', reviewsController.getRecentReviews);

// @desc    Get top-rated books
// @route   GET /api/reviews/top-rated/books
// @access  Public
router.get('/top-rated/books', reviewsController.getTopRatedBooks);

// @desc    Get reviews for a book
// @route   GET /api/reviews/book/:bookId
// @access  Public
router.get('/book/:bookId', validationMiddleware.pagination, reviewsController.getBookReviews);

// @desc    Get review by ID
// @route   GET /api/reviews/:id
// @access  Public
router.get('/:id', reviewsController.getReviewById);

// @desc    Update user's review
// @route   PUT /api/reviews/:id
// @access  Private
router.put('/:id', authenticate, validationMiddleware.updateReview, reviewsController.updateReview);

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
router.delete('/:id', authenticate, reviewsController.deleteReview);

module.exports = router;
