const { Review, Book, Borrow } = require('../models');
const { sendSuccess, sendError, asyncHandler, isValidObjectId, getPagination } = require('../utils/helpers');

// @desc    Create a review for a book
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { bookId, rating, comment } = req.body;
  const userId = req.user._id;

  // Check if book exists
  const book = await Book.findById(bookId);
  if (!book) {
    return sendError(res, 'Book not found', 404);
  }

  // Check if user has already reviewed this book
  const existingReview = await Review.hasUserReviewed(userId, bookId);
  if (existingReview) {
    return sendError(res, 'You have already reviewed this book', 400);
  }

  // Check if user has borrowed this book (validation is also in the model)
  const hasBorrowed = await Borrow.findOne({ userId, bookId });
  if (!hasBorrowed) {
    return sendError(res, 'You can only review books you have borrowed', 400);
  }

  const review = new Review({
    userId,
    bookId,
    rating,
    comment: comment || ''
  });

  await review.save();

  // Populate the review for response
  await review.populate('userId', 'name');
  await review.populate('bookId', 'title author');

  sendSuccess(res, 'Review created successfully', { review }, 201);
});

// @desc    Get reviews for a book
// @route   GET /api/reviews/book/:bookId
// @access  Public
const getBookReviews = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const { page = 0, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  if (!isValidObjectId(bookId)) {
    return sendError(res, 'Invalid book ID', 400);
  }

  // Check if book exists
  const book = await Book.findById(bookId);
  if (!book) {
    return sendError(res, 'Book not found', 404);
  }

  const { limit: pageLimit, offset } = getPagination(page, limit);

  const reviews = await Review.findByBook(bookId, {
    limit: pageLimit,
    skip: offset,
    sortBy,
    sortOrder: sortOrder === 'asc' ? 1 : -1
  });

  const total = await Review.countDocuments({ bookId });

  // Get average rating and distribution
  const reviewStats = await Review.getAverageRating(bookId);

  sendSuccess(res, 'Book reviews retrieved successfully', {
    bookId,
    bookTitle: book.title,
    reviews,
    reviewStats,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
});

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
const getMyReviews = asyncHandler(async (req, res) => {
  const { page = 0, limit = 10 } = req.query;
  const userId = req.user._id;
  const { limit: pageLimit, offset } = getPagination(page, limit);

  const reviews = await Review.findByUser(userId, {
    limit: pageLimit,
    skip: offset
  });

  const total = await Review.countDocuments({ userId });

  sendSuccess(res, 'User reviews retrieved successfully', {
    reviews,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
});

// @desc    Get reviews by user ID (Librarian only)
// @route   GET /api/reviews/user/:userId
// @access  Private (Librarian only)
const getUserReviews = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 0, limit = 10 } = req.query;

  if (!isValidObjectId(userId)) {
    return sendError(res, 'Invalid user ID', 400);
  }

  // Check if user exists
  const User = require('../models/User');
  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  const { limit: pageLimit, offset } = getPagination(page, limit);

  const reviews = await Review.findByUser(userId, {
    limit: pageLimit,
    skip: offset
  });

  const total = await Review.countDocuments({ userId });

  sendSuccess(res, 'User reviews retrieved successfully', {
    userId,
    userName: user.name,
    reviews,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
});

// @desc    Get review by ID
// @route   GET /api/reviews/:id
// @access  Public
const getReviewById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid review ID', 400);
  }

  const review = await Review.findById(id)
    .populate('userId', 'name')
    .populate('bookId', 'title author isbn');

  if (!review) {
    return sendError(res, 'Review not found', 404);
  }

  sendSuccess(res, 'Review retrieved successfully', { review });
});

// @desc    Update user's review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid review ID', 400);
  }

  const review = await Review.findById(id);
  if (!review) {
    return sendError(res, 'Review not found', 404);
  }

  // Check if user owns this review (unless librarian)
  if (req.user.role !== 'librarian' && review.userId.toString() !== userId.toString()) {
    return sendError(res, 'You can only update your own reviews', 403);
  }

  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;

  await review.save();

  // Populate for response
  await review.populate('userId', 'name');
  await review.populate('bookId', 'title author');

  sendSuccess(res, 'Review updated successfully', { review });
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid review ID', 400);
  }

  const review = await Review.findById(id);
  if (!review) {
    return sendError(res, 'Review not found', 404);
  }

  // Check if user owns this review (unless librarian)
  if (req.user.role !== 'librarian' && review.userId.toString() !== userId.toString()) {
    return sendError(res, 'You can only delete your own reviews', 403);
  }

  await Review.findByIdAndDelete(id);

  sendSuccess(res, 'Review deleted successfully');
});

