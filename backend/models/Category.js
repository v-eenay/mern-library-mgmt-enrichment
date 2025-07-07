const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters'],
    minlength: [2, 'Category name must be at least 2 characters long']
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
categorySchema.index({ createdAt: -1 });

// Pre-save middleware to normalize category name
categorySchema.pre('save', function(next) {
  // Convert to title case (first letter of each word capitalized)
  this.name = this.name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  next();
});

// Static method to find category by name (case-insensitive)
categorySchema.statics.findByName = function(name) {
  return this.findOne({ name: new RegExp(`^${name}$`, 'i') });
};

// Static method to get all categories sorted by name
categorySchema.statics.getAllSorted = function() {
  return this.find({}).sort({ name: 1 });
};

// Static method to search categories by partial name match
categorySchema.statics.searchByName = function(searchTerm) {
  return this.find({ 
    name: new RegExp(searchTerm, 'i') 
  }).sort({ name: 1 });
};

// Virtual to get book count for this category
categorySchema.virtual('bookCount', {
  ref: 'Book',
  localField: 'name',
  foreignField: 'category',
  count: true
});

// Instance method to check if category has books
categorySchema.methods.hasBooks = async function() {
  const Book = mongoose.model('Book');
  const count = await Book.countDocuments({ category: this.name });
  return count > 0;
};

// Pre-remove middleware to prevent deletion of categories with books
categorySchema.pre('remove', async function(next) {
  try {
    const hasBooks = await this.hasBooks();
    if (hasBooks) {
      const error = new Error('Cannot delete category that has books associated with it');
      error.name = 'ValidationError';
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-deleteOne middleware to prevent deletion of categories with books
categorySchema.pre('deleteOne', async function(next) {
  try {
    const category = await this.model.findOne(this.getFilter());
    if (category) {
      const hasBooks = await category.hasBooks();
      if (hasBooks) {
        const error = new Error('Cannot delete category that has books associated with it');
        error.name = 'ValidationError';
        return next(error);
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-findOneAndDelete middleware to prevent deletion of categories with books
categorySchema.pre('findOneAndDelete', async function(next) {
  try {
    const category = await this.model.findOne(this.getFilter());
    if (category) {
      const hasBooks = await category.hasBooks();
      if (hasBooks) {
        const error = new Error('Cannot delete category that has books associated with it');
        error.name = 'ValidationError';
        return next(error);
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Category', categorySchema);
