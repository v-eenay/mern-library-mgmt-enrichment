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
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    validate: {
      validator: function(value) {
        // Due date should be after borrow date
        if (value && this.borrowDate) {
          return value > this.borrowDate;
        }
        return true;
      },
      message: 'Due date must be after borrow date'
    }
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
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['active', 'returned', 'overdue'],
      message: 'Status must be either active, returned, or overdue'
    },
    default: 'active'
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
borrowSchema.index({ dueDate: 1 });
borrowSchema.index({ returnDate: 1 });
borrowSchema.index({ status: 1 });
borrowSchema.index({ createdAt: -1 });

// Compound indexes for common queries
borrowSchema.index({ userId: 1, status: 1 }); // For finding borrows by user and status
borrowSchema.index({ bookId: 1, status: 1 }); // For finding borrows by book and status
borrowSchema.index({ userId: 1, bookId: 1 }); // For checking if user has borrowed specific book
borrowSchema.index({ status: 1, dueDate: 1 }); // For finding overdue books
borrowSchema.index({ userId: 1, returnDate: 1 }); // For finding active borrows by user (legacy)
borrowSchema.index({ bookId: 1, returnDate: 1 }); // For finding active borrows by book (legacy)

// Prevent duplicate active borrows (same user borrowing same book)
borrowSchema.index(
  { userId: 1, bookId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'active' }
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
  return this.status === 'active';
});

// Virtual to check if book is overdue
borrowSchema.virtual('isOverdue').get(function() {
  if (this.status !== 'active') return false;
  return new Date() > this.dueDate;
});

// Virtual for days until due (negative if overdue)
borrowSchema.virtual('daysUntilDue').get(function() {
  if (this.status !== 'active') return null;
  const diffTime = this.dueDate - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for days overdue (0 if not overdue)
borrowSchema.virtual('daysOverdue').get(function() {
  if (this.status !== 'active') return 0;
  const diffTime = new Date() - this.dueDate;
  return diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
});

// Static method to find active borrows
borrowSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Static method to find active borrows by user
borrowSchema.statics.findActiveByUser = function(userId) {
  return this.find({ userId, status: 'active' }).populate('bookId', 'title author isbn');
};

// Static method to find active borrows by book
borrowSchema.statics.findActiveByBook = function(bookId) {
  return this.find({ bookId, status: 'active' }).populate('userId', 'name email');
};

// Static method to find overdue borrows
borrowSchema.statics.findOverdue = function() {
  return this.find({
    status: 'active',
    dueDate: { $lt: new Date() }
  }).populate('userId', 'name email').populate('bookId', 'title author isbn');
};

// Static method to find overdue borrows by user
borrowSchema.statics.findOverdueByUser = function(userId) {
  return this.find({
    userId,
    status: 'active',
    dueDate: { $lt: new Date() }
  }).populate('bookId', 'title author isbn');
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
  return this.findOne({ userId, bookId, status: 'active' });
};

// Static method to count active borrows by user
borrowSchema.statics.countActiveByUser = function(userId) {
  return this.countDocuments({ userId, status: 'active' });
};

// Static method to calculate due date (default 14 days from borrow date)
borrowSchema.statics.calculateDueDate = function(borrowDate = new Date(), borrowPeriodDays = 14) {
  const dueDate = new Date(borrowDate);
  dueDate.setDate(dueDate.getDate() + borrowPeriodDays);
  return dueDate;
};

// Instance method to mark as returned
borrowSchema.methods.markAsReturned = function() {
  this.returnDate = new Date();
  this.status = 'returned';
  return this.save();
};

// Instance method to mark as overdue
borrowSchema.methods.markAsOverdue = function() {
  if (this.status === 'active' && new Date() > this.dueDate) {
    this.status = 'overdue';
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to extend due date
borrowSchema.methods.extendDueDate = function(additionalDays = 7) {
  if (this.status === 'active' || this.status === 'overdue') {
    const newDueDate = new Date(this.dueDate);
    newDueDate.setDate(newDueDate.getDate() + additionalDays);
    this.dueDate = newDueDate;
    if (this.status === 'overdue' && new Date() <= newDueDate) {
      this.status = 'active';
    }
    return this.save();
  }
  throw new Error('Cannot extend due date for returned books');
};

// Pre-save middleware to validate business rules
borrowSchema.pre('save', async function(next) {
  try {
    // If this is a new borrow (not an update)
    if (this.isNew) {
      // Set due date if not provided (14 days from borrow date)
      if (!this.dueDate) {
        this.dueDate = this.constructor.calculateDueDate(this.borrowDate);
      }

      // Check borrowing limits (max 5 active borrows per user)
      const MAX_ACTIVE_BORROWS = parseInt(process.env.MAX_ACTIVE_BORROWS) || 5;
      const activeCount = await this.constructor.countActiveByUser(this.userId);
      if (activeCount >= MAX_ACTIVE_BORROWS) {
        const error = new Error(`Cannot borrow more than ${MAX_ACTIVE_BORROWS} books at once`);
        error.name = 'ValidationError';
        return next(error);
      }

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

// Static method to update overdue statuses (should be run periodically)
borrowSchema.statics.updateOverdueStatuses = async function() {
  const overdueBooks = await this.find({
    status: 'active',
    dueDate: { $lt: new Date() }
  });

  const updatePromises = overdueBooks.map(borrow => {
    borrow.status = 'overdue';
    return borrow.save();
  });

  return Promise.all(updatePromises);
};

// Static method to get borrowing statistics
borrowSchema.statics.getBorrowingStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalBorrows = await this.countDocuments();
  const activeBorrows = await this.countDocuments({ status: 'active' });
  const overdueBorrows = await this.countDocuments({ status: 'overdue' });
  const returnedBorrows = await this.countDocuments({ status: 'returned' });

  return {
    total: totalBorrows,
    active: activeBorrows,
    overdue: overdueBorrows,
    returned: returnedBorrows,
    breakdown: stats
  };
};

module.exports = mongoose.model('Borrow', borrowSchema);
