const { Borrow, Book, User } = require('../models');
const { sendSuccess, sendError, asyncHandler, isValidObjectId, getPagination } = require('../utils/helpers');
const { rbacService, PERMISSIONS } = require('../services/rbacService');

// @desc    Borrow a book
// @route   POST /api/borrows
// @access  Private
const borrowBook = asyncHandler(async (req, res) => {
  const { bookId, borrowPeriodDays } = req.body;
  const userId = req.user._id;

  // Validate borrowPeriodDays if provided
  const maxBorrowPeriod = parseInt(process.env.MAX_BORROW_PERIOD_DAYS) || 30;
  const defaultBorrowPeriod = parseInt(process.env.DEFAULT_BORROW_PERIOD_DAYS) || 14;
  const actualBorrowPeriod = borrowPeriodDays || defaultBorrowPeriod;

  if (actualBorrowPeriod > maxBorrowPeriod) {
    return sendError(res, `Borrow period cannot exceed ${maxBorrowPeriod} days`, 400);
  }

  // Check if book exists and is available
  const book = await Book.findById(bookId);
  if (!book) {
    return sendError(res, 'Book not found', 404);
  }

  if (!book.isAvailable()) {
    return sendError(res, 'Book is not available for borrowing', 400);
  }

  // Check borrowing limits
  const maxActiveBooks = parseInt(process.env.MAX_ACTIVE_BORROWS) || 5;
  const activeCount = await Borrow.countActiveByUser(userId);
  if (activeCount >= maxActiveBooks) {
    return sendError(res, `You cannot borrow more than ${maxActiveBooks} books at once`, 400);
  }

  // Check if user already has this book borrowed
  const existingBorrow = await Borrow.hasActiveBorrow(userId, bookId);
  if (existingBorrow) {
    return sendError(res, 'You have already borrowed this book', 400);
  }

  // Calculate due date
  const borrowDate = new Date();
  const dueDate = Borrow.calculateDueDate(borrowDate, actualBorrowPeriod);

  // Create borrow record
  const borrow = new Borrow({
    userId,
    bookId,
    borrowDate,
    dueDate,
    status: 'active'
  });

  await borrow.save();

  // Update book availability
  await book.borrowBook();

  // Populate the borrow record for response
  await borrow.populate('bookId', 'title author isbn');

  sendSuccess(res, 'Book borrowed successfully', {
    borrow,
    dueDate: dueDate.toISOString(),
    borrowPeriodDays: actualBorrowPeriod
  }, 201);
});

// @desc    Return a book
// @route   PUT /api/borrows/:id/return
// @access  Private
const returnBook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid borrow ID', 400);
  }

  const borrow = await Borrow.findById(id).populate('bookId', 'title author isbn');
  if (!borrow) {
    return sendError(res, 'Borrow record not found', 404);
  }

  // Check if the borrow belongs to the user (unless librarian)
  if (req.user.role !== 'librarian' && borrow.userId.toString() !== userId.toString()) {
    return sendError(res, 'You can only return your own borrowed books', 403);
  }

  // Check if book is already returned
  if (borrow.status === 'returned') {
    return sendError(res, 'Book has already been returned', 400);
  }

  // Calculate if book was returned late
  const isLate = new Date() > borrow.dueDate;
  const daysLate = isLate ? Math.ceil((new Date() - borrow.dueDate) / (1000 * 60 * 60 * 24)) : 0;

  // Mark as returned
  await borrow.markAsReturned();

  // Update book availability
  const book = await Book.findById(borrow.bookId._id);
  await book.returnBook();

  sendSuccess(res, 'Book returned successfully', {
    borrow,
    returnInfo: {
      returnedOn: borrow.returnDate,
      wasLate: isLate,
      daysLate: daysLate,
      originalDueDate: borrow.dueDate
    }
  });
});

