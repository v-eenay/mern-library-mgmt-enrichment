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
bookSchema.index({ isbn: 1 });

// Text index for full-text search across multiple fields
bookSchema.index({
  title: 'text',
  author: 'text',
  description: 'text',
  category: 'text'
}, {
  weights: {
    title: 10,
    author: 5,
    category: 3,
    description: 1
  },
  name: 'book_text_index'
});

// Compound indexes for common queries
bookSchema.index({ category: 1, available: 1 });
bookSchema.index({ author: 1, title: 1 });
bookSchema.index({ available: 1, createdAt: -1 });
bookSchema.index({ quantity: 1, available: 1 });

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

// Advanced search static method
bookSchema.statics.advancedSearch = function(searchParams) {
  const {
    q,
    search,
    title,
    author,
    isbn,
    category,
    available,
    minQuantity,
    maxQuantity,
    dateFrom,
    dateTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 0,
    limit = 10
  } = searchParams;

  // Build aggregation pipeline
  const pipeline = [];

  // Match stage for filtering
  const matchConditions = {};

  // Text search across multiple fields
  const searchTerm = q || search;
  if (searchTerm) {
    matchConditions.$text = { $search: searchTerm };
  }

  // Specific field searches
  if (title) {
    matchConditions.title = new RegExp(title, 'i');
  }

  if (author) {
    matchConditions.author = new RegExp(author, 'i');
  }

  if (isbn) {
    matchConditions.isbn = new RegExp(isbn, 'i');
  }

  // Category filtering (support multiple categories)
  if (category) {
    if (Array.isArray(category)) {
      matchConditions.category = { $in: category.map(cat => new RegExp(cat, 'i')) };
    } else {
      matchConditions.category = new RegExp(category, 'i');
    }
  }

  // Availability filtering
  if (available !== undefined) {
    if (available === 'true' || available === true) {
      matchConditions.available = { $gt: 0 };
    } else if (available === 'false' || available === false) {
      matchConditions.available = { $eq: 0 };
    }
    // If available === 'all', no filter is applied
  }

  // Quantity range filtering
  if (minQuantity !== undefined || maxQuantity !== undefined) {
    matchConditions.quantity = {};
    if (minQuantity !== undefined) {
      matchConditions.quantity.$gte = parseInt(minQuantity);
    }
    if (maxQuantity !== undefined) {
      matchConditions.quantity.$lte = parseInt(maxQuantity);
    }
  }

  // Date range filtering
  if (dateFrom || dateTo) {
    matchConditions.createdAt = {};
    if (dateFrom) {
      matchConditions.createdAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      matchConditions.createdAt.$lte = new Date(dateTo);
    }
  }

  // Add match stage if there are conditions
  if (Object.keys(matchConditions).length > 0) {
    pipeline.push({ $match: matchConditions });
  }

  // Add text score for text search
  if (searchTerm) {
    pipeline.push({
      $addFields: {
        score: { $meta: 'textScore' }
      }
    });
  }

  // Sort stage
  const sortStage = {};
  if (searchTerm) {
    // Sort by text score first, then by specified field
    sortStage.score = { $meta: 'textScore' };
    sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;
  } else {
    sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;
  }
  pipeline.push({ $sort: sortStage });

  // Pagination
  const skip = parseInt(page) * parseInt(limit);
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: parseInt(limit) });

  return this.aggregate(pipeline);
};

// Count documents for advanced search
bookSchema.statics.countAdvancedSearch = function(searchParams) {
  const {
    q,
    search,
    title,
    author,
    isbn,
    category,
    available,
    minQuantity,
    maxQuantity,
    dateFrom,
    dateTo
  } = searchParams;

  // Build match conditions (same as in advancedSearch)
  const matchConditions = {};

  const searchTerm = q || search;
  if (searchTerm) {
    matchConditions.$text = { $search: searchTerm };
  }

  if (title) {
    matchConditions.title = new RegExp(title, 'i');
  }

  if (author) {
    matchConditions.author = new RegExp(author, 'i');
  }

  if (isbn) {
    matchConditions.isbn = new RegExp(isbn, 'i');
  }

  if (category) {
    if (Array.isArray(category)) {
      matchConditions.category = { $in: category.map(cat => new RegExp(cat, 'i')) };
    } else {
      matchConditions.category = new RegExp(category, 'i');
    }
  }

  if (available !== undefined) {
    if (available === 'true' || available === true) {
      matchConditions.available = { $gt: 0 };
    } else if (available === 'false' || available === false) {
      matchConditions.available = { $eq: 0 };
    }
  }

  if (minQuantity !== undefined || maxQuantity !== undefined) {
    matchConditions.quantity = {};
    if (minQuantity !== undefined) {
      matchConditions.quantity.$gte = parseInt(minQuantity);
    }
    if (maxQuantity !== undefined) {
      matchConditions.quantity.$lte = parseInt(maxQuantity);
    }
  }

  if (dateFrom || dateTo) {
    matchConditions.createdAt = {};
    if (dateFrom) {
      matchConditions.createdAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      matchConditions.createdAt.$lte = new Date(dateTo);
    }
  }

  return this.countDocuments(matchConditions);
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
