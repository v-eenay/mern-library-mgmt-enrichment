const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Category, Book } = require('../models');
const { authenticate, requireLibrarian } = require('../middleware/auth');
const { sendSuccess, sendError, asyncHandler, isValidObjectId } = require('../utils/helpers');

const router = express.Router();

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
router.get('/', [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search term must not be empty')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { search } = req.query;

  let categories;
  if (search) {
    categories = await Category.searchByName(search);
  } else {
    categories = await Category.getAllSorted();
  }

  // Get book count for each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (category) => {
      const bookCount = await Book.countDocuments({ category: category.name });
      return {
        ...category.toObject(),
        bookCount
      };
    })
  );

  sendSuccess(res, 'Categories retrieved successfully', { categories: categoriesWithCount });
}));

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid category ID', 400);
  }

  const category = await Category.findById(id);
  if (!category) {
    return sendError(res, 'Category not found', 404);
  }

  // Get book count for this category
  const bookCount = await Book.countDocuments({ category: category.name });

  sendSuccess(res, 'Category retrieved successfully', {
    category: {
      ...category.toObject(),
      bookCount
    }
  });
}));

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Librarian only)
router.post('/', authenticate, requireLibrarian, [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Category name can only contain letters and spaces')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { name } = req.body;

  // Check if category already exists (case-insensitive)
  const existingCategory = await Category.findByName(name);
  if (existingCategory) {
    return sendError(res, 'Category already exists', 400);
  }

  const category = new Category({ name });
  await category.save();

  sendSuccess(res, 'Category created successfully', { category }, 201);
}));

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Librarian only)
router.put('/:id', authenticate, requireLibrarian, [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Category name can only contain letters and spaces')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { id } = req.params;
  const { name } = req.body;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid category ID', 400);
  }

  const category = await Category.findById(id);
  if (!category) {
    return sendError(res, 'Category not found', 404);
  }

  // Check if new name already exists (case-insensitive) and is different from current
  if (name.toLowerCase() !== category.name.toLowerCase()) {
    const existingCategory = await Category.findByName(name);
    if (existingCategory) {
      return sendError(res, 'Category with this name already exists', 400);
    }

    // Update all books with the old category name to the new name
    const oldName = category.name;
    category.name = name;
    await category.save();

    // Update books that use this category
    await Book.updateMany(
      { category: oldName },
      { category: name }
    );
  }

  sendSuccess(res, 'Category updated successfully', { category });
}));

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Librarian only)
router.delete('/:id', authenticate, requireLibrarian, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid category ID', 400);
  }

  const category = await Category.findById(id);
  if (!category) {
    return sendError(res, 'Category not found', 404);
  }

  // Check if category has books
  const hasBooks = await category.hasBooks();
  if (hasBooks) {
    return sendError(res, 'Cannot delete category that has books associated with it', 400);
  }

  await Category.findByIdAndDelete(id);

  sendSuccess(res, 'Category deleted successfully');
}));

// @desc    Get books by category
// @route   GET /api/categories/:id/books
// @access  Public
router.get('/:id/books', [
  query('page')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Page must be a non-negative integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('available')
    .optional()
    .isBoolean()
    .withMessage('Available must be a boolean value')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400);
  }

  const { id } = req.params;
  const { page = 0, limit = 10, available } = req.query;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid category ID', 400);
  }

  const category = await Category.findById(id);
  if (!category) {
    return sendError(res, 'Category not found', 404);
  }

  // Build query for books
  let query = { category: category.name };
  if (available === 'true') {
    query.available = { $gt: 0 };
  }

  const pageLimit = parseInt(limit);
  const offset = parseInt(page) * pageLimit;

  const books = await Book.find(query)
    .sort({ title: 1 })
    .limit(pageLimit)
    .skip(offset);

  const total = await Book.countDocuments(query);

  sendSuccess(res, 'Books in category retrieved successfully', {
    category: category.name,
    books,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
}));

// @desc    Get category statistics
// @route   GET /api/categories/stats/overview
// @access  Private (Librarian only)
router.get('/stats/overview', authenticate, requireLibrarian, asyncHandler(async (req, res) => {
  const totalCategories = await Category.countDocuments();

  // Categories with book counts
  const categoriesWithBooks = await Category.aggregate([
    {
      $lookup: {
        from: 'books',
        localField: 'name',
        foreignField: 'category',
        as: 'books'
      }
    },
    {
      $project: {
        name: 1,
        bookCount: { $size: '$books' },
        availableBooks: {
          $size: {
            $filter: {
              input: '$books',
              cond: { $gt: ['$$this.available', 0] }
            }
          }
        }
      }
    },
    {
      $sort: { bookCount: -1 }
    }
  ]);

  // Most popular categories (by book count)
  const popularCategories = categoriesWithBooks.slice(0, 5);

  // Categories with no books
  const emptyCategories = categoriesWithBooks.filter(cat => cat.bookCount === 0);

  sendSuccess(res, 'Category statistics retrieved successfully', {
    stats: {
      totalCategories,
      popularCategories,
      emptyCategories: emptyCategories.length,
      categoriesWithBooks: categoriesWithBooks.filter(cat => cat.bookCount > 0).length
    }
  });
}));

module.exports = router;
