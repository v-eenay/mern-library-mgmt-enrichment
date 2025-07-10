# Library Management System - Backend API

A comprehensive, production-ready Library Management System backend built with Express.js, MongoDB, and modern security practices. This system provides complete functionality for managing books, users, borrowing operations, and library administration.

## 🚀 Project Overview

The Library Management System backend is a RESTful API that serves as the core engine for a modern library management platform. It supports role-based access control, comprehensive book management, borrowing operations, user reviews, and administrative functions. The system is designed with scalability, security, and maintainability in mind.

### Key Capabilities
- **Multi-role User Management**: Borrowers and Librarians with distinct permissions
- **Comprehensive Book Management**: CRUD operations with advanced search and categorization
- **Borrowing System**: Complete lifecycle management of book loans
- **Review & Rating System**: User feedback and book rating aggregation
- **Image Upload System**: Profile pictures and book cover management
- **Security-First Design**: JWT authentication, rate limiting, and data validation

## 🏗️ Architecture

The backend follows a modular, layered architecture pattern:

```
backend/
├── config/
│   └── database.js              # MongoDB connection configuration
├── controllers/                 # Business logic and request handlers
│   ├── authController.js        # Authentication operations
│   ├── booksController.js       # Book management operations
│   ├── borrowsController.js     # Borrowing system operations
│   ├── categoriesController.js  # Category management
│   ├── contactController.js     # Contact message handling
│   ├── reviewsController.js     # Review and rating operations
│   └── usersController.js       # User management operations
├── middleware/                  # Custom middleware functions
│   ├── auth.js                  # Authentication & authorization
│   ├── upload.js                # File upload handling (Multer)
│   └── uploadRateLimit.js       # Upload-specific rate limiting
├── models/                      # Database schemas and models
│   ├── Book.js                  # Book model with validation
│   ├── Borrow.js                # Borrowing transaction model
│   ├── Category.js              # Book category model
│   ├── ContactMessage.js        # Contact form model
│   ├── Review.js                # Book review and rating model
│   ├── User.js                  # User model with authentication
│   └── index.js                 # Model exports
├── routes/                      # API route definitions
│   ├── auth.js                  # Authentication routes
│   ├── books.js                 # Book management routes
│   ├── borrows.js               # Borrowing system routes
│   ├── categories.js            # Category routes
│   ├── contact.js               # Contact message routes
│   ├── reviews.js               # Review system routes
│   ├── users.js                 # User management routes
│   └── index.js                 # Centralized route exports
├── services/                    # Business logic services
│   ├── authService.js           # Authentication business logic
│   └── validationService.js     # Request validation middleware
├── uploads/                     # File upload storage
│   ├── profiles/                # User profile pictures
│   └── books/                   # Book cover images
├── utils/                       # Utility functions
│   └── helpers.js               # Common helper functions
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies and scripts
├── server.js                    # Application entry point
└── README.md                    # This documentation
```

### Design Patterns
- **MVC Architecture**: Clear separation of concerns
- **Middleware Pattern**: Reusable request processing components
- **Repository Pattern**: Data access abstraction through Mongoose models
- **Service Layer**: Business logic separation from controllers

## ✨ Features

### 🔐 Authentication & Authorization
- **JWT-based Authentication**: Secure token-based authentication
- **Cookie Support**: HTTP-only cookies for enhanced security
- **Role-based Access Control**: Borrower and Librarian roles
- **Password Security**: bcrypt hashing with configurable salt rounds
- **Session Management**: Secure login/logout with token invalidation

### 👥 User Management
- **User Registration**: Email validation and role assignment
- **Profile Management**: Update personal information and profile pictures
- **Password Management**: Secure password change functionality
- **User Statistics**: Analytics for librarian dashboard
- **Profile Pictures**: Image upload with validation and cleanup

### 📚 Book Management
- **CRUD Operations**: Complete book lifecycle management
- **ISBN Validation**: Duplicate prevention and format validation
- **Availability Tracking**: Real-time book availability status
- **Category Organization**: Hierarchical book categorization
- **Advanced Search**: Multi-field search and filtering
- **Cover Images**: Book cover upload and management
- **Bulk Operations**: Efficient batch processing capabilities

### 📖 Borrowing System
- **Borrow Tracking**: Complete borrowing lifecycle management
- **Due Date Management**: Automatic due date calculation
- **Return Processing**: Book return with availability updates
- **Borrowing History**: Complete transaction history
- **Validation Rules**: Prevent duplicate borrows and enforce limits

### ⭐ Review & Rating System
- **Book Reviews**: User feedback and comments
- **Rating Aggregation**: Average rating calculation
- **Review Management**: CRUD operations for reviews
- **Rating Distribution**: Statistical analysis of ratings
- **Duplicate Prevention**: One review per user per book

