const { Book, Review, Borrow } = require('../models');
const { sendSuccess, sendError, asyncHandler, isValidObjectId, getPagination } = require('../utils/helpers');
const { deleteFile, getFileUrl } = require('../middleware/upload');

// @desc    Get all books with pagination, search, and filtering
// @route   GET /api/books
// @access  Public
const getAllBooks = asyncHandler(async (req, res) => {
  const { 
    page = 0, 
    limit = 10, 
    category, 
    search, 
    available, 
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query;
  
  const { limit: pageLimit, offset } = getPagination(page, limit);

  // Build query
  let query = {};
  if (category) query.category = new RegExp(category, 'i');
  if (available === 'true') query.available = { $gt: 0 };
  if (search) {
    query.$or = [
      { title: new RegExp(search, 'i') },
      { author: new RegExp(search, 'i') },
      { isbn: new RegExp(search, 'i') }
    ];
  }

  // Build sort
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const books = await Book.find(query)
    .sort(sort)
    .limit(pageLimit)
    .skip(offset);

  const total = await Book.countDocuments(query);

  // Generate full URLs for cover images
  const booksWithUrls = books.map(book => {
    const bookObj = book.toObject();
    if (bookObj.coverImage) {
      bookObj.coverImage = getFileUrl(req, bookObj.coverImage);
    }
    return bookObj;
  });

  sendSuccess(res, 'Books retrieved successfully', {
    books: booksWithUrls,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
});

// @desc    Get book by ID with reviews
// @route   GET /api/books/:id
// @access  Public
const getBookById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid book ID', 400);
  }

  const book = await Book.findById(id);
  if (!book) {
    return sendError(res, 'Book not found', 404);
  }

  // Get average rating and review count
  const reviewStats = await Review.getAverageRating(id);

  // Generate full URL for cover image if it exists
  const bookObj = book.toObject();
  if (bookObj.coverImage) {
    bookObj.coverImage = getFileUrl(req, bookObj.coverImage);
  }

  sendSuccess(res, 'Book retrieved successfully', {
    book: {
      ...bookObj,
      averageRating: reviewStats.averageRating,
      totalReviews: reviewStats.totalReviews,
      ratingDistribution: reviewStats.ratingDistribution
    }
  });
});

// @desc    Create new book
// @route   POST /api/books
// @access  Private (Librarian only)
const createBook = asyncHandler(async (req, res) => {
  const { title, author, isbn, category, description, quantity, coverImage } = req.body;

  // Check if ISBN already exists
  const existingBook = await Book.findOne({ isbn });
  if (existingBook) {
    return sendError(res, 'Book with this ISBN already exists', 400);
  }

  const book = new Book({
    title,
    author,
    isbn,
    category,
    description,
    quantity,
    available: quantity,
    coverImage
  });

  await book.save();

  sendSuccess(res, 'Book created successfully', { book }, 201);
});

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Librarian only)
const updateBook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid book ID', 400);
  }

  const book = await Book.findById(id);
  if (!book) {
    return sendError(res, 'Book not found', 404);
  }

  // Check if ISBN is being changed and if it already exists
  if (updateData.isbn && updateData.isbn !== book.isbn) {
    const existingBook = await Book.findOne({ isbn: updateData.isbn });
    if (existingBook) {
      return sendError(res, 'Book with this ISBN already exists', 400);
    }
  }

  // Validate available count doesn't exceed quantity
  if (updateData.available !== undefined && updateData.quantity !== undefined) {
    if (updateData.available > updateData.quantity) {
      return sendError(res, 'Available count cannot exceed total quantity', 400);
    }
  } else if (updateData.available !== undefined) {
    if (updateData.available > book.quantity) {
      return sendError(res, 'Available count cannot exceed total quantity', 400);
    }
  } else if (updateData.quantity !== undefined) {
    if (book.available > updateData.quantity) {
      return sendError(res, 'Cannot reduce quantity below current available count', 400);
    }
  }

  Object.assign(book, updateData);
  await book.save();

  sendSuccess(res, 'Book updated successfully', { book });
});

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Librarian only)
const deleteBook = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid book ID', 400);
  }

  const book = await Book.findById(id);
  if (!book) {
    return sendError(res, 'Book not found', 404);
  }

  // Check if book has active borrows
  const activeBorrows = await Borrow.findActiveByBook(id);
  if (activeBorrows.length > 0) {
    return sendError(res, 'Cannot delete book with active borrows', 400);
  }

  await Book.findByIdAndDelete(id);

  sendSuccess(res, 'Book deleted successfully');
});

// @desc    Get available books
// @route   GET /api/books/available/list
// @access  Public
const getAvailableBooks = asyncHandler(async (req, res) => {
  const books = await Book.findAvailable().sort({ title: 1 });

  sendSuccess(res, 'Available books retrieved successfully', { books });
});

// @desc    Search books by category
// @route   GET /api/books/category/:category
// @access  Public
const getBooksByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const books = await Book.findByCategory(category).sort({ title: 1 });

  sendSuccess(res, 'Books by category retrieved successfully', { books, category });
});

// @desc    Upload book cover image
// @route   POST /api/books/:id/upload-cover
// @access  Private (Librarian only)
const uploadBookCover = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    // Clean up uploaded file if invalid ID
    if (req.file) {
      await deleteFile(req.file.path);
    }
    return sendError(res, 'Invalid book ID', 400);
  }

  if (!req.file) {
    return sendError(res, 'No file uploaded', 400);
  }

  const book = await Book.findById(id);
  if (!book) {
    // Clean up uploaded file if book not found
    await deleteFile(req.file.path);
    return sendError(res, 'Book not found', 404);
  }

  // Delete old cover image if it exists and it's a local file
  if (book.coverImage && book.coverImage.startsWith('uploads/')) {
    await deleteFile(book.coverImage).catch(err => {
      console.error('Error deleting old cover image:', err);
    });
  }

  // Update book with new cover image path
  const coverImagePath = `uploads/books/${req.file.filename}`;
  book.coverImage = coverImagePath;
  await book.save();

  // Generate full URL for response
  const coverImageUrl = getFileUrl(req, coverImagePath);

  sendSuccess(res, 'Book cover uploaded successfully', {
    book: {
      ...book.toObject(),
      coverImage: coverImageUrl
    }
  });
});

// @desc    Update book cover image
// @route   PUT /api/books/:id/update-cover
// @access  Private (Librarian only)
const updateBookCover = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    // Clean up uploaded file if invalid ID
    if (req.file) {
      await deleteFile(req.file.path);
    }
    return sendError(res, 'Invalid book ID', 400);
  }

  if (!req.file) {
    return sendError(res, 'No file uploaded', 400);
  }

  const book = await Book.findById(id);
  if (!book) {
    // Clean up uploaded file if book not found
    await deleteFile(req.file.path);
    return sendError(res, 'Book not found', 404);
  }

  // Delete old cover image if it exists and it's a local file
  if (book.coverImage && book.coverImage.startsWith('uploads/')) {
    await deleteFile(book.coverImage).catch(err => {
      console.error('Error deleting old cover image:', err);
    });
  }

  // Update book with new cover image path
  const coverImagePath = `uploads/books/${req.file.filename}`;
  book.coverImage = coverImagePath;
  await book.save();

  // Generate full URL for response
  const coverImageUrl = getFileUrl(req, coverImagePath);

  sendSuccess(res, 'Book cover updated successfully', {
    book: {
      ...book.toObject(),
      coverImage: coverImageUrl
    }
  });
});

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getAvailableBooks,
  getBooksByCategory,
  uploadBookCover,
  updateBookCover
};
