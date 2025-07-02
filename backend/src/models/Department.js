/**
 * Department Model
 * 
 * Mongoose model for Department entity with comprehensive schema definition,
 * validation, and business logic methods.
 * 
 * @author HRMS Development Team
 * @version 2.0.0
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Department Schema Definition
 * Comprehensive schema with validation, indexing, and business logic
 */
const departmentSchema = new Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Department name must be at least 2 characters'],
    maxlength: [100, 'Department name cannot exceed 100 characters']
  },
  
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [2, 'Department code must be at least 2 characters'],
    maxlength: [10, 'Department code cannot exceed 10 characters'],
    match: [/^[A-Z0-9]+$/, 'Department code can only contain uppercase letters and numbers']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Management Information
  manager: {
    type: Schema.Types.ObjectId,
    ref: 'Employee'
  },
  
  // Location and Contact
  location: {
    building: String,
    floor: String,
    room: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'USA' }
    }
  },
  
  contactInfo: {
    phone: {
      type: String,
      match: [/^[\+]?[1-9]?[\d\s\-\(\)]{7,15}$/, 'Please enter a valid phone number']
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    extension: String
  },
  
  // Budget and Financial Information
  budget: {
    annual: {
      type: Number,
      min: [0, 'Budget cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
    }
  },
  
  // Status and Metadata
  status: {
    type: String,
    enum: ['active', 'inactive', 'restructuring'],
    default: 'active'
  },
  
  // Organizational Information
  parentDepartment: {
    type: Schema.Types.ObjectId,
    ref: 'Department'
  },
  
  // Additional Information
  establishedDate: {
    type: Date,
    default: Date.now
  },
  
  goals: [String],
  
  // Performance Metrics
  metrics: {
    employeeCount: {
      type: Number,
      default: 0,
      min: 0
    },
    averageSalary: {
      type: Number,
      default: 0,
      min: 0
    },
    turnoverRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance (name and code already have unique indexes)
departmentSchema.index({ status: 1 });
departmentSchema.index({ manager: 1 });
departmentSchema.index({ parentDepartment: 1 });

// Virtual for full location
departmentSchema.virtual('fullLocation').get(function() {
  if (!this.location) return '';
  
  const parts = [];
  if (this.location.building) parts.push(`Building ${this.location.building}`);
  if (this.location.floor) parts.push(`Floor ${this.location.floor}`);
  if (this.location.room) parts.push(`Room ${this.location.room}`);
  
  return parts.join(', ');
});

// Virtual for employee count (populated separately)
departmentSchema.virtual('employees', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'department',
  count: true
});

// Static method to find active departments
departmentSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Static method to find departments with managers
departmentSchema.statics.findWithManagers = function() {
  return this.find({ manager: { $exists: true, $ne: null } })
    .populate('manager', 'firstName lastName email position');
};

// Static method to get department hierarchy
departmentSchema.statics.getHierarchy = async function() {
  const departments = await this.find({ status: 'active' })
    .populate('parentDepartment', 'name code')
    .populate('manager', 'firstName lastName email');
    
  // Build hierarchy tree
  const departmentMap = new Map();
  const rootDepartments = [];
  
  departments.forEach(dept => {
    departmentMap.set(dept._id.toString(), { ...dept.toObject(), children: [] });
  });
  
  departments.forEach(dept => {
    if (dept.parentDepartment) {
      const parent = departmentMap.get(dept.parentDepartment._id.toString());
      if (parent) {
        parent.children.push(departmentMap.get(dept._id.toString()));
      }
    } else {
      rootDepartments.push(departmentMap.get(dept._id.toString()));
    }
  });
  
  return rootDepartments;
};

// Instance method to get all child departments
departmentSchema.methods.getChildDepartments = function() {
  return this.model('Department').find({ parentDepartment: this._id });
};

// Instance method to get all employees in department
departmentSchema.methods.getEmployees = function() {
  return this.model('Employee').find({ department: this._id, status: 'active' });
};

// Pre-save middleware to update metrics
departmentSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('status')) {
    try {
      // Update employee count
      const Employee = this.model('Employee');
      const employeeCount = await Employee.countDocuments({ 
        department: this._id, 
        status: 'active' 
      });
      
      this.metrics.employeeCount = employeeCount;
      
      // Calculate average salary if there are employees
      if (employeeCount > 0) {
        const salaryAgg = await Employee.aggregate([
          { $match: { department: this._id, status: 'active' } },
          { $group: { _id: null, avgSalary: { $avg: '$salary' } } }
        ]);
        
        this.metrics.averageSalary = salaryAgg.length > 0 ? 
          Math.round(salaryAgg[0].avgSalary) : 0;
      }
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Create and export the Department model
const Department = mongoose.model('Department', departmentSchema);

export default Department;
