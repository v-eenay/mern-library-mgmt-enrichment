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

# Seed admin user only
npm run seed:admin

# Seed librarian user only
npm run seed:librarian

# Seed default categories only
npm run seed:categories

# Seed all initial data
npm run seed:all

# Fix seeded users (if login issues occur)
npm run seed:fix

# Test authentication with seeded credentials
npm run test:auth

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
ADMIN_PASSWORD=your_secure_admin_password_here
ADMIN_NAME=System Administrator

# Librarian User Configuration
LIBRARIAN_EMAIL=librarian@library.com
LIBRARIAN_PASSWORD=your_secure_librarian_password_here
LIBRARIAN_NAME=Head Librarian

# Safety Controls
ALLOW_SEEDING=false  # Only set to true for non-dev environments if absolutely necessary
```

⚠️ **SECURITY WARNING**: Replace the placeholder passwords with strong, unique passwords in your actual `.env` file.

## Default Seeded Data

### Admin User
- **Email**: admin@library.com (configurable)
- **Password**: Set via `ADMIN_PASSWORD` environment variable
- **Role**: admin
- **Permissions**: Full system access

### Librarian User
- **Email**: librarian@library.com (configurable)
- **Password**: Set via `LIBRARIAN_PASSWORD` environment variable
- **Role**: librarian
- **Permissions**: Book and user management

### Categories
- Fiction
- Non-Fiction
- Science Fiction
- Mystery
- Romance
- Biography
- History
- Technology

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
