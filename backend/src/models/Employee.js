/**
 * Employee Model
 *
 * Mongoose model for Employee entity with comprehensive schema definition,
 * validation, and business logic methods.
 *
 * @author HRMS Development Team
 * @version 2.0.0
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const { Schema } = mongoose;

/**
 * Employee Schema Definition
 * Comprehensive schema with validation, indexing, and business logic
 */
const employeeSchema = new Schema({
  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },

  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },

  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9]?[\d\s\-\(\)]{7,15}$/, 'Please enter a valid phone number']
  },

  // Professional Information
  employeeId: {
    type: String,
    unique: true
  },

  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true,
    maxlength: [100, 'Position cannot exceed 100 characters']
  },

  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },

  salary: {
    type: Number,
    required: [true, 'Salary is required'],
    min: [0, 'Salary cannot be negative']
  },

  hireDate: {
    type: Date,
    required: [true, 'Hire date is required'],
    default: Date.now
  },

  // Authentication (for employee login)
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },

  role: {
    type: String,
    enum: ['employee', 'manager', 'hr', 'admin'],
    default: 'employee'
  },

  // Status and Metadata
  status: {
    type: String,
    enum: ['active', 'inactive', 'on-leave', 'terminated'],
    default: 'active'
  },

  // Additional Information
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },

  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },

  // Profile Information
  avatar: String,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say']
  },

  // Work Information
  workLocation: {
    type: String,
    enum: ['office', 'remote', 'hybrid'],
    default: 'office'
  },

  skills: [String],

  // System fields
  lastLogin: Date,
  isEmailVerified: {
    type: Boolean,
    default: false
  },

  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date

}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance (email and employeeId already have unique indexes)
employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ firstName: 1, lastName: 1 });

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for years of service
employeeSchema.virtual('yearsOfService').get(function() {
  const now = new Date();
  const hireDate = new Date(this.hireDate);
  return Math.floor((now - hireDate) / (365.25 * 24 * 60 * 60 * 1000));
});

// Pre-save middleware to hash password
employeeSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate employee ID
employeeSchema.pre('save', function(next) {
  if (!this.employeeId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.employeeId = `EMP-${timestamp}-${random}`;
  }
  next();
});

// Instance method to check password
employeeSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to generate password reset token
employeeSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Static method to find active employees
employeeSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Static method to find by department
employeeSchema.statics.findByDepartment = function(departmentId) {
  return this.find({ department: departmentId, status: 'active' });
};

// Static method to search employees
employeeSchema.statics.searchEmployees = function(searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { employeeId: regex },
      { position: regex }
    ],
    status: 'active'
  });
};

// Create and export the Employee model
const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
