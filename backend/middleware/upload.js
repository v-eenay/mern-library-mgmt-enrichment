const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const crypto = require('crypto');
const securityMiddleware = require('./securityMiddleware');

// Enhanced file filter function with security validation
const fileFilter = (req, file, cb) => {
  // Allowed file types (including WEBP)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  // Check MIME type
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.'), false);
  }

  // Check file extension
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return cb(new Error('Invalid file extension. Only .jpg, .jpeg, .png, .gif, and .webp files are allowed.'), false);
  }

  // Check for potentially malicious filenames
  const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '');
  if (sanitizedName !== file.originalname) {
    return cb(new Error('Invalid characters in filename.'), false);
  }

  // Check for double extensions (potential security risk)
  const extensionCount = (file.originalname.match(/\./g) || []).length;
  if (extensionCount > 1) {
    return cb(new Error('Multiple file extensions are not allowed.'), false);
  }

  cb(null, true);
};

// Enhanced file filter for profile images with dimension validation
const profileFileFilter = (req, file, cb) => {
  fileFilter(req, file, (err, result) => {
    if (err) return cb(err, false);

    // Additional validation for profile images can be added here
    cb(null, result);
  });
};

// Enhanced file filter for book covers with dimension validation
const bookFileFilter = (req, file, cb) => {
  fileFilter(req, file, (err, result) => {
    if (err) return cb(err, false);

    // Additional validation for book covers can be added here
    cb(null, result);
  });
};

// Memory storage for initial processing
const memoryStorage = multer.memoryStorage();

// Enhanced storage configuration for profile pictures with date-based subdirectories
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const uploadPath = path.join(__dirname, '../uploads/profiles', year.toString(), month);

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: uuid-timestamp.extension
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Enhanced storage configuration for book covers with date-based subdirectories
const bookStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const uploadPath = path.join(__dirname, '../uploads/books', year.toString(), month);

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: uuid-timestamp.extension
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Multer configuration for profile pictures with memory storage for processing
const uploadProfileMemory = multer({
  storage: memoryStorage,
  fileFilter: profileFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only one file at a time
    fieldSize: 1024 * 1024, // 1MB field size limit
    fieldNameSize: 100, // Field name size limit
    fields: 10 // Maximum number of fields
  }
});

// Multer configuration for profile pictures with disk storage
const uploadProfile = multer({
  storage: profileStorage,
  fileFilter: profileFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only one file at a time
    fieldSize: 1024 * 1024, // 1MB field size limit
    fieldNameSize: 100, // Field name size limit
    fields: 10 // Maximum number of fields
  }
});

// Multer configuration for book covers with memory storage for processing
const uploadBookCoverMemory = multer({
  storage: memoryStorage,
  fileFilter: bookFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for book covers
    files: 1, // Only one file at a time
    fieldSize: 1024 * 1024, // 1MB field size limit
    fieldNameSize: 100, // Field name size limit
    fields: 10 // Maximum number of fields
  }
});

// Multer configuration for book covers with disk storage
const uploadBookCover = multer({
  storage: bookStorage,
  fileFilter: bookFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for book covers
    files: 1, // Only one file at a time
    fieldSize: 1024 * 1024, // 1MB field size limit
    fieldNameSize: 100, // Field name size limit
    fields: 10 // Maximum number of fields
  }
});

// Image validation and processing functions
const validateImageDimensions = async (buffer, type = 'profile') => {
  try {
    const metadata = await sharp(buffer).metadata();

    if (type === 'profile') {
      // Profile image constraints
      if (metadata.width < 100 || metadata.height < 100) {
        throw new Error('Profile image must be at least 100x100 pixels');
      }
      if (metadata.width > 2000 || metadata.height > 2000) {
        throw new Error('Profile image must not exceed 2000x2000 pixels');
      }
    } else if (type === 'book') {
      // Book cover constraints
      if (metadata.width < 200 || metadata.height < 300) {
        throw new Error('Book cover must be at least 200x300 pixels');
      }
      if (metadata.width > 1500 || metadata.height > 2000) {
        throw new Error('Book cover must not exceed 1500x2000 pixels');
      }
    }

    return metadata;
  } catch (error) {
    throw new Error(`Image validation failed: ${error.message}`);
  }
};

// Function to optimize and compress images
const optimizeImage = async (buffer, type = 'profile') => {
  try {
    let sharpInstance = sharp(buffer);

    if (type === 'profile') {
      // Optimize profile images
      sharpInstance = sharpInstance
        .resize(500, 500, {
          fit: 'cover',
          position: 'center',
          withoutEnlargement: true
        })
        .jpeg({
          quality: 85,
          progressive: true,
          mozjpeg: true
        });
    } else if (type === 'book') {
      // Optimize book covers
      sharpInstance = sharpInstance
        .resize(400, 600, {
          fit: 'cover',
          position: 'center',
          withoutEnlargement: true
        })
        .jpeg({
          quality: 90,
          progressive: true,
          mozjpeg: true
        });
    }

    return await sharpInstance.toBuffer();
  } catch (error) {
    throw new Error(`Image optimization failed: ${error.message}`);
  }
};