// @desc    Get user's borrow history
// @route   GET /api/borrows/my-borrows
// @access  Private
const getMyBorrows = asyncHandler(async (req, res) => {
  const { status = 'all', page = 0, limit = 10 } = req.query;
  const { limit: pageLimit, offset } = getPagination(page, limit);
  const userId = req.user._id;

  let query = { userId };
  if (status === 'active') {
    query.status = 'active';
  } else if (status === 'returned') {
    query.status = 'returned';
  } else if (status === 'overdue') {
    query.status = 'overdue';
  }

  const borrows = await Borrow.find(query)
    .populate('bookId', 'title author isbn coverImage')
    .sort({ borrowDate: -1 })
    .limit(pageLimit)
    .skip(offset);

  // Add computed fields for each borrow
  const borrowsWithDetails = borrows.map(borrow => {
    const borrowObj = borrow.toObject({ virtuals: true });
    return {
      ...borrowObj,
      isOverdue: borrow.isOverdue,
      daysUntilDue: borrow.daysUntilDue,
      daysOverdue: borrow.daysOverdue
    };
  });

  const total = await Borrow.countDocuments(query);

  sendSuccess(res, 'Borrow history retrieved successfully', {
    borrows: borrowsWithDetails,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
});

// @desc    Get all borrows (Librarian only)
// @route   GET /api/borrows
// @access  Private (Librarian only)
const getAllBorrows = asyncHandler(async (req, res) => {
  const { status = 'all', userId, bookId, page = 0, limit = 10 } = req.query;
  const { limit: pageLimit, offset } = getPagination(page, limit);

  let query = {};
  if (status === 'active') {
    query.returnDate = null;
  } else if (status === 'returned') {
    query.returnDate = { $ne: null };
  }
  if (userId) query.userId = userId;
  if (bookId) query.bookId = bookId;

  const borrows = await Borrow.find(query)
    .populate('userId', 'name email')
    .populate('bookId', 'title author isbn')
    .sort({ borrowDate: -1 })
    .limit(pageLimit)
    .skip(offset);

  const total = await Borrow.countDocuments(query);

  sendSuccess(res, 'Borrows retrieved successfully', {
    borrows,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
});

// @desc    Get borrow by ID
// @route   GET /api/borrows/:id
// @access  Private (Own borrows or Librarian)
const getBorrowById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid borrow ID', 400);
  }

  const borrow = await Borrow.findById(id)
    .populate('userId', 'name email')
    .populate('bookId', 'title author isbn coverImage');

  if (!borrow) {
    return sendError(res, 'Borrow record not found', 404);
  }

  // Enhanced resource ownership check using RBAC
  if (!rbacService.canAccessResource(
    req.user,
    borrow,
    PERMISSIONS.BORROW_READ_OWN,
    PERMISSIONS.BORROW_READ_ALL
  )) {
    return sendError(res, 'Access denied. You can only view your own borrow records.', 403);
  }

  sendSuccess(res, 'Borrow record retrieved successfully', { borrow });
});

// @desc    Get active borrows for a specific book
// @route   GET /api/borrows/book/:bookId/active
// @access  Private (Librarian only)
const getActiveBorrowsByBook = asyncHandler(async (req, res) => {
  const { bookId } = req.params;

  if (!isValidObjectId(bookId)) {
    return sendError(res, 'Invalid book ID', 400);
  }

  const borrows = await Borrow.findActiveByBook(bookId);

  sendSuccess(res, 'Active borrows for book retrieved successfully', { borrows });
});

// @desc    Get borrow statistics
// @route   GET /api/borrows/stats/overview
// @access  Private (Librarian only)
const getBorrowStats = asyncHandler(async (req, res) => {
  const totalBorrows = await Borrow.countDocuments();
  const activeBorrows = await Borrow.countDocuments({ returnDate: null });
  const returnedBorrows = await Borrow.countDocuments({ returnDate: { $ne: null } });

  // Borrows in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentBorrows = await Borrow.countDocuments({
    borrowDate: { $gte: thirtyDaysAgo }
  });

  // Most borrowed books
  const mostBorrowedBooks = await Borrow.aggregate([
    {
      $group: {
        _id: '$bookId',
        borrowCount: { $sum: 1 }
      }
    },
    {
      $sort: { borrowCount: -1 }
    },
    {
      $limit: 5
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
        borrowCount: 1
      }
    }
  ]);

  sendSuccess(res, 'Borrow statistics retrieved successfully', {
    stats: {
      totalBorrows,
      activeBorrows,
      returnedBorrows,
      recentBorrows,
      mostBorrowedBooks
    }
  });
});

