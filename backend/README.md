# Library Management System Backend API

A comprehensive Library Management System backend built with Express.js and MongoDB.

## Features

- **User Management**: Authentication and authorization for borrowers and librarians
- **Book Management**: Complete CRUD operations for library books with availability tracking
- **Borrowing System**: Track book borrowing and returns with validation
- **Category Management**: Organize books by categories with statistics
- **Review System**: Users can rate and review books with aggregation
- **Contact Messages**: Handle user inquiries and feedback with management tools

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting
- **Password Hashing**: bcryptjs
- **Validation**: Mongoose built-in validation + express-validator
- **Logging**: Morgan

## Project Structure

```
backend/
├── config/
│   └── database.js          # Database connection configuration
├── controllers/             # Route controllers (to be added)
├── middleware/
│   └── auth.js              # Authentication middleware
├── models/
│   ├── User.js              # User model
│   ├── Book.js              # Book model
│   ├── Borrow.js            # Borrow model
│   ├── Category.js          # Category model
│   ├── ContactMessage.js    # Contact message model
│   ├── Review.js            # Review model
│   └── index.js             # Models export
├── routes/                  # API routes (to be added)
├── utils/
│   └── helpers.js           # Utility functions
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies and scripts
├── server.js                # Main application file
└── README.md                # This file
```

## Models

### User Model
- **Fields**: name, email, password, role, createdAt
- **Roles**: borrower (default), librarian
- **Features**: Password hashing, email validation, role-based access

### Book Model
- **Fields**: title, author, isbn, category, description, quantity, available, coverImage, createdAt
- **Features**: ISBN validation, availability tracking, category organization

### Borrow Model
- **Fields**: userId, bookId, borrowDate, returnDate, createdAt
- **Features**: Relationship tracking, return date validation, active borrow prevention

### Category Model
- **Fields**: name, createdAt
- **Features**: Unique category names, title case normalization

### ContactMessage Model
- **Fields**: name, email, message, createdAt
- **Features**: Email validation, message length requirements

### Review Model
- **Fields**: userId, bookId, rating, comment, createdAt
- **Features**: Rating validation (1-5), user-book relationship, duplicate prevention

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/v-eenay/mern-library-mgmt-enrichment.git
   cd mern-library-mgmt-enrichment/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT tokens
   - `PORT`: Server port (default: 5000)

4. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/library_mgmt |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `CLIENT_URL` | Frontend URL for CORS | http://localhost:3000 |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds | 12 |

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication Routes (`/api/auth`)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile (Protected)
- `PUT /api/auth/profile` - Update user profile (Protected)
- `PUT /api/auth/change-password` - Change password (Protected)

