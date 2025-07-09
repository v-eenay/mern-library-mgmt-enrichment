const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware to verify JWT token (supports both cookies and Bearer tokens)
const authenticate = async (req, res, next) => {
  try {
    let token;

    // First, try to get token from HTTP-only cookie
    if (req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
    }
    // Fallback to Authorization header for backward compatibility
    else if (req.header('Authorization')) {
      token = req.header('Authorization').replace('Bearer ', '');
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. User not found.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid token.'
    });
  }
};

// Middleware to check if user is librarian
const requireLibrarian = (req, res, next) => {
  if (req.user.role !== 'librarian') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Librarian role required.'
    });
  }
  next();
};

// Middleware to check if user is borrower
const requireBorrower = (req, res, next) => {
  if (req.user.role !== 'borrower') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Borrower role required.'
    });
  }
  next();
};

module.exports = {
  authenticate,
  requireLibrarian,
  requireBorrower
};
