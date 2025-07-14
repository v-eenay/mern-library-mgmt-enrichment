# Security Configuration Guide

## Environment Variables Setup

### For Development

1. **Copy the development template:**
   ```bash
   cp .env.development.example .env
   ```

2. **The development template includes secure but convenient passwords for local testing.**

### For Production

1. **Copy the production template:**
   ```bash
   cp .env.example .env
   ```

2. **Replace ALL placeholder values with secure, unique passwords:**
   - `ADMIN_PASSWORD=your_secure_admin_password_here` → Use a strong, unique password
   - `LIBRARIAN_PASSWORD=your_secure_librarian_password_here` → Use a strong, unique password
   - `BORROWER_PASSWORD=your_secure_borrower_password_here` → Use a strong, unique password
   - `JWT_SECRET=your_super_secret_jwt_key_here...` → Use a cryptographically secure key
   - `EMAIL_PASS=your_secure_app_password_here` → Use your actual email app password

## Required Environment Variables

The following environment variables are **required** for the application to function:

### Authentication & Security
- `JWT_SECRET` - JWT signing secret (minimum 32 characters)
- `JWT_REFRESH_SECRET` - JWT refresh token secret (minimum 32 characters)

### Database Seeding (Development Only)
- `ADMIN_PASSWORD` - Admin user password for seeding
- `LIBRARIAN_PASSWORD` - Librarian user password for seeding  
- `BORROWER_PASSWORD` - Borrower user password for seeding

### Optional Variables
- `ALICE_PASSWORD`, `BOB_PASSWORD`, `CAROL_PASSWORD`, `DAVID_PASSWORD` - Additional test user passwords (will use `BORROWER_PASSWORD` if not set)

## Security Best Practices

### ✅ DO
- Use strong, unique passwords for all accounts
- Set `ALLOW_SEEDING=false` in production
- Use environment variables for all sensitive data
- Rotate passwords regularly
- Use different passwords for each environment

### ❌ DON'T
- Commit `.env` files to version control
- Use default or weak passwords in production
- Share environment files between team members
- Use development passwords in production

## Password Requirements

All passwords should meet these minimum requirements:
- At least 8 characters long
- Include uppercase and lowercase letters
- Include numbers and special characters
- Be unique across different services

## Environment File Security

### .gitignore Configuration
Ensure your `.gitignore` includes:
```
.env
.env.local
.env.production
.env.development
```

### File Permissions
Set restrictive permissions on environment files:
```bash
chmod 600 .env
```

## Troubleshooting

### "Environment variable is required for seeding" Error
This error occurs when required password environment variables are not set.

**Solution:**
1. Ensure your `.env` file exists
2. Verify all required password variables are set:
   ```bash
   grep -E "(ADMIN_PASSWORD|LIBRARIAN_PASSWORD|BORROWER_PASSWORD)" .env
   ```
3. Restart the application after updating environment variables

### Seeding Fails with Authentication Errors
This may occur if passwords don't meet minimum requirements.

**Solution:**
1. Ensure passwords are at least 8 characters long
2. Check that environment variables are properly loaded
3. Verify no extra spaces or quotes in environment values

## Development vs Production

### Development Environment
- Uses convenient but secure passwords
- Allows database seeding
- More permissive rate limiting
- Detailed error messages

### Production Environment
- Requires strong, unique passwords
- Disables database seeding (`ALLOW_SEEDING=false`)
- Strict rate limiting
- Minimal error disclosure

## Security Monitoring

The application includes security monitoring features:
- Rate limiting on all endpoints
- Input validation and sanitization
- XSS protection
- MongoDB injection prevention
- Suspicious pattern detection

Configure monitoring with:
```env
SECURITY_MONITOR_TOKEN=your_secure_monitoring_token
SUSPICIOUS_PATTERN_DETECTION=true
XSS_PROTECTION=true
MONGODB_SANITIZATION=true
```

## Support

For security-related questions or to report vulnerabilities:
1. Check this documentation first
2. Review the application logs for specific error messages
3. Ensure all environment variables are properly configured
4. Contact the development team for assistance

**Remember: Never commit sensitive information to version control!**
