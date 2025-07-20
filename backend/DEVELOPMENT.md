# Development Setup Guide

## Quick Start for Local Development

### 1. Environment Setup

Copy the environment template:
```bash
cp .env.example .env
```

### 2. Configure Required Variables

Edit your `.env` file and replace the placeholder values with actual values:

#### Required for Basic Functionality
```env
# Database
MONGODB_URI=mongodb://localhost:27017/library-management

# JWT Secrets (generate secure random strings)
JWT_SECRET=<generate-32-char-random-string>
JWT_REFRESH_SECRET=<generate-different-32-char-random-string>
```

#### Required for Database Seeding
```env
# User Passwords (use secure passwords for development)
ADMIN_PASSWORD=<your-admin-password>
LIBRARIAN_PASSWORD=<your-librarian-password>
BORROWER_PASSWORD=<your-borrower-password>
```

### 3. Generate Secure Secrets

#### For JWT Secrets (Node.js):
```javascript
// Run in Node.js console
require('crypto').randomBytes(32).toString('hex')
```

#### For JWT Secrets (Command Line):
```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
[System.Web.Security.Membership]::GeneratePassword(32, 0)
```

### 4. Development Password Recommendations

For local development, use passwords that are:
- At least 8 characters long
- Include uppercase, lowercase, numbers, and symbols
- Easy to remember for development
- Different from any production passwords

Example pattern (replace with your own):
- Admin: `AdminPass[Year]!`
- Librarian: `LibrarianPass[Year]!`
- Borrower: `BorrowerPass[Year]!`

### 5. Start Development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# In another terminal, seed the database
npm run seed:all-test-data
```

### 6. Test Authentication

```bash
# Test login functionality
npm run test:auth
```

## Development Features

### Database Seeding Commands

```bash
# Individual seeding
npm run seed:admin           # Create admin user
npm run seed:librarian       # Create librarian user
npm run seed:borrowers       # Create test borrower accounts
npm run seed:categories      # Create book categories
npm run seed:books           # Create sample books
npm run seed:reviews         # Create book reviews
npm run seed:borrows         # Create borrow records
npm run seed:contacts        # Create contact messages

# Comprehensive seeding
npm run seed:all             # Basic data (users + categories)
npm run seed:all-test-data   # Complete test environment

# Utility commands
npm run seed:status          # Check current database state
npm run seed:clear           # Clear all data
npm run seed:fix             # Fix user authentication issues
```

### Development URLs

- **API Server**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health
- **Landing Page**: http://localhost:5000 (includes seeding interface)

### Development Credentials

After seeding, you can log in with:
- **Admin**: admin@library.com / [your-admin-password]
- **Librarian**: librarian@library.com / [your-librarian-password]
- **Borrower**: borrower@library.com / [your-borrower-password]

Additional test users (if seeded):
- alice@library.com / [alice-password]
- bob@library.com / [bob-password]
- carol@library.com / [carol-password]
- david@library.com / [david-password]

## Development Best Practices

### Security
- Never commit your `.env` file
- Use different passwords for each environment
- Rotate development passwords regularly
- Don't use production passwords in development

### Database Management
- Use `npm run seed:clear` to reset database
- Use `npm run seed:status` to check current state
- Seed comprehensive test data with `npm run seed:all-test-data`

### Testing
- Run `npm run test:auth` to verify authentication
- Use the landing page interface for interactive seeding
- Check API documentation at `/api-docs` for endpoint testing

## Troubleshooting

### Common Issues

#### "Environment variable is required for seeding"
- Ensure all required password variables are set in `.env`
- Check that there are no extra spaces or quotes around values

#### "JWT_SECRET should be at least 32 characters long"
- Generate a longer secret using the methods above
- Ensure JWT_SECRET and JWT_REFRESH_SECRET are different

#### Database Connection Issues
- Verify MongoDB is running locally
- Check MONGODB_URI in your `.env` file
- Ensure database name doesn't conflict with existing databases

#### Seeding Fails
- Clear database with `npm run seed:clear`
- Verify all required environment variables are set
- Check that passwords meet minimum requirements (8+ characters)

### Getting Help

1. Check this documentation first
2. Review the SECURITY.md file for security-related issues
3. Check application logs for specific error messages
4. Verify environment variable configuration

## File Structure

```
backend/
├── .env.example          # Environment template
├── .env                  # Your local environment (gitignored)
├── SECURITY.md           # Security configuration guide
├── DEVELOPMENT.md        # This file
└── scripts/
    ├── seed.js           # Main seeding script
    ├── test-auth.js      # Authentication testing
    └── fix-seeded-users.js # User fixing utility
```

Remember: This is for development only. Production environments require additional security considerations documented in SECURITY.md.