// @desc    Get overdue borrows
// @route   GET /api/borrows/overdue
// @access  Private (Librarian only)
const getOverdueBorrows = asyncHandler(async (req, res) => {
  const { page = 0, limit = 10 } = req.query;
  const { limit: pageLimit, offset } = getPagination(page, limit);

  // Update overdue statuses first
  await Borrow.updateOverdueStatuses();

  const overdueBorrows = await Borrow.find({ status: 'overdue' })
    .populate('userId', 'name email')
    .populate('bookId', 'title author isbn')
    .sort({ dueDate: 1 }) // Oldest overdue first
    .limit(pageLimit)
    .skip(offset);

  const total = await Borrow.countDocuments({ status: 'overdue' });

  // Add computed fields
  const borrowsWithDetails = overdueBorrows.map(borrow => {
    const borrowObj = borrow.toObject({ virtuals: true });
    return {
      ...borrowObj,
      daysOverdue: borrow.daysOverdue
    };
  });

  sendSuccess(res, 'Overdue borrows retrieved successfully', {
    borrows: borrowsWithDetails,
    pagination: {
      total,
      page: parseInt(page),
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit)
    }
  });
});

// @desc    Extend due date for a borrow
// @route   PUT /api/borrows/:id/extend
// @access  Private (Librarian only)
const extendDueDate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { additionalDays = 7 } = req.body;

  if (!isValidObjectId(id)) {
    return sendError(res, 'Invalid borrow ID', 400);
  }

  if (additionalDays < 1 || additionalDays > 30) {
    return sendError(res, 'Additional days must be between 1 and 30', 400);
  }

  const borrow = await Borrow.findById(id).populate('bookId', 'title author isbn');
  if (!borrow) {
    return sendError(res, 'Borrow record not found', 404);
  }

  if (borrow.status === 'returned') {
    return sendError(res, 'Cannot extend due date for returned books', 400);
  }

  const oldDueDate = new Date(borrow.dueDate);
  await borrow.extendDueDate(additionalDays);

  sendSuccess(res, 'Due date extended successfully', {
    borrow,
    extension: {
      oldDueDate,
      newDueDate: borrow.dueDate,
      additionalDays
    }
  });
});

// @desc    Get user's overdue borrows
// @route   GET /api/borrows/my-overdue
// @access  Private
const getMyOverdueBorrows = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const overdueBorrows = await Borrow.findOverdueByUser(userId);

  const borrowsWithDetails = overdueBorrows.map(borrow => {
    const borrowObj = borrow.toObject({ virtuals: true });
    return {
      ...borrowObj,
      daysOverdue: borrow.daysOverdue
    };
  });

  sendSuccess(res, 'Your overdue borrows retrieved successfully', {
    borrows: borrowsWithDetails,
    count: borrowsWithDetails.length
  });
});

// @desc    Update overdue statuses (maintenance endpoint)
// @route   POST /api/borrows/update-overdue
// @access  Private (Librarian only)
const updateOverdueStatuses = asyncHandler(async (req, res) => {
  const updatedBorrows = await Borrow.updateOverdueStatuses();

  sendSuccess(res, 'Overdue statuses updated successfully', {
    updatedCount: updatedBorrows.length,
    message: `${updatedBorrows.length} borrows marked as overdue`
  });
});

module.exports = {
  borrowBook,
  returnBook,
  getMyBorrows,
  getAllBorrows,
  getBorrowById,
  getActiveBorrowsByBook,
  getBorrowStats,
  getOverdueBorrows,
  extendDueDate,
  getMyOverdueBorrows,
  updateOverdueStatuses
};
