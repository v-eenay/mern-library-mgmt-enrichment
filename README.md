# 📚 Library Management System

> A modern, secure, and feature-rich library management system built with the MERN stack

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Express.js](https://img.shields.io/badge/Express.js-5.x-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-green.svg)
![JWT](https://img.shields.io/badge/JWT-Authentication-orange.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Key Features

- 🔐 **JWT Authentication** - Secure login with HTTP-only cookies and refresh tokens
- 👥 **Role-Based Access Control** - Borrower, Librarian, and Admin roles with granular permissions
- 📖 **Book Management** - Complete CRUD operations with search, categorization, and cover images
- 📋 **Borrowing System** - Full lifecycle management with due dates, extensions, and history
- ⭐ **Review & Rating System** - User feedback with rating aggregation and statistics
- 🖼️ **Image Upload** - Profile pictures and book covers with security validation
- 🛡️ **Security-First Design** - Rate limiting, input validation, XSS protection, and audit logging
- 📊 **Comprehensive API** - RESTful endpoints with Swagger documentation
## 🛠️ Tech Stack

**Backend:**
- **Node.js** - Runtime environment
- **Express.js** - Web framework with security middleware
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - Authentication with HTTP-only cookies
- **Multer** - File upload handling with Sharp image processing
- **Swagger** - API documentation and testing interface

**Security & Validation:**
- **Helmet.js** - Security headers
- **Express Rate Limit** - API rate limiting
- **Express Validator** - Input validation and sanitization
- **bcryptjs** - Password hashing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB 7.x running locally or MongoDB Atlas

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/v-eenay/mern-library-mgmt-enrichment.git
   cd mern-library-mgmt-enrichment/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secrets
   ```

4. **Start the server**
   ```bash
   # Development mode with hot reload
   npm run dev

   # Production mode
   npm start
   ```

5. **Access the application**
   - API Server: `http://localhost:5000`
   - API Documentation: `http://localhost:5000/api-docs`
   - Health Check: `http://localhost:5000/health`

## 📖 API Documentation

Interactive API documentation is available via Swagger UI at `/api-docs` when the server is running.

**Key Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/books` - Browse books catalog
- `POST /api/books` - Add new book (Librarian+)
- `POST /api/borrows` - Borrow a book
- `GET /api/reviews` - Book reviews and ratings

## 📁 Project Structure

```
backend/
├── config/          # Database, middleware, and Swagger configuration
├── controllers/     # Request handlers and business logic
├── middleware/      # Authentication, validation, and security middleware
├── models/          # MongoDB schemas and data models
├── routes/          # API route definitions
├── services/        # Business logic and external service integrations
├── utils/           # Helper functions, constants, and utilities
├── uploads/         # File upload storage (development)
└── server.js        # Application entry point
```

## 🔧 Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/library-management

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Vinay Koirala**
- Email: koiralavinay@gmail.com
- GitHub: [@v-eenay](https://github.com/v-eenay)
- Issues: [Report bugs or request features](https://github.com/v-eenay/mern-library-mgmt-enrichment/issues)

---

⭐ **Star this repository if you find it helpful!**
