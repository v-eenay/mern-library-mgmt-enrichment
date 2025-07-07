const mongoose = require('mongoose');

const borrowSchema = new mongoose.Schema({
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
  borrowDate: {
    type: Date,
    required: [true, 'Borrow date is required'],
    default: Date.now
  },
  returnDate: {
    type: Date,
    default: null,
    validate: {
      validator: function(value) {
        // If returnDate is provided, it should be after borrowDate
        if (value && this.borrowDate) {
          return value >= this.borrowDate;
        }
        return true;
      },
      message: 'Return date must be after borrow date'
    }
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
borrowSchema.index({ userId: 1 });
borrowSchema.index({ bookId: 1 });
borrowSchema.index({ borrowDate: -1 });
borrowSchema.index({ returnDate: 1 });
borrowSchema.index({ createdAt: -1 });

// Compound indexes for common queries
borrowSchema.index({ userId: 1, returnDate: 1 }); // For finding active borrows by user
borrowSchema.index({ bookId: 1, returnDate: 1 }); // For finding active borrows by book
borrowSchema.index({ userId: 1, bookId: 1 }); // For checking if user has borrowed specific book

// Prevent duplicate active borrows (same user borrowing same book)
borrowSchema.index(
  { userId: 1, bookId: 1, returnDate: 1 },
  { 
    unique: true,
    partialFilterExpression: { returnDate: null }
  }
);

// Virtual for borrow duration in days
borrowSchema.virtual('borrowDuration').get(function() {
  const endDate = this.returnDate || new Date();
  const diffTime = Math.abs(endDate - this.borrowDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual to check if book is currently borrowed (not returned)
borrowSchema.virtual('isActive').get(function() {
  return this.returnDate === null;
});

// Static method to find active borrows
borrowSchema.statics.findActive = function() {
  return this.find({ returnDate: null });
};

// Static method to find active borrows by user
borrowSchema.statics.findActiveByUser = function(userId) {
  return this.find({ userId, returnDate: null }).populate('bookId', 'title author isbn');
};

// Static method to find active borrows by book
borrowSchema.statics.findActiveByBook = function(bookId) {
  return this.find({ bookId, returnDate: null }).populate('userId', 'name email');
};

// Static method to find borrow history by user
borrowSchema.statics.findHistoryByUser = function(userId) {
  return this.find({ userId }).populate('bookId', 'title author isbn').sort({ borrowDate: -1 });
};

// Static method to find borrow history by book
borrowSchema.statics.findHistoryByBook = function(bookId) {
  return this.find({ bookId }).populate('userId', 'name email').sort({ borrowDate: -1 });
};

// Static method to check if user has already borrowed a specific book (and not returned)
borrowSchema.statics.hasActiveBorrow = function(userId, bookId) {
  return this.findOne({ userId, bookId, returnDate: null });
};

// Instance method to mark as returned
borrowSchema.methods.markAsReturned = function() {
  this.returnDate = new Date();
  return this.save();
};

// Pre-save middleware to validate business rules
borrowSchema.pre('save', async function(next) {
  try {
    // If this is a new borrow (not an update)
    if (this.isNew) {
      // Check if user already has an active borrow for this book
      const existingBorrow = await this.constructor.hasActiveBorrow(this.userId, this.bookId);
      if (existingBorrow) {
        const error = new Error('User already has an active borrow for this book');
        error.name = 'ValidationError';
        return next(error);
      }

      // Check if book is available
      const Book = mongoose.model('Book');
      const book = await Book.findById(this.bookId);
      if (!book) {
        const error = new Error('Book not found');
        error.name = 'ValidationError';
        return next(error);
      }
      
      if (book.available <= 0) {
        const error = new Error('Book is not available for borrowing');
        error.name = 'ValidationError';
        return next(error);
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Borrow', borrowSchema);
