const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

/**
 * Swagger/OpenAPI 3.0 Configuration
 * Comprehensive API documentation for the Library Management System
 */

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Library Management System API',
    version: '1.0.0',
    description: 'Professional Library Management System API with JWT authentication, RBAC, and comprehensive book/user management.',
    contact: {
      name: 'Library Management System API Support',
      email: 'koiralavinay@gmail.com',
      url: 'https://github.com/v-eenay/mern-library-mgmt-enrichment/issues'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server'
    },
    {
      url: 'https://api.library-mgmt.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer token authentication. Include the token in the Authorization header as: Bearer <token>'
      },
      CookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'authToken',
        description: 'HTTP-only cookie authentication (automatically handled by browser)'
      }
    },
    schemas: {
      // Error Response Schema
      ErrorResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['error'],
            example: 'error'
          },
          message: {
            type: 'string',
            description: 'Human-readable error message',
            example: 'Validation failed'
          },
          code: {
            type: 'string',
            description: 'Machine-readable error code',
            example: 'VALIDATION_ERROR'
          },
          errors: {
            type: 'array',
            description: 'Detailed validation errors',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  example: 'email'
                },
                message: {
                  type: 'string',
                  example: 'Please provide a valid email'
                }
              }
            }
          }
        },
        required: ['status', 'message']
      },
      
      // Success Response Schema
      SuccessResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['success'],
            example: 'success'
          },
          message: {
            type: 'string',
            description: 'Human-readable success message',
            example: 'Operation completed successfully'
          },
          data: {
            type: 'object',
            description: 'Response data payload'
          }
        },
        required: ['status', 'message']
      },
      
      // Pagination Schema
      Pagination: {
        type: 'object',
        properties: {
          total: {
            type: 'integer',
            description: 'Total number of items',
            example: 150
          },
          page: {
            type: 'integer',
            description: 'Current page number',
            example: 1
          },
          limit: {
            type: 'integer',
            description: 'Items per page',
            example: 10
          },
          totalPages: {
            type: 'integer',
            description: 'Total number of pages',
            example: 15
          }
        }
      },
      
      // User Schema
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'objectId',
            description: 'Unique user identifier',
            example: '507f1f77bcf86cd799439011'
          },
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            description: 'User full name',
            example: 'John Doe'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john.doe@example.com'
          },
          role: {
            type: 'string',
            enum: ['borrower', 'librarian', 'admin'],
            description: 'User role in the system',
            example: 'borrower'
          },
          profilePicture: {
            type: 'string',
            format: 'uri',
            description: 'URL to user profile picture',
            example: 'http://localhost:5000/uploads/profiles/profile-123.jpg'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
            example: '2023-01-15T10:30:00.000Z'
          }
        },
        required: ['id', 'name', 'email', 'role']
      },
      
      // Book Schema
      Book: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'objectId',
            description: 'Unique book identifier',
            example: '507f1f77bcf86cd799439012'
          },
          title: {
            type: 'string',
            minLength: 1,
            maxLength: 200,
            description: 'Book title',
            example: 'The Great Gatsby'
          },
          author: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Book author',
            example: 'F. Scott Fitzgerald'
          },
          isbn: {
            type: 'string',
            pattern: '^[0-9X-]{10,17}$',
            description: 'International Standard Book Number',
            example: '978-0-7432-7356-5'
          },
          category: {
            type: 'string',
            description: 'Book category',
            example: 'Fiction'
          },
          description: {
            type: 'string',
            maxLength: 1000,
            description: 'Book description',
            example: 'A classic American novel set in the Jazz Age'
          },
          quantity: {
            type: 'integer',
            minimum: 1,
            description: 'Total number of copies',
            example: 5
          },
          available: {
            type: 'integer',
            minimum: 0,
            description: 'Number of available copies',
            example: 3
          },
          coverImage: {
            type: 'string',
            format: 'uri',
            description: 'URL to book cover image',
            example: 'http://localhost:5000/uploads/books/cover-123.jpg'
          },
          averageRating: {
            type: 'number',
            minimum: 0,
            maximum: 5,
            description: 'Average user rating',
            example: 4.2
          },
          reviewCount: {
            type: 'integer',
            minimum: 0,
            description: 'Number of reviews',
            example: 15
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Book creation timestamp',
            example: '2023-01-15T10:30:00.000Z'
          }
        },
        required: ['id', 'title', 'author', 'isbn', 'category', 'quantity', 'available']
      },

      // Borrow Schema
      Borrow: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'objectId',
            description: 'Unique borrow identifier',
            example: '507f1f77bcf86cd799439013'
          },
          userId: {
            type: 'string',
            format: 'objectId',
            description: 'User who borrowed the book',
            example: '507f1f77bcf86cd799439011'
          },
          bookId: {
            type: 'string',
            format: 'objectId',
            description: 'Borrowed book identifier',
            example: '507f1f77bcf86cd799439012'
          },
          borrowDate: {
            type: 'string',
            format: 'date-time',
            description: 'Date when book was borrowed',
            example: '2023-01-15T10:30:00.000Z'
          },
          dueDate: {
            type: 'string',
            format: 'date-time',
            description: 'Due date for book return',
            example: '2023-02-15T10:30:00.000Z'
          },
          returnDate: {
            type: 'string',
            format: 'date-time',
            description: 'Actual return date (null if not returned)',
            example: '2023-02-10T14:20:00.000Z'
          },
          status: {
            type: 'string',
            enum: ['borrowed', 'returned', 'overdue'],
            description: 'Current borrow status',
            example: 'borrowed'
          },
          renewalCount: {
            type: 'integer',
            minimum: 0,
            description: 'Number of times renewed',
            example: 1
          }
        },
        required: ['id', 'userId', 'bookId', 'borrowDate', 'dueDate', 'status']
      },

      // Review Schema
      Review: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'objectId',
            description: 'Unique review identifier',
            example: '507f1f77bcf86cd799439014'
          },
          userId: {
            type: 'string',
            format: 'objectId',
            description: 'User who wrote the review',
            example: '507f1f77bcf86cd799439011'
          },
          bookId: {
            type: 'string',
            format: 'objectId',
            description: 'Reviewed book identifier',
            example: '507f1f77bcf86cd799439012'
          },
          rating: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            description: 'Book rating (1-5 stars)',
            example: 4
          },
          comment: {
            type: 'string',
            maxLength: 1000,
            description: 'Review comment',
            example: 'Great book! Highly recommended.'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Review creation timestamp',
            example: '2023-01-20T14:30:00.000Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Review last update timestamp',
            example: '2023-01-21T09:15:00.000Z'
          }
        },
        required: ['id', 'userId', 'bookId', 'rating']
      },

      // Category Schema
      Category: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'objectId',
            description: 'Unique category identifier',
            example: '507f1f77bcf86cd799439015'
          },
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
            description: 'Category name',
            example: 'Science Fiction'
          },
          description: {
            type: 'string',
            maxLength: 500,
            description: 'Category description',
            example: 'Books featuring futuristic concepts and technology'
          },
          bookCount: {
            type: 'integer',
            minimum: 0,
            description: 'Number of books in this category',
            example: 25
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Category creation timestamp',
            example: '2023-01-10T08:00:00.000Z'
          }
        },
        required: ['id', 'name']
      },

      // Contact Message Schema
      ContactMessage: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'objectId',
            description: 'Unique message identifier',
            example: '507f1f77bcf86cd799439016'
          },
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'Sender name',
            example: 'John Doe'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Sender email address',
            example: 'john.doe@example.com'
          },
          subject: {
            type: 'string',
            minLength: 5,
            maxLength: 200,
            description: 'Message subject',
            example: 'Question about book availability'
          },
          message: {
            type: 'string',
            minLength: 10,
            maxLength: 2000,
            description: 'Message content',
            example: 'I would like to know if you have any books by...'
          },
          status: {
            type: 'string',
            enum: ['pending', 'read', 'responded'],
            description: 'Message status',
            example: 'pending'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Message creation timestamp',
            example: '2023-01-25T16:45:00.000Z'
          }
        },
        required: ['id', 'name', 'email', 'subject', 'message', 'status']
      },

      // Request Schemas
      RegisterRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            description: 'User full name',
            example: 'John Doe'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john.doe@example.com'
          },
          password: {
            type: 'string',
            minLength: 6,
            description: 'User password',
            example: 'securePassword123'
          },
          role: {
            type: 'string',
            enum: ['borrower', 'librarian'],
            description: 'User role (admin role can only be assigned by existing admin)',
            example: 'borrower'
          }
        },
        required: ['name', 'email', 'password']
      },

      LoginRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john.doe@example.com'
          },
          password: {
            type: 'string',
            description: 'User password',
            example: 'securePassword123'
          }
        },
        required: ['email', 'password']
      },

      AuthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['success'],
            example: 'success'
          },
          message: {
            type: 'string',
            example: 'Login successful'
          },
          data: {
            type: 'object',
            properties: {
              user: {
                $ref: '#/components/schemas/User'
              },
              accessToken: {
                type: 'string',
                description: 'JWT access token',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              },
              refreshToken: {
                type: 'string',
                description: 'JWT refresh token',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              }
            }
          }
        },
        required: ['status', 'message', 'data']
      },

      RefreshTokenResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['success'],
            example: 'success'
          },
          message: {
            type: 'string',
            example: 'Token refreshed successfully'
          },
          data: {
            type: 'object',
            properties: {
              accessToken: {
                type: 'string',
                description: 'New JWT access token',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              },
              refreshToken: {
                type: 'string',
                description: 'New JWT refresh token',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              }
            }
          }
        },
        required: ['status', 'message', 'data']
      },

      BorrowRequest: {
        type: 'object',
        properties: {
          bookId: {
            type: 'string',
            format: 'objectId',
            description: 'ID of the book to borrow',
            example: '507f1f77bcf86cd799439012'
          }
        },
        required: ['bookId']
      },

      ReviewRequest: {
        type: 'object',
        properties: {
          bookId: {
            type: 'string',
            format: 'objectId',
            description: 'ID of the book being reviewed',
            example: '507f1f77bcf86cd799439012'
          },
          rating: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            description: 'Book rating (1-5 stars)',
            example: 4
          },
          comment: {
            type: 'string',
            maxLength: 1000,
            description: 'Review comment',
            example: 'Great book! Highly recommended.'
          }
        },
        required: ['bookId', 'rating']
      },

      BookRequest: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            minLength: 1,
            maxLength: 200,
            description: 'Book title',
            example: 'The Great Gatsby'
          },
          author: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Book author',
            example: 'F. Scott Fitzgerald'
          },
          isbn: {
            type: 'string',
            pattern: '^[0-9X-]{10,17}$',
            description: 'International Standard Book Number',
            example: '978-0-7432-7356-5'
          },
          category: {
            type: 'string',
            description: 'Book category',
            example: 'Fiction'
          },
          description: {
            type: 'string',
            maxLength: 1000,
            description: 'Book description',
            example: 'A classic American novel set in the Jazz Age'
          },
          quantity: {
            type: 'integer',
            minimum: 1,
            description: 'Total number of copies',
            example: 5
          }
        },
        required: ['title', 'author', 'isbn', 'category', 'quantity']
      },

      CategoryRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
            description: 'Category name',
            example: 'Science Fiction'
          },
          description: {
            type: 'string',
            maxLength: 500,
            description: 'Category description',
            example: 'Books featuring futuristic concepts and technology'
          }
        },
        required: ['name']
      },

      ContactRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'Sender name',
            example: 'John Doe'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Sender email address',
            example: 'john.doe@example.com'
          },
          subject: {
            type: 'string',
            minLength: 5,
            maxLength: 200,
            description: 'Message subject',
            example: 'Question about book availability'
          },
          message: {
            type: 'string',
            minLength: 10,
            maxLength: 2000,
            description: 'Message content',
            example: 'I would like to know if you have any books by...'
          }
        },
        required: ['name', 'email', 'subject', 'message']
      },

      UpdateProfileRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            description: 'User full name',
            example: 'John Doe'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john.doe@example.com'
          }
        }
      },

      ChangePasswordRequest: {
        type: 'object',
        properties: {
          currentPassword: {
            type: 'string',
            description: 'Current password',
            example: 'currentPassword123'
          },
          newPassword: {
            type: 'string',
            minLength: 6,
            description: 'New password',
            example: 'newSecurePassword123'
          }
        },
        required: ['currentPassword', 'newPassword']
      },

      // Response Schemas
      BooksListResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'success'
          },
          message: {
            type: 'string',
            example: 'Books retrieved successfully'
          },
          data: {
            type: 'object',
            properties: {
              books: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Book'
                }
              },
              pagination: {
                $ref: '#/components/schemas/Pagination'
              }
            }
          }
        },
        required: ['status', 'message', 'data']
      },

      BookResponse: {
        allOf: [
          { $ref: '#/components/schemas/Book' },
          {
            type: 'object',
            properties: {
              reviews: {
                type: 'array',
                description: 'Book reviews (when fetching single book)',
                items: {
                  $ref: '#/components/schemas/Review'
                }
              }
            }
          }
        ]
      }
    },
    
    parameters: {
      // Common path parameters
      IdParam: {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'objectId'
        },
        description: 'Resource unique identifier',
        example: '507f1f77bcf86cd799439011'
      },
      
      // Common query parameters
      PageParam: {
        name: 'page',
        in: 'query',
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1
        },
        description: 'Page number for pagination',
        example: 1
      },
      
      LimitParam: {
        name: 'limit',
        in: 'query',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10
        },
        description: 'Number of items per page',
        example: 10
      },
      
      SearchParam: {
        name: 'search',
        in: 'query',
        schema: {
          type: 'string'
        },
        description: 'Search query string',
        example: 'javascript'
      }
    },
    
    responses: {
      // Common error responses
      BadRequest: {
        description: 'Bad Request - Invalid input data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              status: 'error',
              message: 'Validation failed',
              code: 'VALIDATION_ERROR',
              errors: [
                {
                  field: 'email',
                  message: 'Please provide a valid email'
                }
              ]
            }
          }
        }
      },
      
      Unauthorized: {
        description: 'Unauthorized - Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              status: 'error',
              message: 'Access denied. No token provided.',
              code: 'NO_TOKEN'
            }
          }
        }
      },
      
      Forbidden: {
        description: 'Forbidden - Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              status: 'error',
              message: 'Insufficient permissions',
              code: 'INSUFFICIENT_PERMISSIONS',
              required: ['user:read:all'],
              userRole: 'borrower'
            }
          }
        }
      },
      
      NotFound: {
        description: 'Not Found - Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              status: 'error',
              message: 'Resource not found',
              code: 'NOT_FOUND'
            }
          }
        }
      },
      
      TooManyRequests: {
        description: 'Too Many Requests - Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              status: 'error',
              message: 'Too many requests from this IP, please try again later.',
              retryAfter: '15 minutes'
            }
          }
        }
      },
      
      InternalServerError: {
        description: 'Internal Server Error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              status: 'error',
              message: 'Internal server error',
              code: 'INTERNAL_ERROR'
            }
          }
        }
      }
    }
  },
  
  // Global security requirements
  security: [
    {
      BearerAuth: []
    },
    {
      CookieAuth: []
    }
  ],
  
  // API tags for organization
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    },
    {
      name: 'Users',
      description: 'User management operations (Librarian/Admin only)'
    },
    {
      name: 'Books',
      description: 'Book catalog management and browsing'
    },
    {
      name: 'Borrowing',
      description: 'Book borrowing and return operations'
    },
    {
      name: 'Reviews',
      description: 'Book review and rating system'
    },
    {
      name: 'Categories',
      description: 'Book category management'
    },
    {
      name: 'Contact',
      description: 'Contact form and message management'
    },
    {
      name: 'RBAC',
      description: 'Role-based access control and audit logging'
    },
    {
      name: 'System',
      description: 'System health and monitoring endpoints'
    }
  ]
};

// Swagger JSDoc options
const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './models/*.js'
  ]
};

// Generate swagger specification
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Swagger UI options
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    docExpansion: 'none',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2
  },
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .scheme-container { margin: 20px 0; }
  `,
  customSiteTitle: 'Library Management System API Documentation'
};

module.exports = {
  swaggerSpec,
  swaggerUi,
  swaggerUiOptions
};
