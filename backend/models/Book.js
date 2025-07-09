const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  isbn: {
    type: String,
    required: [true, 'ISBN is required'],
    unique: true,
    trim: true,
    match: [
      /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/,
      'Please enter a valid ISBN'
    ]
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 1,
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be a whole number'
    }
  },
  available: {
    type: Number,
    required: [true, 'Available count is required'],
    min: [0, 'Available count cannot be negative'],
    validate: {
      validator: Number.isInteger,
      message: 'Available count must be a whole number'
    }
  },
  coverImage: {
    type: String,
    trim: true,
    default: null,
    validate: {
      validator: function(value) {
        if (!value) return true; // Allow null/empty values
        // Allow URLs or local file paths
        const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
        const localPathPattern = /^uploads\/.+\.(jpg|jpeg|png|gif)$/i;
        return urlPattern.test(value) || localPathPattern.test(value);
      },
      message: 'Please enter a valid image URL or local file path'
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
bookSchema.index({ title: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ category: 1 });
bookSchema.index({ available: 1 });
bookSchema.index({ createdAt: -1 });

// Compound indexes for common queries
bookSchema.index({ category: 1, available: 1 });
bookSchema.index({ author: 1, title: 1 });

// Pre-save middleware to set available count to quantity if not provided
bookSchema.pre('save', function(next) {
  if (this.isNew && this.available === undefined) {
    this.available = this.quantity;
  }
  next();
});

// Pre-save validation to ensure available doesn't exceed quantity
bookSchema.pre('save', function(next) {
  if (this.available > this.quantity) {
    const error = new Error('Available count cannot exceed total quantity');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

// Virtual for borrowed count
bookSchema.virtual('borrowed').get(function() {
  return this.quantity - this.available;
});

// Static method to find available books
bookSchema.statics.findAvailable = function() {
  return this.find({ available: { $gt: 0 } });
};

// Static method to find books by category
bookSchema.statics.findByCategory = function(category) {
  return this.find({ category: new RegExp(category, 'i') });
};

// Instance method to check if book is available
bookSchema.methods.isAvailable = function() {
  return this.available > 0;
};

// Instance method to borrow book (decrease available count)
bookSchema.methods.borrowBook = function() {
  if (this.available > 0) {
    this.available -= 1;
    return this.save();
  } else {
    throw new Error('Book is not available for borrowing');
  }
};

// Instance method to return book (increase available count)
bookSchema.methods.returnBook = function() {
  if (this.available < this.quantity) {
    this.available += 1;
    return this.save();
  } else {
    throw new Error('Cannot return more books than the total quantity');
  }
};

module.exports = mongoose.model('Book', bookSchema);
