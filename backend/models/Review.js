const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book ID is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be a whole number'
    }
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
reviewSchema.index({ userId: 1 });
reviewSchema.index({ bookId: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

// Compound indexes for common queries
reviewSchema.index({ bookId: 1, rating: -1 }); // For book reviews sorted by rating
reviewSchema.index({ userId: 1, createdAt: -1 }); // For user's review history
reviewSchema.index({ bookId: 1, createdAt: -1 }); // For book's review history

// Unique compound index to prevent duplicate reviews from same user for same book
reviewSchema.index({ userId: 1, bookId: 1 }, { unique: true });

// Virtual for formatted creation date
reviewSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual to check if review has comment
reviewSchema.virtual('hasComment').get(function() {
  return this.comment && this.comment.trim().length > 0;
});

// Static method to find reviews by book
reviewSchema.statics.findByBook = function(bookId, options = {}) {
  const { limit = 10, skip = 0, sortBy = 'createdAt', sortOrder = -1 } = options;
  
  return this.find({ bookId })
    .populate('userId', 'name')
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .skip(skip);
};

// Static method to find reviews by user
reviewSchema.statics.findByUser = function(userId, options = {}) {
  const { limit = 10, skip = 0 } = options;
  
  return this.find({ userId })
    .populate('bookId', 'title author')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get average rating for a book
reviewSchema.statics.getAverageRating = async function(bookId) {
  const result = await this.aggregate([
    { $match: { bookId: new mongoose.Types.ObjectId(bookId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (result.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const data = result[0];
  
  // Calculate rating distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  data.ratingDistribution.forEach(rating => {
    distribution[rating]++;
  });

  return {
    averageRating: Math.round(data.averageRating * 10) / 10, // Round to 1 decimal place
    totalReviews: data.totalReviews,
    ratingDistribution: distribution
  };
};

// Static method to check if user has already reviewed a book
reviewSchema.statics.hasUserReviewed = function(userId, bookId) {
  return this.findOne({ userId, bookId });
};

// Static method to get recent reviews
reviewSchema.statics.getRecentReviews = function(limit = 10) {
  return this.find({})
    .populate('userId', 'name')
    .populate('bookId', 'title author')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get top-rated books
reviewSchema.statics.getTopRatedBooks = async function(limit = 10) {
  return this.aggregate([
    {
      $group: {
        _id: '$bookId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    },
    {
      $match: {
        totalReviews: { $gte: 3 } // Only books with at least 3 reviews
      }
    },
    {
      $sort: { averageRating: -1, totalReviews: -1 }
    },
    {
      $limit: limit
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
      $project: {
        _id: 0,
        bookId: '$_id',
        title: '$book.title',
        author: '$book.author',
        averageRating: { $round: ['$averageRating', 1] },
        totalReviews: 1
      }
    }
  ]);
};

// Pre-save middleware to validate that user has borrowed the book before reviewing
reviewSchema.pre('save', async function(next) {
  try {
    // Only check for new reviews
    if (this.isNew) {
      const Borrow = mongoose.model('Borrow');
      const hasBorrowed = await Borrow.findOne({ 
        userId: this.userId, 
        bookId: this.bookId 
      });
      
      if (!hasBorrowed) {
        const error = new Error('You can only review books you have borrowed');
        error.name = 'ValidationError';
        return next(error);
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Post-save middleware to update book rating data
reviewSchema.post('save', async function(doc) {
  try {
    const Book = mongoose.model('Book');
    const ratingStats = await this.constructor.getAverageRating(doc.bookId);
    const book = await Book.findById(doc.bookId);
    if (book) {
      await book.updateRatingData(ratingStats);
    }
  } catch (error) {
    console.error('Error updating book rating data:', error);
  }
});

// Post-remove middleware to update book rating data
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    try {
      const Book = mongoose.model('Book');
      const ratingStats = await mongoose.model('Review').getAverageRating(doc.bookId);
      const book = await Book.findById(doc.bookId);
      if (book) {
        await book.updateRatingData(ratingStats);
      }
    } catch (error) {
      console.error('Error updating book rating data after deletion:', error);
    }
  }
});

// Post-update middleware to update book rating data
reviewSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    try {
      const Book = mongoose.model('Book');
      const ratingStats = await mongoose.model('Review').getAverageRating(doc.bookId);
      const book = await Book.findById(doc.bookId);
      if (book) {
        await book.updateRatingData(ratingStats);
      }
    } catch (error) {
      console.error('Error updating book rating data after update:', error);
    }
  }
});

module.exports = mongoose.model('Review', reviewSchema);
