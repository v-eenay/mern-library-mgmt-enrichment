/**
 * Attendance Model
 * 
 * Mongoose model for Attendance entity with comprehensive schema definition,
 * validation, and business logic methods.
 * 
 * @author HRMS Development Team
 * @version 2.0.0
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Attendance Schema Definition
 * Comprehensive schema with validation, indexing, and business logic
 */
const attendanceSchema = new Schema({
  // Employee Reference
  employee: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee reference is required']
  },
  
  // Date Information
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  
  // Time Tracking
  clockIn: {
    type: Date,
    required: [true, 'Clock in time is required']
  },
  
  clockOut: {
    type: Date,
    validate: {
      validator: function(clockOut) {
        return !clockOut || clockOut > this.clockIn;
      },
      message: 'Clock out time must be after clock in time'
    }
  },
  
  // Break Times
  breaks: [{
    breakStart: {
      type: Date,
      required: true
    },
    breakEnd: {
      type: Date,
      validate: {
        validator: function(breakEnd) {
          return !breakEnd || breakEnd > this.breakStart;
        },
        message: 'Break end time must be after break start time'
      }
    },
    breakType: {
      type: String,
      enum: ['lunch', 'coffee', 'personal', 'meeting'],
      default: 'personal'
    },
    duration: {
      type: Number, // in minutes
      default: 0
    }
  }],
  
  // Work Information
  workLocation: {
    type: String,
    enum: ['office', 'remote', 'client-site', 'travel'],
    default: 'office'
  },
  
  // Status and Type
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'overtime'],
    default: 'present'
  },
  
  attendanceType: {
    type: String,
    enum: ['regular', 'overtime', 'holiday', 'weekend', 'sick-leave', 'vacation'],
    default: 'regular'
  },
  
  // Time Calculations (in minutes)
  totalWorkTime: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalBreakTime: {
    type: Number,
    default: 0,
    min: 0
  },
  
  netWorkTime: {
    type: Number,
    default: 0,
    min: 0
  },
  
  overtimeHours: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Additional Information
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
  // Approval and Management
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Employee'
  },
  
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  approvalDate: Date,
  
  // System Information
  ipAddress: String,
  deviceInfo: String,
  geoLocation: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  
  // Flags
  isLate: {
    type: Boolean,
    default: false
  },
  
  isEarlyLeave: {
    type: Boolean,
    default: false
  },
  
  isHoliday: {
    type: Boolean,
    default: false
  },
  
  isWeekend: {
    type: Boolean,
    default: false
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, status: 1 });
attendanceSchema.index({ employee: 1, attendanceType: 1 });
attendanceSchema.index({ approvalStatus: 1 });

// Virtual for formatted date
attendanceSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Virtual for total hours worked
attendanceSchema.virtual('totalHours').get(function() {
  return Math.round((this.netWorkTime / 60) * 100) / 100;
});

// Virtual for break hours
attendanceSchema.virtual('breakHours').get(function() {
  return Math.round((this.totalBreakTime / 60) * 100) / 100;
});

// Pre-save middleware to calculate time durations
attendanceSchema.pre('save', function(next) {
  try {
    // Calculate total work time
    if (this.clockIn && this.clockOut) {
      this.totalWorkTime = Math.floor((this.clockOut - this.clockIn) / (1000 * 60));
    }
    
    // Calculate total break time
    let totalBreakMinutes = 0;
    this.breaks.forEach(breakItem => {
      if (breakItem.breakStart && breakItem.breakEnd) {
        const breakDuration = Math.floor((breakItem.breakEnd - breakItem.breakStart) / (1000 * 60));
        breakItem.duration = breakDuration;
        totalBreakMinutes += breakDuration;
      }
    });
    this.totalBreakTime = totalBreakMinutes;
    
    // Calculate net work time
    this.netWorkTime = Math.max(0, this.totalWorkTime - this.totalBreakTime);
    
    // Calculate overtime (assuming 8 hours = 480 minutes is standard)
    const standardWorkMinutes = 480;
    this.overtimeHours = Math.max(0, (this.netWorkTime - standardWorkMinutes) / 60);
    
    // Check if late (assuming 9:00 AM is standard start time)
    if (this.clockIn) {
      const clockInTime = new Date(this.clockIn);
      const standardStartTime = new Date(this.date);
      standardStartTime.setHours(9, 0, 0, 0);
      this.isLate = clockInTime > standardStartTime;
    }
    
    // Check if early leave (assuming 5:00 PM is standard end time)
    if (this.clockOut) {
      const clockOutTime = new Date(this.clockOut);
      const standardEndTime = new Date(this.date);
      standardEndTime.setHours(17, 0, 0, 0);
      this.isEarlyLeave = clockOutTime < standardEndTime;
    }
    
    // Check if weekend
    const dayOfWeek = this.date.getDay();
    this.isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to get attendance by date range
attendanceSchema.statics.getByDateRange = function(startDate, endDate, employeeId = null) {
  const query = {
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (employeeId) {
    query.employee = employeeId;
  }
  
  return this.find(query)
    .populate('employee', 'firstName lastName employeeId position')
    .sort({ date: -1 });
};

// Static method to get monthly attendance summary
attendanceSchema.statics.getMonthlySummary = async function(year, month, employeeId = null) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const matchStage = {
    date: { $gte: startDate, $lte: endDate }
  };
  
  if (employeeId) {
    matchStage.employee = new mongoose.Types.ObjectId(employeeId);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: employeeId ? null : '$employee',
        totalDays: { $sum: 1 },
        presentDays: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absentDays: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        lateDays: { $sum: { $cond: ['$isLate', 1, 0] } },
        totalWorkHours: { $sum: { $divide: ['$netWorkTime', 60] } },
        totalOvertimeHours: { $sum: '$overtimeHours' },
        averageWorkHours: { $avg: { $divide: ['$netWorkTime', 60] } }
      }
    }
  ]);
};

// Instance method to approve attendance
attendanceSchema.methods.approve = function(approvedBy) {
  this.approvalStatus = 'approved';
  this.approvedBy = approvedBy;
  this.approvalDate = new Date();
  return this.save();
};

// Instance method to reject attendance
attendanceSchema.methods.reject = function(approvedBy) {
  this.approvalStatus = 'rejected';
  this.approvedBy = approvedBy;
  this.approvalDate = new Date();
  return this.save();
};

// Create and export the Attendance model
const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
