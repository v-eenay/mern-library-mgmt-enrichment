# Database Seeding Guide

This guide explains how to seed the Library Management System database with initial data for development and testing purposes.

## Overview

The seeding system provides a safe and convenient way to populate your database with essential initial data including:

- **Admin User**: System administrator with full permissions
- **Librarian User**: Library staff with management permissions  
- **Default Categories**: Standard book categories (Fiction, Non-Fiction, etc.)

## Security Features

- ✅ **Environment Protection**: Only works in development environment
- ✅ **Production Safety**: Automatically disabled in production
- ✅ **Rate Limiting**: API endpoints are rate-limited (5 requests/hour)
- ✅ **Idempotent Operations**: Safe to run multiple times
- ✅ **Secure Passwords**: Uses bcrypt with 12 salt rounds

## Command Line Usage

### Available Commands

```bash
# Check seeding status
npm run seed:status

# Individual seeding commands
npm run seed:admin           # Seed admin user
npm run seed:librarian       # Seed librarian user
npm run seed:borrowers       # Seed borrower users (5 test accounts)
npm run seed:categories      # Seed default categories
npm run seed:books           # Seed sample books (15+ books)
npm run seed:reviews         # Seed sample reviews
npm run seed:borrows         # Seed sample borrow records
npm run seed:contacts        # Seed sample contact messages

# Comprehensive seeding commands
npm run seed:all             # Seed basic initial data (users + categories)
npm run seed:all-test-data   # Seed comprehensive test data (everything)

# Utility commands
npm run seed:fix             # Fix seeded users (if login issues occur)
npm run seed:clear           # Clear all database collections
npm run test:auth            # Test authentication with seeded credentials

# Show help
npm run seed help
```

### Examples

```bash
# Check what data exists
npm run seed:status

# Seed everything at once
npm run seed:all

# Seed just the admin user
npm run seed:admin
```

## API Endpoints

### Base URL: `/api/seed`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/status` | Check seeding status |
| POST | `/admin` | Seed admin user |
| POST | `/librarian` | Seed librarian user |
| POST | `/categories` | Seed default categories |
| POST | `/all` | Seed all initial data |
| DELETE | `/reset` | Reset database (DANGER) |

### Example API Usage

```bash
# Check status
curl http://localhost:5000/api/seed/status

# Seed admin user
curl -X POST http://localhost:5000/api/seed/admin

# Seed all data
curl -X POST http://localhost:5000/api/seed/all
```

## Environment Configuration

Configure seeding credentials in your `.env` file:

```env
# Admin User Configuration
ADMIN_EMAIL=admin@library.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=System Administrator

# Librarian User Configuration
LIBRARIAN_EMAIL=librarian@library.com
LIBRARIAN_PASSWORD=librarian123
LIBRARIAN_NAME=Head Librarian

# Borrower User Configuration
BORROWER_EMAIL=borrower@library.com
BORROWER_PASSWORD=borrower123
BORROWER_NAME=Test Borrower

# Safety Controls
ALLOW_SEEDING=true  # Set to false in production environments
```

⚠️ **DEVELOPMENT PASSWORDS**: These are simple passwords for development/testing convenience. **Change these in production environments!**

## Default Seeded Data

### Admin User
- **Email**: admin@library.com (configurable)
- **Password**: admin123 (development default)
- **Role**: admin
- **Permissions**: Full system access

### Librarian User
- **Email**: librarian@library.com (configurable)
- **Password**: librarian123 (development default)
- **Role**: librarian
- **Permissions**: Book and user management

### Borrower Users (5 test accounts)
- **Primary**: borrower@library.com / borrower123
- **Alice Johnson**: alice@library.com / alice123
- **Bob Smith**: bob@library.com / bob123
- **Carol Davis**: carol@library.com / carol123
- **David Wilson**: david@library.com / david123
- **Role**: borrower
- **Permissions**: Book borrowing and reviewing

### Categories
- Fiction
- Non-Fiction
- Science Fiction
- Mystery
- Romance
- Biography
- History
- Technology

## 🧪 Comprehensive Test Data

When using `npm run seed:all-test-data`, the system creates a complete testing environment:

### 📚 Sample Books (15+ titles)
- **Fiction**: To Kill a Mockingbird, 1984, Pride and Prejudice, The Great Gatsby, Harry Potter
- **Non-Fiction**: Sapiens, Educated, The Immortal Life of Henrietta Lacks
- **Science**: A Brief History of Time, The Selfish Gene, Cosmos
- **Technology**: Clean Code, The Pragmatic Programmer, Design Patterns
- **History**: The Guns of August, A People's History of the United States

