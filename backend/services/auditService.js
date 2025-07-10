const mongoose = require('mongoose');

/**
 * Audit Log Schema for tracking administrative actions
 */
const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // User Management
      'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_ROLE_CHANGE',
      
      // Book Management
      'BOOK_CREATE', 'BOOK_UPDATE', 'BOOK_DELETE', 'BOOK_BULK_IMPORT',
      
      // Borrowing Management
      'BORROW_CREATE', 'BORROW_UPDATE', 'BORROW_RETURN', 'BORROW_EXTEND',
      'BORROW_OVERDUE_UPDATE',
      
      // Review Management
      'REVIEW_UPDATE_OTHER', 'REVIEW_DELETE_OTHER',
      
      // Category Management
      'CATEGORY_CREATE', 'CATEGORY_UPDATE', 'CATEGORY_DELETE',
      
      // Contact Management
      'CONTACT_UPDATE', 'CONTACT_DELETE',
      
      // System Operations
      'SYSTEM_MAINTENANCE', 'SYSTEM_BULK_OPERATION', 'SYSTEM_SECURITY_EVENT',
      
      // File Management
      'FILE_DELETE_OTHER', 'FILE_CLEANUP',
      
      // Authentication
      'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'PASSWORD_CHANGE',
      'TOKEN_REFRESH', 'ACCOUNT_LOCKOUT'
    ]
  },
  resourceType: {
    type: String,
    required: true,
    enum: ['User', 'Book', 'Borrow', 'Review', 'Category', 'Contact', 'System', 'File', 'Auth']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

/**
 * Audit Service for logging administrative and security events
 */
class AuditService {
  constructor() {
    this.AuditLog = AuditLog;
  }

  /**
   * Log an audit event
   * @param {Object} options - Audit log options
   * @returns {Promise<Object>} Created audit log entry
   */
  async logEvent({
    userId,
    userEmail,
    userRole,
    action,
    resourceType,
    resourceId = null,
    targetUserId = null,
    details = {},
    ipAddress,
    userAgent = null,
    severity = 'MEDIUM',
    success = true,
    errorMessage = null
  }) {
    try {
      const auditEntry = new this.AuditLog({
        userId,
        userEmail,
        userRole,
        action,
        resourceType,
        resourceId,
        targetUserId,
        details,
        ipAddress,
        userAgent,
        severity,
        success,
        errorMessage
      });

      await auditEntry.save();
      
      // Log to console for immediate visibility
      const logLevel = severity === 'CRITICAL' ? 'error' : severity === 'HIGH' ? 'warn' : 'info';
      console[logLevel](`[AUDIT] ${action} by ${userEmail} (${userRole}) - ${success ? 'SUCCESS' : 'FAILED'}`);
      
      return auditEntry;
    } catch (error) {
      console.error('Failed to log audit event:', error);
      throw error;
    }
  }

  /**
   * Create audit middleware for Express routes
   * @param {string} action - Action being performed
   * @param {string} resourceType - Type of resource
   * @param {string} severity - Severity level
   * @returns {Function} Express middleware
   */
  createAuditMiddleware(action, resourceType, severity = 'MEDIUM') {
    return async (req, res, next) => {
      // Store audit info in request for later use
      req.auditInfo = {
        action,
        resourceType,
        severity,
        startTime: Date.now()
      };

      // Override res.json to capture response and log audit event
      const originalJson = res.json;
      res.json = async function(data) {
        try {
          // Determine if operation was successful
          const success = res.statusCode < 400;
          
          // Extract resource ID from various sources
          let resourceId = req.params.id || req.params.bookId || req.params.userId || req.params.reviewId;
          if (!resourceId && data && data.data) {
            resourceId = data.data.id || data.data._id || data.data.book?._id || data.data.user?._id;
          }

          // Extract target user ID for user management operations
          let targetUserId = null;
          if (resourceType === 'User' && resourceId) {
            targetUserId = resourceId;
          }

          await auditService.logEvent({
            userId: req.user?._id,
            userEmail: req.user?.email || 'anonymous',
            userRole: req.user?.role || 'anonymous',
            action,
            resourceType,
            resourceId,
            targetUserId,
            details: {
              method: req.method,
              path: req.path,
              body: req.method !== 'GET' ? req.body : undefined,
              query: req.query,
              responseTime: Date.now() - req.auditInfo.startTime,
              statusCode: res.statusCode
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            severity,
            success,
            errorMessage: success ? null : data?.message || 'Operation failed'
          });
        } catch (auditError) {
          console.error('Audit logging failed:', auditError);
        }

        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    };
  }

  /**
   * Get audit logs with filtering and pagination
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Audit logs and metadata
   */
  async getAuditLogs(filters = {}, pagination = {}) {
    const {
      userId,
      action,
      resourceType,
      severity,
      success,
      startDate,
      endDate,
      targetUserId
    } = filters;

    const {
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = pagination;

    // Build query
    const query = {};
    
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (severity) query.severity = severity;
    if (typeof success === 'boolean') query.success = success;
    if (targetUserId) query.targetUserId = targetUserId;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [logs, total] = await Promise.all([
      this.AuditLog.find(query)
        .populate('userId', 'name email role')
        .populate('targetUserId', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.AuditLog.countDocuments(query)
    ]);

    return {
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get audit statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Audit statistics
   */
  async getAuditStats(filters = {}) {
    const { startDate, endDate } = filters;
    
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = new Date(startDate);
      if (endDate) matchStage.timestamp.$lte = new Date(endDate);
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          successfulEvents: {
            $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] }
          },
          failedEvents: {
            $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] }
          },
          criticalEvents: {
            $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] }
          },
          highSeverityEvents: {
            $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] }
          }
        }
      }
    ];

    const [stats] = await this.AuditLog.aggregate(pipeline);
    
    // Get action breakdown
    const actionStats = await this.AuditLog.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return {
      overview: stats || {
        totalEvents: 0,
        successfulEvents: 0,
        failedEvents: 0,
        criticalEvents: 0,
        highSeverityEvents: 0
      },
      topActions: actionStats
    };
  }

  /**
   * Clean up old audit logs
   * @param {number} daysToKeep - Number of days to keep logs
   * @returns {Promise<number>} Number of deleted logs
   */
  async cleanupOldLogs(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    console.log(`Cleaned up ${result.deletedCount} audit logs older than ${daysToKeep} days`);
    return result.deletedCount;
  }
}

// Export singleton instance
const auditService = new AuditService();
module.exports = auditService;
