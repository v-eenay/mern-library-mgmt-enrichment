/**
 * Attendance Controller
 * 
 * This module handles HTTP requests for attendance operations and coordinates
 * between the Express routes and the attendance data layer.
 * 
 * @author HRMS Development Team
 * @version 2.0.0
 */

import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';

/**
 * Get all attendance records with optional filtering and pagination
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllAttendance = async (req, res) => {
  try {
    console.log('Controller: getAllAttendance called with query:', req.query);

    // Extract query parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build query object
    const query = {};
    
    if (req.query.employee) {
      query.employee = req.query.employee;
    }
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.attendanceType) {
      query.attendanceType = req.query.attendanceType;
    }
    
    // Date range filter
    if (req.query.dateFrom || req.query.dateTo) {
      query.date = {};
      if (req.query.dateFrom) {
        query.date.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        query.date.$lte = new Date(req.query.dateTo);
      }
    }

    // Build sort object
    const sortBy = req.query.sortBy || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Execute query with pagination
    const [attendanceRecords, totalCount] = await Promise.all([
      Attendance.find(query)
        .populate('employee', 'firstName lastName employeeId position department')
        .populate('approvedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const pagination = {
      currentPage: page,
      totalPages,
      totalItems: totalCount,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Attendance records retrieved successfully',
      data: attendanceRecords,
      pagination,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in getAllAttendance controller:', error.message);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve attendance records',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get attendance record by ID
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAttendanceById = async (req, res) => {
  try {
    const attendanceId = req.params.id;
    console.log('Controller: getAttendanceById called with ID:', attendanceId);

    // Find attendance record by ID
    const attendance = await Attendance.findById(attendanceId)
      .populate('employee', 'firstName lastName employeeId position department')
      .populate('approvedBy', 'firstName lastName');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found',
        code: 'ATTENDANCE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Attendance record retrieved successfully',
      data: attendance,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in getAttendanceById controller:', error.message);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve attendance record',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Create a new attendance record (clock in)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createAttendance = async (req, res) => {
  try {
    console.log('Controller: createAttendance called with data:', req.body);

    // Check if employee already has attendance for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAttendance = await Attendance.findOne({
      employee: req.body.employee,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        error: 'Attendance already recorded for today',
        code: 'ATTENDANCE_EXISTS',
        timestamp: new Date().toISOString()
      });
    }

    // Create new attendance record
    const attendanceData = {
      ...req.body,
      date: req.body.date || new Date(),
      clockIn: req.body.clockIn || new Date()
    };

    const newAttendance = new Attendance(attendanceData);
    await newAttendance.save();

    // Populate employee info
    const populatedAttendance = await Attendance.findById(newAttendance._id)
      .populate('employee', 'firstName lastName employeeId position');

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Attendance record created successfully',
      data: populatedAttendance,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in createAttendance controller:', error.message);
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
        timestamp: new Date().toISOString()
      });
    }

    // Return general error response
    res.status(500).json({
      success: false,
      error: 'Failed to create attendance record',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update attendance record (clock out, add breaks, etc.)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateAttendance = async (req, res) => {
  try {
    const attendanceId = req.params.id;
    console.log('Controller: updateAttendance called with ID:', attendanceId, 'and data:', req.body);

    // Update attendance record
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
    )
    .populate('employee', 'firstName lastName employeeId position')
    .populate('approvedBy', 'firstName lastName');

    if (!updatedAttendance) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found',
        code: 'ATTENDANCE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      data: updatedAttendance,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in updateAttendance controller:', error.message);
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
        timestamp: new Date().toISOString()
      });
    }

    // Return general error response
    res.status(500).json({
      success: false,
      error: 'Failed to update attendance record',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete attendance record
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteAttendance = async (req, res) => {
  try {
    const attendanceId = req.params.id;
    console.log('Controller: deleteAttendance called with ID:', attendanceId);

    // Delete attendance record
    const deletedAttendance = await Attendance.findByIdAndDelete(attendanceId);

    if (!deletedAttendance) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found',
        code: 'ATTENDANCE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in deleteAttendance controller:', error.message);

    // Return error response
    res.status(500).json({
      success: false,
      error: 'Failed to delete attendance record',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get attendance statistics
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAttendanceStats = async (req, res) => {
  try {
    console.log('Controller: getAttendanceStats called');

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get attendance statistics
    const [
      todayAttendance,
      monthlyAttendance,
      statusBreakdown,
      averageWorkHours
    ] = await Promise.all([
      Attendance.countDocuments({
        date: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(today.setHours(23, 59, 59, 999))
        }
      }),
      Attendance.countDocuments({
        date: { $gte: startOfMonth, $lte: endOfMonth }
      }),
      Attendance.aggregate([
        {
          $match: {
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Attendance.aggregate([
        {
          $match: {
            date: { $gte: startOfMonth, $lte: endOfMonth },
            netWorkTime: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            averageHours: { $avg: { $divide: ['$netWorkTime', 60] } },
            totalHours: { $sum: { $divide: ['$netWorkTime', 60] } }
          }
        }
      ])
    ]);

    const stats = {
      todayAttendance,
      monthlyAttendance,
      statusBreakdown,
      averageWorkHours: averageWorkHours[0] || { averageHours: 0, totalHours: 0 }
    };

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Attendance statistics retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in getAttendanceStats controller:', error.message);

    // Return error response
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve attendance statistics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get monthly attendance summary for an employee
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getMonthlyAttendance = async (req, res) => {
  try {
    const { employeeId, year, month } = req.params;
    console.log('Controller: getMonthlyAttendance called for employee:', employeeId, 'year:', year, 'month:', month);

    // Get monthly summary using the model's static method
    const summary = await Attendance.getMonthlySummary(
      parseInt(year),
      parseInt(month),
      employeeId
    );

    // Get detailed attendance records for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendanceRecords = await Attendance.getByDateRange(
      startDate,
      endDate,
      employeeId
    );

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Monthly attendance retrieved successfully',
      data: {
        summary: summary[0] || {},
        records: attendanceRecords,
        period: {
          year: parseInt(year),
          month: parseInt(month),
          startDate,
          endDate
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in getMonthlyAttendance controller:', error.message);

    // Return error response
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve monthly attendance',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