### 📧 Contact Management
- **Contact Forms**: User inquiry handling
- **Message Management**: Librarian message review system
- **Email Validation**: Secure contact form processing

### 🖼️ Image Upload System
- **Multer Integration**: Professional file upload handling
- **File Validation**: Type, size, and security validation
- **Unique Naming**: UUID-based filename generation
- **Automatic Cleanup**: Old file deletion on updates
- **Rate Limiting**: Upload abuse prevention
- **Static Serving**: Efficient image delivery

## 🔒 Security Features

### Authentication Security
- **JWT Secret Management**: Environment-based secret configuration
- **Token Expiration**: Configurable token lifetime
- **HTTP-only Cookies**: XSS attack prevention
- **CSRF Protection**: SameSite cookie configuration
- **Secure Headers**: Helmet.js security headers

### Data Protection
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Mongoose ODM protection
- **XSS Prevention**: Input sanitization
- **Rate Limiting**: API abuse prevention
- **File Upload Security**: Type and size validation

### Access Control
- **Role-based Permissions**: Granular access control
- **Resource Authorization**: Owner-based access checks
- **API Endpoint Protection**: Authentication middleware
- **Admin Functions**: Librarian-only operations

## 📊 Database Schema

### User Model
```javascript
{
  name: String (required, max: 50),
  email: String (required, unique, validated),
  password: String (required, min: 6, hashed),
  role: String (enum: ['borrower', 'librarian'], default: 'borrower'),
  profilePicture: String (file path),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-generated)
}
```

### Book Model
```javascript
{
  title: String (required, max: 200),
  author: String (required, max: 100),
  isbn: String (required, unique, validated),
  category: String (required),
  description: String (max: 1000),
  quantity: Number (required, min: 1),
  available: Number (required, min: 0),
  coverImage: String (URL or file path),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-generated)
}
```

### Borrow Model
```javascript
{
  userId: ObjectId (required, ref: 'User'),
  bookId: ObjectId (required, ref: 'Book'),
  borrowDate: Date (required, default: now),
  dueDate: Date (required, calculated),
  returnDate: Date (optional),
  status: String (enum: ['active', 'returned'], default: 'active'),
  createdAt: Date (auto-generated)
}
```

### Review Model
```javascript
{
  userId: ObjectId (required, ref: 'User'),
  bookId: ObjectId (required, ref: 'Book'),
  rating: Number (required, min: 1, max: 5),
  comment: String (max: 500),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-generated)
}
```

### Category Model
```javascript
{
  name: String (required, unique, trimmed),
  description: String (max: 200),
  createdAt: Date (auto-generated)
}
```

### ContactMessage Model
```javascript
{
  name: String (required, max: 100),
  email: String (required, validated),
  message: String (required, max: 1000),
  status: String (enum: ['unread', 'read', 'responded'], default: 'unread'),
  createdAt: Date (auto-generated)
}
```

## 🛠️ Setup and Installation

### Prerequisites
- **Node.js**: Version 16.x or higher
- **MongoDB**: Version 4.4 or higher (local or Atlas)
- **npm**: Version 8.x or higher

### Environment Variables
Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/library_management_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# CORS Configuration
CLIENT_URL=http://localhost:3000

# Security
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd library-management-system/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # For local MongoDB
   mongod
   
   # Or ensure MongoDB Atlas connection is configured
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Verify installation**
   ```bash
   curl http://localhost:5000/health
   ```

### Production Deployment
```bash
npm start
```

## 📡 API Endpoints

### Authentication Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| GET | `/api/auth/profile` | Get user profile | Private |
| PUT | `/api/auth/profile` | Update user profile | Private |
| PUT | `/api/auth/change-password` | Change password | Private |
| POST | `/api/auth/logout` | User logout | Private |

### User Management Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/users` | Get all users (paginated) | Librarian |
| GET | `/api/users/:id` | Get user by ID | Librarian |
| POST | `/api/users` | Create new user | Librarian |
| PUT | `/api/users/:id` | Update user | Librarian |
| DELETE | `/api/users/:id` | Delete user | Librarian |
| GET | `/api/users/stats/overview` | User statistics | Librarian |
| POST | `/api/users/upload-profile-picture` | Upload profile picture | Private |
| PUT | `/api/users/update-profile-picture` | Update profile picture | Private |

