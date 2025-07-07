# Library Management System (MERN Stack)

A comprehensive Library Management System built with the MERN stack (MongoDB, Express.js, React, Node.js) that provides complete functionality for managing books, users, borrowing, and library operations.

## 🚀 Features

### 📚 Book Management
- Complete CRUD operations for books
- ISBN validation and duplicate prevention
- Book availability tracking
- Category-based organization
- Advanced search and filtering
- Cover image support

### 👥 User Management
- Role-based authentication (Borrower/Librarian)
- JWT-based secure authentication
- User profile management
- Password encryption with bcrypt
- User statistics and analytics

### 📖 Borrowing System
- Book borrowing and return functionality
- Borrow history tracking
- Availability validation
- Due date management
- Borrowing statistics

### ⭐ Review System
- Book rating and review system
- Average rating calculations
- Review aggregation and statistics
- Top-rated books tracking

### 📂 Category Management
- Book categorization system
- Category-based book filtering
- Category statistics

### 📧 Contact System
- User inquiry and feedback system
- Message management for librarians
- Contact statistics and analytics

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security middleware
- **cors** - Cross-origin resource sharing
- **morgan** - HTTP request logger

### Frontend
- **React** - Frontend framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Material-UI / Bootstrap** - UI components
- **Context API** - State management

## 📁 Project Structure

```
library-management-system/
├── backend/                 # Backend API
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   ├── .env.example       # Environment variables template
│   ├── server.js          # Main server file
│   └── README.md          # Backend documentation
├── frontend/              # React frontend (to be implemented)
│   ├── public/           # Public assets
│   ├── src/              # Source code
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # Context providers
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
│   └── package.json      # Frontend dependencies
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/v-eenay/mern-library-mgmt-enrichment.git
   cd mern-library-mgmt-enrichment
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Copy environment variables
   cp .env.example .env
   
   # Edit .env file with your configuration
   # Set MONGODB_URI, JWT_SECRET, etc.
   
   # Start the backend server
   npm run dev
   ```

3. **Frontend Setup** (when implemented)
   ```bash
   cd frontend
   npm install
   npm start
   ```

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/library_mgmt

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# CORS Configuration
CLIENT_URL=http://localhost:3000

# Security
BCRYPT_SALT_ROUNDS=12
```

## 📖 API Documentation

The backend provides a comprehensive REST API. For detailed API documentation, see [Backend README](./backend/README.md).

### Quick API Overview

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Books**: `/api/books/*`
- **Borrowing**: `/api/borrows/*`
- **Categories**: `/api/categories/*`
- **Contact**: `/api/contact/*`
- **Reviews**: `/api/reviews/*`

## 🔐 Authentication & Authorization

The system implements role-based access control with two user roles:

- **Borrower**: Can browse books, borrow/return books, write reviews, manage profile
- **Librarian**: Full system access including user management, book management, system statistics

## 🗄️ Database Models

- **User**: User accounts with role-based access
- **Book**: Book information with availability tracking
- **Borrow**: Borrowing records and history
- **Category**: Book categorization
- **ContactMessage**: User inquiries and feedback
- **Review**: Book ratings and reviews

## 🚀 Deployment

### Backend Deployment
The backend can be deployed to platforms like:
- Heroku
- AWS EC2
- DigitalOcean
- Vercel
- Railway

### Database
- MongoDB Atlas (recommended for production)
- Local MongoDB instance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**v-eenay**
- GitHub: [@v-eenay](https://github.com/v-eenay)

## 🙏 Acknowledgments

- Built with the MERN stack
- Inspired by modern library management needs
- Designed for scalability and maintainability

---

For detailed backend API documentation, please refer to the [Backend README](./backend/README.md).
