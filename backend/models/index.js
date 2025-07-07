// Import all models
const User = require('./User');
const Book = require('./Book');
const Borrow = require('./Borrow');
const Category = require('./Category');
const ContactMessage = require('./ContactMessage');
const Review = require('./Review');

// Export all models
module.exports = {
  User,
  Book,
  Borrow,
  Category,
  ContactMessage,
  Review
};
