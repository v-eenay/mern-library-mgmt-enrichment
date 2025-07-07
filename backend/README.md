# HRMS Backend API

A comprehensive Human Resource Management System backend built with Express.js and MongoDB.

## Features

- **User Management**: Authentication and authorization for borrowers and librarians
- **Book Management**: Complete CRUD operations for library books
- **Borrowing System**: Track book borrowing and returns
- **Category Management**: Organize books by categories
- **Review System**: Users can rate and review books
- **Contact Messages**: Handle user inquiries and feedback

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
   git clone <repository-url>
   cd hrms-mern/backend
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
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/hrms_db |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `CLIENT_URL` | Frontend URL for CORS | http://localhost:3000 |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds | 12 |

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication (To be implemented)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Books (To be implemented)
- `GET /api/books` - Get all books
- `POST /api/books` - Create new book (librarian only)
- `GET /api/books/:id` - Get book by ID
- `PUT /api/books/:id` - Update book (librarian only)
- `DELETE /api/books/:id` - Delete book (librarian only)

### Borrowing (To be implemented)
- `POST /api/borrows` - Borrow a book
- `GET /api/borrows` - Get user's borrows
- `PUT /api/borrows/:id/return` - Return a book

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
