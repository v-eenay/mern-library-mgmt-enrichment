const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { attendance, saveAttendance } = require('../models/Attendance');

// GET /api/attendance - Get all attendance records
router.get('/', (req, res) => {
  try {
    const { 
      employeeId, 
      date, 
      status, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    let filteredAttendance = [...attendance];
    
    // Filter by employee ID
    if (employeeId) {
      filteredAttendance = filteredAttendance.filter(att => att.employeeId === employeeId);
    }
    
    // Filter by specific date
    if (date) {
      filteredAttendance = filteredAttendance.filter(att => att.date === date);
    }
    
    // Filter by date range
    if (startDate && endDate) {
      filteredAttendance = filteredAttendance.filter(att => 
        att.date >= startDate && att.date <= endDate
      );
    }
    
    // Filter by status
    if (status) {
      filteredAttendance = filteredAttendance.filter(att => att.status === status);
    }
    
    // Sort by date (newest first)
    filteredAttendance.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedAttendance = filteredAttendance.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedAttendance,
      pagination: {
        total: filteredAttendance.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(filteredAttendance.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/attendance/:id - Get attendance record by ID
router.get('/:id', (req, res) => {
  try {
    const attendanceRecord = attendance.find(att => att.id === req.params.id);
    
    if (!attendanceRecord) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }
    
    res.json({ success: true, data: attendanceRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/attendance - Create new attendance record
router.post('/', (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      date,
      clockIn,
      clockOut,
      status,
      notes
    } = req.body;
    
    // Basic validation
    if (!employeeId || !employeeName || !date || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: employeeId, employeeName, date, status'
      });
    }
    
    // Check if attendance record already exists for this employee and date
    const existingRecord = attendance.find(att => 
      att.employeeId === employeeId && att.date === date
    );
    if (existingRecord) {
      return res.status(400).json({
        success: false,
        error: 'Attendance record for this employee and date already exists'
      });
    }
    
    // Calculate total hours if both clockIn and clockOut are provided
    let totalHours = 0;
    if (clockIn && clockOut) {
      const clockInTime = new Date(`2000-01-01T${clockIn}`);
      const clockOutTime = new Date(`2000-01-01T${clockOut}`);
      totalHours = (clockOutTime - clockInTime) / (1000 * 60 * 60); // Convert to hours
    }
    
    const newAttendanceRecord = {
      id: uuidv4(),
      employeeId,
      employeeName,
      date,
      clockIn: clockIn || null,
      clockOut: clockOut || null,
      totalHours,
      status,
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
      attendance.push(newAttendanceRecord);
    saveAttendance(attendance);
    
    res.status(201).json({ success: true, data: newAttendanceRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/attendance/:id - Update attendance record
router.put('/:id', (req, res) => {
  try {
    const attendanceIndex = attendance.findIndex(att => att.id === req.params.id);
    
    if (attendanceIndex === -1) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }
    
    const {
      clockIn,
      clockOut,
      status,
      notes
    } = req.body;
    
    // Calculate total hours if both clockIn and clockOut are provided
    let totalHours = attendance[attendanceIndex].totalHours;
    const updatedClockIn = clockIn || attendance[attendanceIndex].clockIn;
    const updatedClockOut = clockOut || attendance[attendanceIndex].clockOut;
    
    if (updatedClockIn && updatedClockOut) {
      const clockInTime = new Date(`2000-01-01T${updatedClockIn}`);
      const clockOutTime = new Date(`2000-01-01T${updatedClockOut}`);
      totalHours = (clockOutTime - clockInTime) / (1000 * 60 * 60); // Convert to hours
    }
      // Update attendance record
    attendance[attendanceIndex] = {
      ...attendance[attendanceIndex],
      clockIn: updatedClockIn,
      clockOut: updatedClockOut,
      totalHours,
      status: status || attendance[attendanceIndex].status,
      notes: notes !== undefined ? notes : attendance[attendanceIndex].notes,
      updatedAt: new Date()
    };

    saveAttendance(attendance);
    
    res.json({ success: true, data: attendance[attendanceIndex] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/attendance/:id - Delete attendance record
router.delete('/:id', (req, res) => {
  try {
    const attendanceIndex = attendance.findIndex(att => att.id === req.params.id);
    
    if (attendanceIndex === -1) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }
      const deletedRecord = attendance.splice(attendanceIndex, 1)[0];
    saveAttendance(attendance);
    
    res.json({ 
      success: true, 
      data: deletedRecord, 
      message: 'Attendance record deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/attendance/clock-in - Clock in an employee
router.post('/clock-in', (req, res) => {
  try {
    const { employeeId, employeeName } = req.body;
    
    if (!employeeId || !employeeName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: employeeId, employeeName'
      });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];
    
    // Check if already clocked in today
    const existingRecord = attendance.find(att => 
      att.employeeId === employeeId && att.date === today
    );
    
    if (existingRecord) {
      return res.status(400).json({
        success: false,
        error: 'Employee has already clocked in today'
      });
    }
    
    const clockInRecord = {
      id: uuidv4(),
      employeeId,
      employeeName,
      date: today,
      clockIn: currentTime,
      clockOut: null,
      totalHours: 0,
      status: 'present',
      notes: 'Auto clock-in',
      createdAt: new Date(),
      updatedAt: new Date()
    };
      attendance.push(clockInRecord);
    saveAttendance(attendance);
    
    res.status(201).json({ success: true, data: clockInRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/attendance/clock-out - Clock out an employee
router.post('/clock-out', (req, res) => {
  try {
    const { employeeId } = req.body;
    
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: employeeId'
      });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];
    
    // Find today's attendance record
    const attendanceIndex = attendance.findIndex(att => 
      att.employeeId === employeeId && att.date === today
    );
    
    if (attendanceIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'No clock-in record found for today'
      });
    }
    
    if (attendance[attendanceIndex].clockOut) {
      return res.status(400).json({
        success: false,
        error: 'Employee has already clocked out today'
      });
    }
    
    // Calculate total hours
    const clockInTime = new Date(`2000-01-01T${attendance[attendanceIndex].clockIn}`);
    const clockOutTime = new Date(`2000-01-01T${currentTime}`);
    const totalHours = (clockOutTime - clockInTime) / (1000 * 60 * 60);
      // Update the record
    attendance[attendanceIndex] = {
      ...attendance[attendanceIndex],
      clockOut: currentTime,
      totalHours: parseFloat(totalHours.toFixed(2)),
      notes: attendance[attendanceIndex].notes + ' - Auto clock-out',
      updatedAt: new Date()
    };

    saveAttendance(attendance);
    
    res.json({ success: true, data: attendance[attendanceIndex] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/attendance/stats/summary - Get attendance statistics
router.get('/stats/summary', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(att => att.date === today);
    
    const stats = {
      today: {
        total: todayAttendance.length,
        present: todayAttendance.filter(att => att.status === 'present').length,
        absent: todayAttendance.filter(att => att.status === 'absent').length,
        late: todayAttendance.filter(att => 
          att.clockIn && att.clockIn > '09:00:00'
        ).length
      },
      overall: {
        totalRecords: attendance.length,
        averageHours: attendance
          .filter(att => att.totalHours > 0)
          .reduce((sum, att) => sum + att.totalHours, 0) / 
          attendance.filter(att => att.totalHours > 0).length || 0
      }
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
