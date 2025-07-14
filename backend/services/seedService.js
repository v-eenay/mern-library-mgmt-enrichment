const { User, Book, Category, Review, Borrow, ContactMessage } = require('../models');
const { sendSuccess, sendError, asyncHandler } = require('../utils/helpers');
const consoleUtils = require('../utils/consoleUtils');

/**
 * Database Seeding Service
 * Provides functionality to seed the database with initial data
 */
class SeedService {
  /**
   * Seed admin user
   * Creates a default admin user for development purposes
   */
  static async seedAdminUser() {
    try {
      // Check if admin already exists
      const existingAdmin = await User.findOne({ role: 'admin' });
      
      if (existingAdmin) {
        return {
          success: false,
          message: 'Admin user already exists',
          data: {
            email: existingAdmin.email,
            existing: true
          }
        };
      }

      // Get admin credentials from environment
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@library.com';
      const adminPassword = process.env.ADMIN_PASSWORD;
      const adminName = process.env.ADMIN_NAME || 'System Administrator';

      // Validate that password is provided via environment variable
      if (!adminPassword) {
        throw new Error('ADMIN_PASSWORD environment variable is required for seeding');
      }

      // Validate password strength
      if (adminPassword.length < 8) {
        throw new Error('Admin password must be at least 8 characters long');
      }

      // Create admin user (password will be automatically hashed by User model pre-save middleware)
      const adminUser = new User({
        name: adminName,
        email: adminEmail,
        password: adminPassword, // Store plain password - will be hashed by pre-save middleware
        role: 'admin',
        isEmailVerified: true, // Admin is pre-verified
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await adminUser.save();

      consoleUtils.logSuccess(`✅ Admin user created successfully: ${adminEmail}`);

      return {
        success: true,
        message: 'Admin user created successfully',
        data: {
          email: adminEmail,
          name: adminName,
          role: 'admin',
          id: adminUser._id,
          created: true
        }
      };

    } catch (error) {
      consoleUtils.logError('❌ Failed to seed admin user:', error);
      throw error;
    }
  }

  /**
   * Seed sample categories
   * Creates default book categories
   */
  static async seedCategories() {
    try {
      const { Category } = require('../models');
      
      const defaultCategories = [
        {
          name: 'Fiction',
          description: 'Fictional literature including novels, short stories, and novellas'
        },
        {
          name: 'Non-Fiction',
          description: 'Factual books including biographies, history, and educational content'
        },
        {
          name: 'Science Fiction',
          description: 'Books featuring futuristic concepts, technology, and space exploration'
        },
        {
          name: 'Mystery',
          description: 'Detective stories, crime novels, and suspenseful narratives'
        },
        {
          name: 'Romance',
          description: 'Love stories and romantic literature'
        },
        {
          name: 'Biography',
          description: 'Life stories of notable individuals'
        },
        {
          name: 'History',
          description: 'Historical accounts and documentation'
        },
        {
          name: 'Technology',
          description: 'Books about technology, programming, and digital innovation'
        }
      ];

      const existingCategories = await Category.find({});
      
      if (existingCategories.length > 0) {
        return {
          success: false,
          message: 'Categories already exist',
          data: {
            count: existingCategories.length,
            existing: true
          }
        };
      }

      const createdCategories = await Category.insertMany(defaultCategories);

      consoleUtils.logSuccess(`✅ Created ${createdCategories.length} default categories`);

      return {
        success: true,
        message: 'Default categories created successfully',
        data: {
          count: createdCategories.length,
          categories: createdCategories.map(cat => ({ name: cat.name, id: cat._id }))
        }
      };

    } catch (error) {
      consoleUtils.logError('❌ Failed to seed categories:', error);
      throw error;
    }
  }

  /**
   * Seed sample librarian user
   * Creates a default librarian user for testing
   */
  static async seedLibrarianUser() {
    try {
      // Check if librarian already exists
      const existingLibrarian = await User.findOne({ 
        role: 'librarian',
        email: process.env.LIBRARIAN_EMAIL || 'librarian@library.com'
      });
      
      if (existingLibrarian) {
        return {
          success: false,
          message: 'Librarian user already exists',
          data: {
            email: existingLibrarian.email,
            existing: true
          }
        };
      }

      // Get librarian credentials from environment
      const librarianEmail = process.env.LIBRARIAN_EMAIL || 'librarian@library.com';
      const librarianPassword = process.env.LIBRARIAN_PASSWORD;
      const librarianName = process.env.LIBRARIAN_NAME || 'Head Librarian';

      // Validate that password is provided via environment variable
      if (!librarianPassword) {
        throw new Error('LIBRARIAN_PASSWORD environment variable is required for seeding');
      }

      // Create librarian user (password will be automatically hashed by User model pre-save middleware)
      const librarianUser = new User({
        name: librarianName,
        email: librarianEmail,
        password: librarianPassword, // Store plain password - will be hashed by pre-save middleware
        role: 'librarian',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await librarianUser.save();

      consoleUtils.logSuccess(`✅ Librarian user created successfully: ${librarianEmail}`);

      return {
        success: true,
        message: 'Librarian user created successfully',
        data: {
          email: librarianEmail,
          name: librarianName,
          role: 'librarian',
          id: librarianUser._id,
          created: true
        }
      };

    } catch (error) {
      consoleUtils.logError('❌ Failed to seed librarian user:', error);
      throw error;
    }
  }

  /**
   * Seed all initial data
   * Runs all seeding operations
   */
  static async seedAll() {
    try {
      consoleUtils.logInfo('🌱 Starting database seeding...');

      const results = {
        admin: null,
        librarian: null,
        categories: null,
        errors: []
      };

      // Seed admin user
      try {
        results.admin = await this.seedAdminUser();
      } catch (error) {
        results.errors.push({ type: 'admin', error: error.message });
      }

      // Seed librarian user
      try {
        results.librarian = await this.seedLibrarianUser();
      } catch (error) {
        results.errors.push({ type: 'librarian', error: error.message });
      }

      // Seed categories
      try {
        results.categories = await this.seedCategories();
      } catch (error) {
        results.errors.push({ type: 'categories', error: error.message });
      }

      const successCount = [results.admin, results.librarian, results.categories]
        .filter(result => result && result.success).length;

      consoleUtils.logSuccess(`✅ Database seeding completed. ${successCount}/3 operations successful.`);

      return {
        success: results.errors.length === 0,
        message: `Database seeding completed. ${successCount}/3 operations successful.`,
        data: results
      };

    } catch (error) {
      consoleUtils.logError('❌ Database seeding failed:', error);
      throw error;
    }
  }

  /**
   * Check if seeding is allowed
   * Only allow seeding in development environment
   */
  static isSeeddingAllowed() {
    const environment = process.env.NODE_ENV || 'development';
    const allowSeeding = process.env.ALLOW_SEEDING === 'true';
    
    return environment === 'development' || allowSeeding;
  }

  /**
   * Validate seeding environment
   * Ensures seeding is safe to perform
   */
  static validateSeedingEnvironment() {
    if (!this.isSeeddingAllowed()) {
      throw new Error('Database seeding is only allowed in development environment');
    }

    // Additional safety checks
    const dbUrl = process.env.MONGODB_URI || '';
    if (dbUrl.includes('production') || dbUrl.includes('prod')) {
      throw new Error('Cannot seed database: Production database detected');
    }
  }

  /**
   * Seed borrower users for testing
   * @returns {Object} Operation result
   */
  static async seedBorrowerUsers() {
    try {
      // Validate environment
      this.validateSeedingEnvironment();

      // Check if borrowers already exist
      const existingBorrowers = await User.find({ role: 'borrower' });
      if (existingBorrowers.length > 0) {
        return {
          success: false,
          message: `${existingBorrowers.length} borrower user(s) already exist`,
          data: null
        };
      }

      // Get borrower credentials from environment
      const borrowerEmail = process.env.BORROWER_EMAIL || 'borrower@library.com';
      const borrowerPassword = process.env.BORROWER_PASSWORD;
      const borrowerName = process.env.BORROWER_NAME || 'Test Borrower';

      // Validate that password is provided via environment variable
      if (!borrowerPassword) {
        throw new Error('BORROWER_PASSWORD environment variable is required for seeding');
      }

      // Get additional borrower passwords from environment or use secure defaults
      const alicePassword = process.env.ALICE_PASSWORD || borrowerPassword;
      const bobPassword = process.env.BOB_PASSWORD || borrowerPassword;
      const carolPassword = process.env.CAROL_PASSWORD || borrowerPassword;
      const davidPassword = process.env.DAVID_PASSWORD || borrowerPassword;

      // Create multiple test borrower users
      const borrowers = [
        {
          name: borrowerName,
          email: borrowerEmail,
          password: borrowerPassword,
          role: 'borrower',
          isEmailVerified: true
        },
        {
          name: 'Alice Johnson',
          email: 'alice@library.com',
          password: alicePassword,
          role: 'borrower',
          isEmailVerified: true
        },
        {
          name: 'Bob Smith',
          email: 'bob@library.com',
          password: bobPassword,
          role: 'borrower',
          isEmailVerified: true
        },
        {
          name: 'Carol Davis',
          email: 'carol@library.com',
          password: carolPassword,
          role: 'borrower',
          isEmailVerified: true
        },
        {
          name: 'David Wilson',
          email: 'david@library.com',
          password: davidPassword,
          role: 'borrower',
          isEmailVerified: true
        }
      ];

      const createdBorrowers = [];
      for (const borrowerData of borrowers) {
        const borrower = new User(borrowerData);
        await borrower.save();
        createdBorrowers.push(borrower);
      }

      consoleUtils.logSuccess(`✅ ${createdBorrowers.length} borrower users created successfully`);

      return {
        success: true,
        message: `${createdBorrowers.length} borrower users created successfully`,
        data: createdBorrowers.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }))
      };

    } catch (error) {
      consoleUtils.logError('❌ Failed to seed borrower users:', error);
      return {
        success: false,
        message: `Failed to seed borrower users: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * Seed comprehensive book data for testing
   * @returns {Object} Operation result
   */
  static async seedBooks() {
    try {
      // Validate environment
      this.validateSeedingEnvironment();

      // Check if books already exist
      const existingBooks = await Book.find({});
      if (existingBooks.length > 0) {
        return {
          success: false,
          message: `${existingBooks.length} book(s) already exist`,
          data: null
        };
      }

      // Ensure categories exist first
      const categories = await Category.find({});
      if (categories.length === 0) {
        await this.seedCategories();
      }

      // Comprehensive book data
      const books = [
        // Fiction
        {
          title: "To Kill a Mockingbird",
          author: "Harper Lee",
          isbn: "978-0-06-112008-4",
          category: "Fiction",
          description: "A gripping tale of racial injustice and childhood innocence in the American South.",
          quantity: 5,
          available: 5
        },
        {
          title: "1984",
          author: "George Orwell",
          isbn: "978-0-452-28423-4",
          category: "Fiction",
          description: "A dystopian social science fiction novel about totalitarian control.",
          quantity: 8,
          available: 6
        },
        {
          title: "Pride and Prejudice",
          author: "Jane Austen",
          isbn: "978-0-14-143951-8",
          category: "Fiction",
          description: "A romantic novel of manners set in Georgian England.",
          quantity: 4,
          available: 3
        },
        {
          title: "The Great Gatsby",
          author: "F. Scott Fitzgerald",
          isbn: "978-0-7432-7356-5",
          category: "Fiction",
          description: "A classic American novel set in the Jazz Age.",
          quantity: 6,
          available: 4
        },
        {
          title: "Harry Potter and the Philosopher's Stone",
          author: "J.K. Rowling",
          isbn: "978-0-7475-3269-9",
          category: "Fiction",
          description: "The first book in the magical Harry Potter series.",
          quantity: 10,
          available: 8
        },
        // Non-Fiction
        {
          title: "Sapiens: A Brief History of Humankind",
          author: "Yuval Noah Harari",
          isbn: "978-0-06-231609-7",
          category: "Non-Fiction",
          description: "An exploration of how Homo sapiens came to dominate the world.",
          quantity: 7,
          available: 5
        },
        {
          title: "Educated",
          author: "Tara Westover",
          isbn: "978-0-399-59050-4",
          category: "Non-Fiction",
          description: "A memoir about education, family, and the struggle for self-invention.",
          quantity: 5,
          available: 4
        },
        {
          title: "The Immortal Life of Henrietta Lacks",
          author: "Rebecca Skloot",
          isbn: "978-1-4000-5217-2",
          category: "Non-Fiction",
          description: "The story of how one woman's cells changed medical science forever.",
          quantity: 4,
          available: 3
        },
        // Science
        {
          title: "A Brief History of Time",
          author: "Stephen Hawking",
          isbn: "978-0-553-38016-3",
          category: "Science",
          description: "A landmark volume in science writing by one of the great minds of our time.",
          quantity: 6,
          available: 5
        },
        {
          title: "The Selfish Gene",
          author: "Richard Dawkins",
          isbn: "978-0-19-929114-4",
          category: "Science",
          description: "A book on evolution which popularized the gene-centred view of evolution.",
          quantity: 4,
          available: 3
        },
        {
          title: "Cosmos",
          author: "Carl Sagan",
          isbn: "978-0-345-33135-9",
          category: "Science",
          description: "A popular science book that covers a wide range of scientific subjects.",
          quantity: 5,
          available: 4
        },
        // Technology
        {
          title: "Clean Code",
          author: "Robert C. Martin",
          isbn: "978-0-13-235088-4",
          category: "Technology",
          description: "A handbook of agile software craftsmanship.",
          quantity: 8,
          available: 6
        },
        {
          title: "The Pragmatic Programmer",
          author: "David Thomas and Andrew Hunt",
          isbn: "978-0-201-61622-4",
          category: "Technology",
          description: "Your journey to mastery in software development.",
          quantity: 6,
          available: 5
        },
        {
          title: "Design Patterns",
          author: "Gang of Four",
          isbn: "978-0-201-63361-0",
          category: "Technology",
          description: "Elements of reusable object-oriented software.",
          quantity: 4,
          available: 3
        },
        // History
        {
          title: "The Guns of August",
          author: "Barbara Tuchman",
          isbn: "978-0-345-47609-8",
          category: "History",
          description: "A detailed account of the first month of World War I.",
          quantity: 3,
          available: 2
        },
        {
          title: "A People's History of the United States",
          author: "Howard Zinn",
          isbn: "978-0-06-083865-2",
          category: "History",
          description: "American history from the perspective of ordinary people.",
          quantity: 5,
          available: 4
        }
      ];

      const createdBooks = [];
      for (const bookData of books) {
        const book = new Book(bookData);
        await book.save();
        createdBooks.push(book);
      }

      consoleUtils.logSuccess(`✅ ${createdBooks.length} books created successfully`);

      return {
        success: true,
        message: `${createdBooks.length} books created successfully`,
        data: createdBooks.map(book => ({
          id: book._id,
          title: book.title,
          author: book.author,
          category: book.category,
          quantity: book.quantity,
          available: book.available
        }))
      };

    } catch (error) {
      consoleUtils.logError('❌ Failed to seed books:', error);
      return {
        success: false,
        message: `Failed to seed books: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * Seed sample reviews for testing
   * @returns {Object} Operation result
   */
  static async seedReviews() {
    try {
      // Validate environment
      this.validateSeedingEnvironment();

      // Check if reviews already exist
      const existingReviews = await Review.find({});
      if (existingReviews.length > 0) {
        return {
          success: false,
          message: `${existingReviews.length} review(s) already exist`,
          data: null
        };
      }

      // Get users, books, and existing borrows for reviews
      const users = await User.find({ role: 'borrower' });
      const books = await Book.find({});
      const borrows = await Borrow.find({ status: { $in: ['returned', 'overdue'] } }).populate('userId bookId');

      if (users.length === 0 || books.length === 0 || borrows.length === 0) {
        return {
          success: false,
          message: 'Need users, books, and borrow records to create reviews',
          data: null
        };
      }

      // Create reviews only for books that have been borrowed
      const reviewsData = [];

      // Add reviews for returned/overdue books
      for (let i = 0; i < Math.min(borrows.length, 8); i++) {
        const borrow = borrows[i];
        const ratings = [5, 4, 5, 4, 4, 5, 5, 4];
        const comments = [
          "Absolutely brilliant! A timeless classic that everyone should read.",
          "Great book with powerful themes. Highly recommended.",
          "Orwell's masterpiece. Chilling and relevant even today.",
          "A thought-provoking dystopian novel. Well written.",
          "Jane Austen at her finest. Witty and romantic.",
          "The Great Gatsby captures the essence of the American Dream perfectly.",
          "Magical! Started my love for the Harry Potter series.",
          "Fascinating insights into human history and evolution."
        ];

        reviewsData.push({
          userId: borrow.userId._id,
          bookId: borrow.bookId._id,
          rating: ratings[i] || 4,
          comment: comments[i] || "Great book! Really enjoyed reading it."
        });
      }

      const createdReviews = [];
      for (const reviewData of reviewsData) {
        const review = new Review(reviewData);
        await review.save();
        createdReviews.push(review);
      }

      consoleUtils.logSuccess(`✅ ${createdReviews.length} reviews created successfully`);

      return {
        success: true,
        message: `${createdReviews.length} reviews created successfully`,
        data: createdReviews.map(review => ({
          id: review._id,
          rating: review.rating,
          comment: review.comment
        }))
      };

    } catch (error) {
      consoleUtils.logError('❌ Failed to seed reviews:', error);
      return {
        success: false,
        message: `Failed to seed reviews: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * Seed sample borrow records for testing
   * @returns {Object} Operation result
   */
  static async seedBorrows() {
    try {
      // Validate environment
      this.validateSeedingEnvironment();

      // Check if borrows already exist
      const existingBorrows = await Borrow.find({});
      if (existingBorrows.length > 0) {
        return {
          success: false,
          message: `${existingBorrows.length} borrow record(s) already exist`,
          data: null
        };
      }

      // Get users and books for borrows
      const users = await User.find({ role: 'borrower' });
      const books = await Book.find({});

      if (users.length === 0 || books.length === 0) {
        return {
          success: false,
          message: 'Need users and books to create borrow records',
          data: null
        };
      }

      // Calculate dates
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      // Sample borrow data with various statuses
      const borrowsData = [
        // Active borrows
        {
          userId: users[0]._id,
          bookId: books[0]._id,
          borrowDate: oneWeekAgo,
          dueDate: oneWeekFromNow,
          status: 'active'
        },
        {
          userId: users[1]._id,
          bookId: books[1]._id,
          borrowDate: oneWeekAgo,
          dueDate: oneWeekFromNow,
          status: 'active'
        },
        {
          userId: users[2]._id,
          bookId: books[2]._id,
          borrowDate: twoWeeksAgo,
          dueDate: now,
          status: 'active'
        },
        // Overdue borrows
        {
          userId: users[3]._id,
          bookId: books[3]._id,
          borrowDate: oneMonthAgo,
          dueDate: twoWeeksAgo,
          status: 'overdue'
        },
        {
          userId: users[0]._id,
          bookId: books[4]._id,
          borrowDate: oneMonthAgo,
          dueDate: twoWeeksAgo,
          status: 'overdue'
        },
        // Returned borrows
        {
          userId: users[1]._id,
          bookId: books[5]._id,
          borrowDate: oneMonthAgo,
          dueDate: twoWeeksAgo,
          returnDate: oneWeekAgo,
          status: 'returned'
        },
        {
          userId: users[2]._id,
          bookId: books[6]._id,
          borrowDate: oneMonthAgo,
          dueDate: twoWeeksAgo,
          returnDate: twoWeeksAgo,
          status: 'returned'
        },
        {
          userId: users[3]._id,
          bookId: books[7]._id,
          borrowDate: twoWeeksAgo,
          dueDate: now,
          returnDate: oneWeekAgo,
          status: 'returned'
        }
      ];

      const createdBorrows = [];
      for (const borrowData of borrowsData) {
        const borrow = new Borrow(borrowData);
        await borrow.save();
        createdBorrows.push(borrow);

        // Update book availability for active/overdue borrows
        if (borrow.status === 'active' || borrow.status === 'overdue') {
          await Book.findByIdAndUpdate(
            borrow.bookId,
            { $inc: { available: -1 } }
          );
        }
      }

      consoleUtils.logSuccess(`✅ ${createdBorrows.length} borrow records created successfully`);

      return {
        success: true,
        message: `${createdBorrows.length} borrow records created successfully`,
        data: createdBorrows.map(borrow => ({
          id: borrow._id,
          status: borrow.status,
          borrowDate: borrow.borrowDate,
          dueDate: borrow.dueDate,
          returnDate: borrow.returnDate
        }))
      };

    } catch (error) {
      consoleUtils.logError('❌ Failed to seed borrow records:', error);
      return {
        success: false,
        message: `Failed to seed borrow records: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * Seed sample contact messages for testing
   * @returns {Object} Operation result
   */
  static async seedContactMessages() {
    try {
      // Validate environment
      this.validateSeedingEnvironment();

      // Check if contact messages already exist
      const existingMessages = await ContactMessage.find({});
      if (existingMessages.length > 0) {
        return {
          success: false,
          message: `${existingMessages.length} contact message(s) already exist`,
          data: null
        };
      }

      // Sample contact messages with correct status values
      const messagesData = [
        {
          name: "John Smith",
          email: "john.smith@email.com",
          subject: "Book Request",
          message: "Could you please add more books on artificial intelligence and machine learning?",
          category: "book_request",
          status: "unread",
          priority: "medium"
        },
        {
          name: "Sarah Johnson",
          email: "sarah.j@email.com",
          subject: "Website Issue",
          message: "I'm having trouble logging into my account. The password reset doesn't seem to work.",
          category: "technical_support",
          status: "in_progress",
          priority: "high"
        },
        {
          name: "Mike Davis",
          email: "mike.davis@email.com",
          subject: "Library Hours",
          message: "What are the current library hours? The website shows conflicting information.",
          category: "general_inquiry",
          status: "resolved",
          priority: "low",
          resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        },
        {
          name: "Emily Wilson",
          email: "emily.w@email.com",
          subject: "Overdue Book Fine",
          message: "I returned my book on time but still received an overdue notice. Please check.",
          category: "complaint",
          status: "read",
          priority: "medium"
        },
        {
          name: "David Brown",
          email: "david.brown@email.com",
          subject: "Digital Library Access",
          message: "It would be great to have access to e-books and digital resources.",
          category: "suggestion",
          status: "unread",
          priority: "low"
        },
        {
          name: "Lisa Anderson",
          email: "lisa.anderson@email.com",
          subject: "Study Room Booking",
          message: "How can I book a study room? Is there an online system available?",
          category: "general_inquiry",
          status: "resolved",
          priority: "medium",
          resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        }
      ];

      const createdMessages = [];
      for (const messageData of messagesData) {
        const message = new ContactMessage(messageData);
        await message.save();
        createdMessages.push(message);
      }

      consoleUtils.logSuccess(`✅ ${createdMessages.length} contact messages created successfully`);

      return {
        success: true,
        message: `${createdMessages.length} contact messages created successfully`,
        data: createdMessages.map(msg => ({
          id: msg._id,
          subject: msg.subject,
          category: msg.category,
          status: msg.status,
          priority: msg.priority
        }))
      };

    } catch (error) {
      consoleUtils.logError('❌ Failed to seed contact messages:', error);
      return {
        success: false,
        message: `Failed to seed contact messages: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * Seed all test data (comprehensive seeding)
   * @returns {Object} Operation result
   */
  static async seedAllTestData() {
    try {
      consoleUtils.logInfo('🌱 Starting comprehensive test data seeding...');

      const results = {
        admin: null,
        librarian: null,
        borrowers: null,
        categories: null,
        books: null,
        reviews: null,
        borrows: null,
        contactMessages: null
      };

      // Seed in order (dependencies first)
      results.admin = await this.seedAdminUser();
      results.librarian = await this.seedLibrarianUser();
      results.borrowers = await this.seedBorrowerUsers();
      results.categories = await this.seedCategories();
      results.books = await this.seedBooks();
      results.borrows = await this.seedBorrows();
      results.reviews = await this.seedReviews(); // After borrows so users have borrowed books
      results.contactMessages = await this.seedContactMessages();

      // Count successful operations
      const successCount = Object.values(results).filter(r => r && r.success).length;
      const totalOperations = Object.keys(results).length;

      consoleUtils.logSuccess(`✅ Comprehensive seeding completed: ${successCount}/${totalOperations} operations successful`);

      return {
        success: successCount === totalOperations,
        message: `Comprehensive seeding completed: ${successCount}/${totalOperations} operations successful`,
        data: results
      };

    } catch (error) {
      consoleUtils.logError('❌ Failed to seed all test data:', error);
      return {
        success: false,
        message: `Failed to seed all test data: ${error.message}`,
        data: null
      };
    }
  }
}

module.exports = SeedService;
