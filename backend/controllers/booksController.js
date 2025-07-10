const { Book, Review, Borrow } = require('../models');
const { sendSuccess, sendError, asyncHandler, isValidObjectId, getPagination } = require('../utils/helpers');
const { deleteFile, getFileUrl } = require('../middleware/upload');

// @desc    Get all books with advanced search, filtering, and pagination
// @route   GET /api/books
// @access  Public
const getAllBooks = asyncHandler(async (req, res) => {
  const startTime = Date.now();

  // Extract all search parameters
  const {
    page = 0,
    limit = 10,
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
    sortOrder = 'desc'
  } = req.query;

  // Prepare search parameters for the model
  const searchParams = {
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
    sortBy,
    sortOrder,
    page: parseInt(page),
    limit: parseInt(limit)
  };

  // Perform advanced search
  const [books, total] = await Promise.all([
    Book.advancedSearch(searchParams),
    Book.countAdvancedSearch(searchParams)
  ]);

  // Generate full URLs for cover images and add search metadata
  const booksWithUrls = books.map(book => {
    const bookObj = book._id ? book : { ...book }; // Handle aggregation results
    if (bookObj.coverImage) {
      bookObj.coverImage = getFileUrl(req, bookObj.coverImage);
    }
    return bookObj;
  });

  // Calculate performance metrics for development
  const searchTime = Date.now() - startTime;

  // Build search metadata
  const searchMetadata = {
    searchTerms: {
      general: q || search || null,
      title: title || null,
      author: author || null,
      isbn: isbn || null
    },
    filtersApplied: {
      category: category || null,
      available: available || null,
      quantityRange: (minQuantity || maxQuantity) ? { min: minQuantity, max: maxQuantity } : null,
      dateRange: (dateFrom || dateTo) ? { from: dateFrom, to: dateTo } : null
    },
    sorting: {
      field: sortBy,
      order: sortOrder
    },
    performance: process.env.NODE_ENV === 'development' ? {
      searchTime: `${searchTime}ms`,
      totalResults: total,
      resultsPerPage: parseInt(limit)
    } : undefined
  };

  // Calculate pagination
  const pageLimit = parseInt(limit);
  const currentPage = parseInt(page);
  const totalPages = Math.ceil(total / pageLimit);

  sendSuccess(res, 'Books retrieved successfully', {
    books: booksWithUrls,
    pagination: {
      total,
      page: currentPage,
      limit: pageLimit,
      totalPages,
      hasNextPage: currentPage < totalPages - 1,
      hasPrevPage: currentPage > 0
    },
    search: searchMetadata
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

// @desc    Advanced search books with comprehensive filtering
// @route   GET /api/books/search/advanced
// @access  Public
const advancedSearchBooks = asyncHandler(async (req, res) => {
  const startTime = Date.now();

  // Extract all search parameters with more detailed handling
  const {
    page = 0,
    limit = 10,
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
    sortOrder = 'desc'
  } = req.query;

  // Validate date range
  if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
    return sendError(res, 'Date from cannot be later than date to', 400);
  }

  // Validate quantity range
  if (minQuantity && maxQuantity && parseInt(minQuantity) > parseInt(maxQuantity)) {
    return sendError(res, 'Minimum quantity cannot be greater than maximum quantity', 400);
  }

  // Prepare search parameters
  const searchParams = {
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
    sortBy,
    sortOrder,
    page: parseInt(page),
    limit: parseInt(limit)
  };

  try {
    // Perform advanced search with error handling
    const [books, total] = await Promise.all([
      Book.advancedSearch(searchParams),
      Book.countAdvancedSearch(searchParams)
    ]);

    // Process results
    const booksWithUrls = books.map(book => {
      const bookObj = book._id ? book : { ...book };
      if (bookObj.coverImage) {
        bookObj.coverImage = getFileUrl(req, bookObj.coverImage);
      }
      // Add search score if available
      if (book.score !== undefined) {
        bookObj.searchScore = book.score;
      }
      return bookObj;
    });

    // Performance metrics
    const searchTime = Date.now() - startTime;

    // Detailed search metadata
    const searchMetadata = {
      query: {
        fullText: q || search || null,
        fields: {
          title: title || null,
          author: author || null,
          isbn: isbn || null
        }
      },
      filters: {
        category: category ? (Array.isArray(category) ? category : [category]) : null,
        availability: available || null,
        quantityRange: (minQuantity || maxQuantity) ? {
          min: minQuantity ? parseInt(minQuantity) : null,
          max: maxQuantity ? parseInt(maxQuantity) : null
        } : null,
        dateRange: (dateFrom || dateTo) ? {
          from: dateFrom || null,
          to: dateTo || null
        } : null
      },
      sorting: {
        field: sortBy,
        order: sortOrder,
        textScoreUsed: !!(q || search)
      },
      results: {
        total,
        returned: booksWithUrls.length,
        page: parseInt(page),
        limit: parseInt(limit)
      },
      performance: process.env.NODE_ENV === 'development' ? {
        searchTime: `${searchTime}ms`,
        indexesUsed: !!(q || search) ? ['text_index'] : ['standard_indexes']
      } : undefined
    };

    // Enhanced pagination
    const pageLimit = parseInt(limit);
    const currentPage = parseInt(page);
    const totalPages = Math.ceil(total / pageLimit);

    sendSuccess(res, 'Advanced search completed successfully', {
      books: booksWithUrls,
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        totalPages,
        hasNextPage: currentPage < totalPages - 1,
        hasPrevPage: currentPage > 0,
        nextPage: currentPage < totalPages - 1 ? currentPage + 1 : null,
        prevPage: currentPage > 0 ? currentPage - 1 : null
      },
      search: searchMetadata
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    return sendError(res, 'Search operation failed. Please try again.', 500);
  }
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
  advancedSearchBooks,
  uploadBookCover,
  updateBookCover
};