### Book Management Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/books` | Get all books (paginated, searchable) | Public |
| GET | `/api/books/:id` | Get book by ID with reviews | Public |
| GET | `/api/books/available/list` | Get available books | Public |
| GET | `/api/books/category/:category` | Get books by category | Public |
| POST | `/api/books` | Create new book | Librarian |
| PUT | `/api/books/:id` | Update book | Librarian |
| DELETE | `/api/books/:id` | Delete book | Librarian |
| POST | `/api/books/:id/upload-cover` | Upload book cover | Librarian |
| PUT | `/api/books/:id/update-cover` | Update book cover | Librarian |

### Borrowing System Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/borrows` | Get all borrows (paginated) | Librarian |
| GET | `/api/borrows/user/:userId` | Get user's borrows | Private |
| GET | `/api/borrows/my-borrows` | Get current user's borrows | Private |
| POST | `/api/borrows` | Borrow a book | Private |
| PUT | `/api/borrows/:id/return` | Return a book | Private |
| GET | `/api/borrows/stats/overview` | Borrowing statistics | Librarian |

### Category Management Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/categories` | Get all categories | Public |
| POST | `/api/categories` | Create new category | Librarian |
| PUT | `/api/categories/:id` | Update category | Librarian |
| DELETE | `/api/categories/:id` | Delete category | Librarian |

### Review System Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/reviews` | Get all reviews (paginated) | Librarian |
| GET | `/api/reviews/book/:bookId` | Get reviews for a book | Public |
| GET | `/api/reviews/user/:userId` | Get user's reviews | Private |
| POST | `/api/reviews` | Create new review | Private |
| PUT | `/api/reviews/:id` | Update review | Private |
| DELETE | `/api/reviews/:id` | Delete review | Private |

### Contact Management Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/contact` | Submit contact message | Public |
| GET | `/api/contact` | Get all messages (paginated) | Librarian |
| PUT | `/api/contact/:id` | Update message status | Librarian |
| DELETE | `/api/contact/:id` | Delete message | Librarian |

### File Access Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/uploads/profiles/:filename` | Access profile pictures | Public |
| GET | `/uploads/books/:filename` | Access book cover images | Public |

## 🔧 Rate Limiting

The system implements comprehensive rate limiting to prevent abuse:

### General API Rate Limiting
- **Window**: 15 minutes
- **Limit**: 100 requests per IP
- **Scope**: All API endpoints

### Upload-Specific Rate Limiting
- **Profile Pictures**: 5 uploads per 10 minutes per user
- **Book Covers**: 20 uploads per 5 minutes per librarian
- **Automatic Cleanup**: Failed uploads are automatically cleaned up

## 🧪 Testing