// @desc    Get all reviews (Librarian only)
// @route   GET /api/reviews
// @access  Private (Librarian only)
const getAllReviews = asyncHandler(async (req, res) => {
  const { page = 0, limit = 10, rating, userId, bookId } = req.query;
  const { limit: pageLimit, offset } = getPagination(page, limit);

  // Build query
  let query = {};
  if (rating) query.rating = parseInt(rating);
  if (userId) query.userId = userId;
  if (bookId) query.bookId = bookId;

  const reviews = await Review.find(query)
    .populate('userId', 'name email')
    .populate('bookId', 'title author isbn')
    .sort({ createdAt: -1 })
    .limit(pageLimit)
    .skip(offset);

  const total = await Review.countDocuments(query);

  sendSuccess(res, 'All reviews retrieved successfully', {
    reviews,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
});

// @desc    Get recent reviews
// @route   GET /api/reviews/recent/list
// @access  Public
const getRecentReviews = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const reviews = await Review.getRecentReviews(parseInt(limit));

  sendSuccess(res, 'Recent reviews retrieved successfully', { reviews });
});

// @desc    Get top-rated books
// @route   GET /api/reviews/top-rated/books
// @access  Public
const getTopRatedBooks = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const topRatedBooks = await Review.getTopRatedBooks(parseInt(limit));

  sendSuccess(res, 'Top-rated books retrieved successfully', { books: topRatedBooks });
});

// @desc    Get review analytics and insights
// @route   GET /api/reviews/analytics/overview
// @access  Private (Librarian only)
const getReviewAnalytics = asyncHandler(async (req, res) => {
  const [
    totalReviews,
    averageRatingOverall,
    ratingDistribution,
    reviewsThisMonth,
    topReviewers,
    recentTrends
  ] = await Promise.all([
    // Total reviews count
    Review.countDocuments(),

    // Overall average rating
    Review.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' }
        }
      }
    ]),

    // Rating distribution across all reviews
    Review.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]),

    // Reviews this month
    Review.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    }),

    // Top reviewers (users with most reviews)
    Review.aggregate([
      {
        $group: {
          _id: '$userId',
          reviewCount: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      },
      {
        $sort: { reviewCount: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          userName: '$user.name',
          reviewCount: 1,
          averageRating: { $round: ['$averageRating', 1] }
        }
      }
    ]),

    // Review trends (last 6 months)
    Review.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ])
  ]);

  // Process rating distribution
  const distributionMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingDistribution.forEach(item => {
    distributionMap[item._id] = item.count;
  });

  const analytics = {
    overview: {
      totalReviews,
      averageRatingOverall: averageRatingOverall[0]?.averageRating
        ? Math.round(averageRatingOverall[0].averageRating * 10) / 10
        : 0,
      reviewsThisMonth,
      ratingDistribution: distributionMap
    },
    topReviewers,
    trends: recentTrends.map(trend => ({
      month: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
      reviewCount: trend.count,
      averageRating: Math.round(trend.averageRating * 10) / 10
    }))
  };

  sendSuccess(res, 'Review analytics retrieved successfully', { analytics });
});

// @desc    Get book rating insights
// @route   GET /api/reviews/insights/books
// @access  Private (Librarian only)
const getBookRatingInsights = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;

  const insights = await Review.aggregate([
    {
      $group: {
        _id: '$bookId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    },
    {
      $match: {
        totalReviews: { $gte: 2 } // Only books with at least 2 reviews
      }
    },
    {
      $lookup: {
        from: 'books',
        localField: '_id',
        foreignField: '_id',
        as: 'book'
      }
    },
    {
      $unwind: '$book'
    },
    {
      $addFields: {
        ratingVariance: {
          $let: {
            vars: {
              mean: '$averageRating',
              ratings: '$ratingDistribution'
            },
            in: {
              $avg: {
                $map: {
                  input: '$$ratings',
                  as: 'rating',
                  in: {
                    $pow: [{ $subtract: ['$$rating', '$$mean'] }, 2]
                  }
                }
              }
            }
          }
        }
      }
    },
    {
      $sort: { averageRating: -1, totalReviews: -1 }
    },
    {
      $limit: parseInt(limit)
    },
    {
      $project: {
        _id: 0,
        bookId: '$_id',
        title: '$book.title',
        author: '$book.author',
        category: '$book.category',
        averageRating: { $round: ['$averageRating', 1] },
        totalReviews: 1,
        ratingVariance: { $round: ['$ratingVariance', 2] },
        consistency: {
          $cond: {
            if: { $lt: ['$ratingVariance', 1] },
            then: 'High',
            else: {
              $cond: {
                if: { $lt: ['$ratingVariance', 2] },
                then: 'Medium',
                else: 'Low'
              }
            }
          }
        }
      }
    }
  ]);

  sendSuccess(res, 'Book rating insights retrieved successfully', { insights });
});

module.exports = {
  createReview,
  getBookReviews,
  getMyReviews,
  getUserReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getAllReviews,
  getRecentReviews,
  getTopRatedBooks,
  getReviewAnalytics,
  getBookRatingInsights
};
