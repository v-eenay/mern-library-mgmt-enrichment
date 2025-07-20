# Library Management System - Backend API

> Express.js REST API with JWT authentication, MongoDB, and comprehensive library management features.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets

# Start development server
npm run dev

# Start production server
npm start
```

## 📖 API Documentation

- **Swagger UI**: `http://localhost:5000/api-docs`
- **Health Check**: `http://localhost:5000/health`

## 🔧 Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/library-management
JWT_SECRET=REPLACE_WITH_YOUR_JWT_SECRET
JWT_REFRESH_SECRET=REPLACE_WITH_YOUR_REFRESH_SECRET
PORT=5000
NODE_ENV=development
```
## 🔗 Key API Endpoints

```
Authentication:
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
POST /api/auth/logout      # User logout

Books:
GET    /api/books          # Get all books
POST   /api/books          # Add book (Librarian)
PUT    /api/books/:id      # Update book (Librarian)
DELETE /api/books/:id      # Delete book (Librarian)

Borrowing:
POST /api/borrows          # Borrow a book
PUT  /api/borrows/:id      # Return a book

Reviews:
GET  /api/reviews          # Get book reviews
POST /api/reviews          # Add review

Users:
GET /api/users             # Get users (Librarian)
PUT /api/users/:id         # Update user profile
```

## 📁 Project Structure

```
backend/
├── config/          # Database & middleware config
├── controllers/     # Request handlers
├── middleware/      # Auth, validation, upload
├── models/          # MongoDB schemas
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Helper functions
├── uploads/         # File storage
└── server.js        # Entry point
```

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication
- **Multer** - File uploads
- **Helmet.js** - Security headers

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.