### 👥 User Accounts (8 total)
- **1 Admin**: Full system access
- **1 Librarian**: Book and user management
- **5 Borrowers**: Various test users for borrowing scenarios

### 📖 Borrow Records (8 records)
- **Active borrows**: Currently borrowed books
- **Overdue borrows**: Books past due date
- **Returned borrows**: Completed borrowing history
- **Various dates**: Realistic timeline spanning weeks/months

### ⭐ Reviews (8+ reviews)
- **Ratings**: 1-5 star ratings across different books
- **Comments**: Realistic review text for testing
- **Multiple users**: Reviews from different borrower accounts
- **Book coverage**: Reviews for popular books

### 📧 Contact Messages (6 messages)
- **Categories**: Book requests, technical support, general inquiries, complaints, suggestions
- **Statuses**: Pending, in progress, resolved
- **Priorities**: Low, medium, high priority levels
- **Realistic content**: Sample messages for testing contact system

## Safety Mechanisms

### Environment Validation
```javascript
// Only allows seeding in development
if (process.env.NODE_ENV !== 'development' && !process.env.ALLOW_SEEDING) {
  throw new Error('Seeding only allowed in development environment');
}
```

### Production Database Detection
```javascript
// Prevents seeding production databases
if (dbUrl.includes('production') || dbUrl.includes('prod')) {
  throw new Error('Cannot seed production database');
}
```

### Idempotent Operations
- Admin seeding checks for existing admin users
- Category seeding checks for existing categories
- Safe to run multiple times without duplicates

## Error Handling

The seeding system provides detailed error messages:

```json
{
  "status": "error",
  "message": "Database seeding is only allowed in development environment",
  "code": "SEEDING_NOT_ALLOWED"
}
```

Common error scenarios:
- **Environment Protection**: Seeding disabled in production
- **Existing Data**: User or category already exists
- **Validation Errors**: Invalid email format or weak password
- **Database Connection**: MongoDB connection issues

## Troubleshooting

### Issue: "Seeding not allowed"
**Solution**: Ensure `NODE_ENV=development` in your `.env` file

### Issue: "Admin user already exists"
**Solution**: This is normal - the system prevents duplicates

### Issue: "Database connection failed"
**Solution**: Check your `MONGODB_URI` in `.env` file

### Issue: "Validation failed"
**Solution**: Check password requirements (minimum 8 characters)

### Issue: "Invalid credentials" when logging in with seeded users
**Solution**: Run `npm run seed:fix` to fix double-hashed passwords, then test with `npm run test:auth`

### Issue: Login fails after seeding
**Solution**: The seeding system was updated to fix password hashing. Run the fix command:
```bash
npm run seed:fix
npm run test:auth  # Verify the fix worked
```

## Integration with Landing Page

The system includes a web interface accessible at `http://localhost:5000`:

1. Visit the landing page
2. Click "Seed Database (Dev)" button
3. Confirm the operation
4. View results in the browser

## Best Practices

1. **Always check status first**: Run `npm run seed:status` before seeding
2. **Use environment variables**: Configure credentials in `.env` file
3. **Test in development**: Never seed production databases
4. **Monitor logs**: Check console output for detailed feedback
5. **Backup before reset**: The reset operation is irreversible

## Advanced Usage

### Custom Seeding Script

Create your own seeding logic:

```javascript
const SeedService = require('./services/seedService');

async function customSeed() {
  try {
    SeedService.validateSeedingEnvironment();
    const result = await SeedService.seedAdminUser();
    console.log('Seeding result:', result);
  } catch (error) {
    console.error('Seeding failed:', error);
  }
}
```

### Programmatic Access

```javascript
const { seedAdmin, getSeedingStatus } = require('./controllers/seedController');

// Check status programmatically
const status = await getSeedingStatus();

// Seed admin user programmatically  
const result = await seedAdmin();
```

## Security Considerations

- **Never commit credentials**: Use environment variables
- **Rotate default passwords**: Change default passwords in production
- **Monitor seeding logs**: Track who performs seeding operations
- **Disable in production**: Ensure `ALLOW_SEEDING=false` in production
- **Use strong passwords**: Follow password complexity requirements

## Support

For issues or questions about database seeding:

1. Check the troubleshooting section above
2. Review the console logs for detailed error messages
3. Ensure your environment is properly configured
4. Verify database connectivity

---

**⚠️ Important**: Database seeding is a powerful tool. Always use it responsibly and never in production environments unless absolutely necessary and with proper safeguards.