// Function to scan for malicious content
const scanImageContent = async (buffer) => {
  try {
    // Basic malicious content detection
    const metadata = await sharp(buffer).metadata();

    // Check for suspicious metadata
    if (metadata.exif && metadata.exif.length > 10000) {
      throw new Error('Suspicious EXIF data detected');
    }

    // Check for embedded scripts or suspicious patterns
    const bufferString = buffer.toString('hex');
    const suspiciousPatterns = [
      '3c736372697074', // <script
      '6a617661736372697074', // javascript
      '6f6e6c6f6164', // onload
      '6f6e6572726f72', // onerror
    ];

    for (const pattern of suspiciousPatterns) {
      if (bufferString.includes(pattern)) {
        throw new Error('Potentially malicious content detected in image');
      }
    }

    return true;
  } catch (error) {
    throw new Error(`Content scan failed: ${error.message}`);
  }
};

// Utility function to delete a file
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!filePath) {
      return resolve();
    }

    // Convert relative path to absolute path
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(__dirname, '../', filePath);

    fs.unlink(absolutePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        // Ignore file not found errors, reject others
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Function to save processed image to disk
const saveProcessedImage = async (buffer, type = 'profile', originalName = 'image') => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');

    const uploadDir = type === 'profile' ? 'profiles' : 'books';
    const uploadPath = path.join(__dirname, '../uploads', uploadDir, year.toString(), month);

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Generate unique filename
    const extension = path.extname(originalName) || '.jpg';
    const uniqueName = `${uuidv4()}-${Date.now()}${extension}`;
    const fullPath = path.join(uploadPath, uniqueName);

    // Write file to disk
    await fs.promises.writeFile(fullPath, buffer);

    // Return relative path for database storage
    return `uploads/${uploadDir}/${year}/${month}/${uniqueName}`;
  } catch (error) {
    throw new Error(`Failed to save image: ${error.message}`);
  }
};

// Function to find and clean up orphaned files
const cleanupOrphanedFiles = async () => {
  try {
    const User = require('../models/User');
    const Book = require('../models/Book');

    const uploadsDir = path.join(__dirname, '../uploads');
    const orphanedFiles = [];

    // Get all image files in uploads directory
    const getAllFiles = (dir, fileList = []) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          getAllFiles(filePath, fileList);
        } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
          const relativePath = path.relative(path.join(__dirname, '../'), filePath).replace(/\\/g, '/');
          fileList.push(relativePath);
        }
      });
      return fileList;
    };

    const allImageFiles = getAllFiles(uploadsDir);

    // Get all referenced files from database
    const [users, books] = await Promise.all([
      User.find({ profilePicture: { $ne: null } }, 'profilePicture'),
      Book.find({ coverImage: { $ne: null } }, 'coverImage')
    ]);

    const referencedFiles = new Set();
    users.forEach(user => {
      if (user.profilePicture) {
        referencedFiles.add(user.profilePicture);
      }
    });
    books.forEach(book => {
      if (book.coverImage) {
        referencedFiles.add(book.coverImage);
      }
    });

    // Find orphaned files
    allImageFiles.forEach(file => {
      if (!referencedFiles.has(file)) {
        orphanedFiles.push(file);
      }
    });

    // Delete orphaned files older than 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    let deletedCount = 0;

    for (const file of orphanedFiles) {
      try {
        const fullPath = path.join(__dirname, '../', file);
        const stats = fs.statSync(fullPath);

        if (stats.mtime.getTime() < oneDayAgo) {
          await deleteFile(file);
          deletedCount++;
        }
      } catch (error) {
        console.error(`Error processing orphaned file ${file}:`, error);
      }
    }

    return {
      totalOrphaned: orphanedFiles.length,
      deleted: deletedCount,
      orphanedFiles: orphanedFiles.slice(0, 10) // Return first 10 for logging
    };
  } catch (error) {
    console.error('Orphaned file cleanup error:', error);
    throw error;
  }
};

// Utility function to get file URL from file path
const getFileUrl = (req, filePath) => {
  if (!filePath) return null;
  
  // If it's already a full URL, return as is
  if (filePath.startsWith('http')) {
    return filePath;
  }
  
  // Convert local path to URL
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/${filePath.replace(/\\/g, '/')}`;
};

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          status: 'error',
          message: 'File too large. Maximum size is 5MB.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          status: 'error',
          message: 'Too many files. Only one file is allowed.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          status: 'error',
          message: 'Unexpected field name for file upload.'
        });
      default:
        return res.status(400).json({
          status: 'error',
          message: 'File upload error: ' + error.message
        });
    }
  } else if (error) {
    return res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
  
  next();
};

module.exports = {
  uploadProfile,
  uploadProfileMemory,
  uploadBookCover,
  uploadBookCoverMemory,
  deleteFile,
  getFileUrl,
  handleMulterError,
  validateImageDimensions,
  optimizeImage,
  scanImageContent,
  saveProcessedImage,
  cleanupOrphanedFiles
};