### User Management Routes (`/api/users`) - Librarian Only
- `GET /api/users` - Get all users with pagination and search
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/stats/overview` - Get user statistics

### Book Management Routes (`/api/books`)
- `GET /api/books` - Get all books with search and filtering (Public)
- `GET /api/books/:id` - Get book by ID with reviews (Public)
- `POST /api/books` - Create new book (Librarian only)
- `PUT /api/books/:id` - Update book (Librarian only)
- `DELETE /api/books/:id` - Delete book (Librarian only)
- `GET /api/books/available/list` - Get available books (Public)
- `GET /api/books/category/:category` - Get books by category (Public)

### Borrowing Routes (`/api/borrows`)
- `POST /api/borrows` - Borrow a book (Protected)
- `PUT /api/borrows/:id/return` - Return a book (Protected)
- `GET /api/borrows/my-borrows` - Get user's borrow history (Protected)
- `GET /api/borrows` - Get all borrows (Librarian only)
- `GET /api/borrows/:id` - Get borrow by ID (Protected)
- `GET /api/borrows/book/:bookId/active` - Get active borrows for book (Librarian only)
- `GET /api/borrows/stats/overview` - Get borrowing statistics (Librarian only)

### Category Routes (`/api/categories`)
- `GET /api/categories` - Get all categories (Public)
- `GET /api/categories/:id` - Get category by ID (Public)
- `POST /api/categories` - Create category (Librarian only)
- `PUT /api/categories/:id` - Update category (Librarian only)
- `DELETE /api/categories/:id` - Delete category (Librarian only)
- `GET /api/categories/:id/books` - Get books in category (Public)
- `GET /api/categories/stats/overview` - Get category statistics (Librarian only)

### Contact Routes (`/api/contact`)
- `POST /api/contact` - Submit contact message (Public)
- `GET /api/contact` - Get all messages (Librarian only)
- `GET /api/contact/:id` - Get message by ID (Librarian only)
- `DELETE /api/contact/:id` - Delete message (Librarian only)
- `GET /api/contact/email/:email` - Get messages by email (Librarian only)
- `GET /api/contact/recent/:days` - Get recent messages (Librarian only)
- `GET /api/contact/search/:term` - Search messages (Librarian only)
- `GET /api/contact/stats/overview` - Get contact statistics (Librarian only)

### Review Routes (`/api/reviews`)
- `POST /api/reviews` - Create book review (Protected)
- `GET /api/reviews/book/:bookId` - Get reviews for book (Public)
- `GET /api/reviews/my-reviews` - Get user's reviews (Protected)
- `GET /api/reviews/:id` - Get review by ID (Public)
- `PUT /api/reviews/:id` - Update review (Protected)
- `DELETE /api/reviews/:id` - Delete review (Protected)
- `GET /api/reviews` - Get all reviews (Librarian only)
- `GET /api/reviews/recent/list` - Get recent reviews (Public)
- `GET /api/reviews/top-rated/books` - Get top-rated books (Public)

## API Request/Response Examples

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "borrower"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6789012345",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "borrower"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6789012345",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "borrower"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Books

#### Get All Books
```http
GET /api/books?page=0&limit=10&search=javascript&category=programming&available=true&sortBy=title&sortOrder=asc
```

**Response:**
```json
{
  "status": "success",
  "message": "Books retrieved successfully",
  "data": {
    "books": [
      {
        "_id": "64a1b2c3d4e5f6789012345",
        "title": "JavaScript: The Good Parts",
        "author": "Douglas Crockford",
        "isbn": "978-0596517748",
        "category": "Programming",
        "description": "A comprehensive guide to JavaScript",
        "quantity": 5,
        "available": 3,
        "coverImage": "https://example.com/cover.jpg",
        "createdAt": "2023-07-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 0,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

#### Create Book (Librarian Only)
```http
POST /api/books
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "isbn": "978-0132350884",
  "category": "Programming",
  "description": "A handbook of agile software craftsmanship",
  "quantity": 3,
  "coverImage": "https://example.com/clean-code.jpg"
}
```

### Borrowing

#### Borrow a Book
```http
POST /api/borrows
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "bookId": "64a1b2c3d4e5f6789012345"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Book borrowed successfully",
  "data": {
    "borrow": {
      "_id": "64a1b2c3d4e5f6789012346",
      "userId": "64a1b2c3d4e5f6789012347",
      "bookId": {
        "_id": "64a1b2c3d4e5f6789012345",
        "title": "JavaScript: The Good Parts",
        "author": "Douglas Crockford",
        "isbn": "978-0596517748"
      },
      "borrowDate": "2023-07-01T10:00:00.000Z",
      "returnDate": null,
      "createdAt": "2023-07-01T10:00:00.000Z"
    }
  }
}
```

#### Return a Book
```http
PUT /api/borrows/64a1b2c3d4e5f6789012346/return
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Reviews

#### Create Review
```http
POST /api/reviews
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "bookId": "64a1b2c3d4e5f6789012345",
  "rating": 5,
  "comment": "Excellent book for learning JavaScript fundamentals!"
}
```

#### Get Book Reviews
```http
GET /api/reviews/book/64a1b2c3d4e5f6789012345?page=0&limit=10&sortBy=createdAt&sortOrder=desc
```

**Response:**
```json
{
  "status": "success",
  "message": "Book reviews retrieved successfully",
  "data": {
    "bookId": "64a1b2c3d4e5f6789012345",
    "bookTitle": "JavaScript: The Good Parts",
    "reviews": [
      {
        "_id": "64a1b2c3d4e5f6789012348",
        "userId": {
          "_id": "64a1b2c3d4e5f6789012347",
          "name": "John Doe"
        },
        "rating": 5,
        "comment": "Excellent book for learning JavaScript fundamentals!",
        "createdAt": "2023-07-01T10:00:00.000Z"
      }
    ],
    "reviewStats": {
      "averageRating": 4.5,
      "totalReviews": 10,
      "ratingDistribution": {
        "1": 0,
        "2": 1,
        "3": 2,
        "4": 3,
        "5": 4
      }
    },
    "pagination": {
      "total": 10,
      "page": 0,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

## Error Responses

All API endpoints return consistent error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "errors": ["Detailed error messages"] // Optional, for validation errors
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Prevent abuse
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Mongoose validation + sanitization

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Database Indexes
All models include optimized indexes for:
- Unique constraints (email, ISBN, etc.)
- Frequently queried fields
- Compound indexes for complex queries
- Performance optimization

## Contributing

1. Follow the existing code structure
2. Add proper validation and error handling
3. Include appropriate indexes for new fields
4. Update documentation for new features
5. Test thoroughly before committing

## License

ISC