### Manual Testing
```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Automated Testing
```bash
# Run tests (when implemented)
npm test
```

## 🚀 Industry-Ready Enhancements

To transform this system into enterprise-grade software, consider implementing:

### 🔍 Advanced Monitoring & Logging
- **Application Performance Monitoring (APM)**
  - New Relic, DataDog, or Elastic APM integration
  - Real-time performance metrics and alerting
  - Database query optimization tracking
  - Memory and CPU usage monitoring

- **Structured Logging**
  - Winston or Bunyan for structured JSON logging
  - Log aggregation with ELK Stack (Elasticsearch, Logstash, Kibana)
  - Centralized log management with Fluentd
  - Log retention policies and archiving

- **Distributed Tracing**
  - Jaeger or Zipkin for microservices tracing
  - Request correlation across services
  - Performance bottleneck identification

### 🧪 Comprehensive Testing Suite
- **Unit Testing**
  - Jest or Mocha test framework
  - 90%+ code coverage requirement
  - Automated test execution in CI/CD
  - Mock external dependencies

- **Integration Testing**
  - Supertest for API endpoint testing
  - Database integration testing with test containers
  - Third-party service integration testing
  - End-to-end workflow validation

- **Load Testing**
  - Artillery.io or K6 for performance testing
  - Stress testing with realistic data volumes
  - Concurrent user simulation
  - Performance regression testing

- **Security Testing**
  - OWASP ZAP automated security scanning
  - Dependency vulnerability scanning with Snyk
  - Penetration testing protocols
  - Security compliance validation

### 🔄 CI/CD Pipeline
- **Continuous Integration**
  - GitHub Actions, GitLab CI, or Jenkins
  - Automated testing on every commit
  - Code quality gates with SonarQube
  - Automated security scanning

- **Continuous Deployment**
  - Blue-green deployment strategies
  - Canary releases for gradual rollouts
  - Automated rollback mechanisms
  - Environment-specific configurations

- **Infrastructure as Code**
  - Terraform or AWS CloudFormation
  - Docker containerization
  - Kubernetes orchestration
  - Helm charts for deployment management

### ⚡ Performance Optimizations
- **Database Optimization**
  - MongoDB indexing strategies
  - Query optimization and profiling
  - Connection pooling configuration
  - Read replicas for scaling reads

- **Caching Strategies**
  - Redis for session and data caching
  - CDN integration for static assets
  - Application-level caching with memory stores
  - Cache invalidation strategies

- **API Optimization**
  - Response compression with gzip
  - API response pagination optimization
  - GraphQL for efficient data fetching
  - Request/response optimization

### 🛡️ Advanced Security Measures
- **Enhanced Authentication**
  - Multi-factor authentication (MFA)
  - OAuth 2.0 and OpenID Connect integration
  - Single Sign-On (SSO) capabilities
  - Biometric authentication support

- **Data Protection**
  - Field-level encryption for sensitive data
  - Data masking for non-production environments
  - GDPR compliance features
  - Data retention and deletion policies

- **Security Monitoring**
  - Real-time threat detection
  - Anomaly detection algorithms
  - Security incident response automation
  - Compliance reporting and auditing

### 📈 Scalability Improvements
- **Microservices Architecture**
  - Service decomposition strategies
  - API Gateway implementation
  - Service mesh with Istio
  - Event-driven architecture with message queues

- **Horizontal Scaling**
  - Load balancer configuration
  - Auto-scaling policies
  - Database sharding strategies
  - Stateless application design

- **Cloud-Native Features**
  - Kubernetes deployment
  - Serverless function integration
  - Cloud storage for file uploads
  - Managed database services

### 📚 Documentation & API Specifications
- **API Documentation**
  - OpenAPI/Swagger specification
  - Interactive API documentation
  - Postman collection generation
  - API versioning strategies

- **Developer Documentation**
  - Comprehensive setup guides
  - Architecture decision records (ADRs)
  - Code contribution guidelines
  - Troubleshooting guides

### 🚨 Error Tracking & Alerting
- **Error Monitoring**
  - Sentry for error tracking and reporting
  - Real-time error notifications
  - Error trend analysis
  - Performance impact assessment

- **Alerting Systems**
  - PagerDuty or Opsgenie integration
  - Custom alerting rules
  - Escalation procedures
  - Incident management workflows

### 🔧 Operational Excellence
- **Health Checks**
  - Comprehensive health endpoints
  - Dependency health monitoring
  - Graceful shutdown procedures
  - Circuit breaker patterns

- **Configuration Management**
  - External configuration management
  - Feature flags for gradual rollouts
  - Environment-specific configurations
  - Secret management with HashiCorp Vault

### 📊 Analytics & Business Intelligence
- **Usage Analytics**
  - User behavior tracking
  - Feature usage statistics
  - Performance metrics dashboard
  - Business KPI monitoring

- **Data Warehousing**
  - ETL pipelines for data processing
  - Business intelligence reporting
  - Data visualization with Tableau/PowerBI
  - Predictive analytics capabilities

## 🛠️ Tech Stack

### Core Technologies
- **Runtime**: Node.js 16+
- **Framework**: Express.js 5.x
- **Database**: MongoDB 4.4+ with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer middleware
- **Validation**: Express Validator + Mongoose validation

### Security & Middleware
- **Security Headers**: Helmet.js
- **CORS**: Cross-Origin Resource Sharing
- **Rate Limiting**: Express Rate Limit
- **Password Hashing**: bcryptjs
- **Cookie Parsing**: cookie-parser

### Development & Utilities
- **Process Manager**: Nodemon (development)
- **Logging**: Morgan HTTP request logger
- **Environment**: dotenv for configuration
- **Unique IDs**: UUID generation
- **Colors**: Terminal output coloring

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🤝 Contributing

We welcome contributions to improve the Library Management System! Please follow these guidelines:

### Getting Started
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the coding standards
4. Write or update tests for your changes
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add some amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Coding Standards
- Follow existing code style and patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Maintain consistent indentation (2 spaces)
- Follow RESTful API conventions

### Pull Request Process
- Ensure your PR description clearly describes the changes
- Link any relevant issues
- Include screenshots for UI changes
- Ensure CI/CD checks pass
- Request review from maintainers

## 📞 Support

### Getting Help
- **Documentation**: Check this README and inline code comments
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas

### Reporting Issues
When reporting issues, please include:
- Node.js and npm versions
- MongoDB version
- Operating system
- Steps to reproduce the issue
- Expected vs actual behavior
- Error messages and logs

### Feature Requests
We welcome feature requests! Please:
- Check existing issues to avoid duplicates
- Provide clear use cases and benefits
- Consider implementation complexity
- Be open to discussion and feedback

---

**Built with ❤️ for modern library management**

*This system demonstrates production-ready backend development practices including security, scalability, maintainability, and comprehensive documentation.*
