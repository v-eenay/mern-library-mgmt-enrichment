const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
    minlength: [2, 'Name must be at least 2 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    minlength: [5, 'Subject must be at least 5 characters long'],
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['general_inquiry', 'book_request', 'technical_support', 'complaint', 'suggestion'],
      message: 'Category must be one of: general_inquiry, book_request, technical_support, complaint, suggestion'
    },
    default: 'general_inquiry'
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters long'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['unread', 'read', 'in_progress', 'resolved', 'archived'],
      message: 'Status must be one of: unread, read, in_progress, resolved, archived'
    },
    default: 'unread'
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be one of: low, medium, high, urgent'
    },
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  responseTime: {
    type: Number, // Time in hours to first response
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
contactMessageSchema.index({ email: 1 });
contactMessageSchema.index({ createdAt: -1 });
contactMessageSchema.index({ name: 1 });
contactMessageSchema.index({ status: 1 });
contactMessageSchema.index({ category: 1 });
contactMessageSchema.index({ priority: 1 });
contactMessageSchema.index({ assignedTo: 1 });

// Compound indexes for common queries
contactMessageSchema.index({ email: 1, createdAt: -1 });
contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ category: 1, status: 1 });
contactMessageSchema.index({ priority: 1, status: 1 });
contactMessageSchema.index({ assignedTo: 1, status: 1 });

// Virtual for message length
contactMessageSchema.virtual('messageLength').get(function() {
  return this.message ? this.message.length : 0;
});

// Virtual for formatted creation date
contactMessageSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for category display name
contactMessageSchema.virtual('categoryDisplay').get(function() {
  const categoryMap = {
    'general_inquiry': 'General Inquiry',
    'book_request': 'Book Request',
    'technical_support': 'Technical Support',
    'complaint': 'Complaint',
    'suggestion': 'Suggestion'
  };
  return categoryMap[this.category] || this.category;
});

// Virtual for status display name
contactMessageSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'unread': 'Unread',
    'read': 'Read',
    'in_progress': 'In Progress',
    'resolved': 'Resolved',
    'archived': 'Archived'
  };
  return statusMap[this.status] || this.status;
});

// Virtual for priority display name
contactMessageSchema.virtual('priorityDisplay').get(function() {
  const priorityMap = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'urgent': 'Urgent'
  };
  return priorityMap[this.priority] || this.priority;
});

// Virtual to check if message is overdue (unread for more than 24 hours)
contactMessageSchema.virtual('isOverdue').get(function() {
  if (this.status !== 'unread') return false;
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  return this.createdAt < oneDayAgo;
});

// Virtual for resolution time in hours
contactMessageSchema.virtual('resolutionTime').get(function() {
  if (!this.resolvedAt) return null;
  const diffTime = this.resolvedAt - this.createdAt;
  return Math.round(diffTime / (1000 * 60 * 60)); // Convert to hours
});

// Static method to find messages by email
contactMessageSchema.statics.findByEmail = function(email) {
  return this.find({ email: email.toLowerCase() }).sort({ createdAt: -1 });
};

// Static method to find recent messages (last 30 days)
contactMessageSchema.statics.findRecent = function(days = 30) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  
  return this.find({ 
    createdAt: { $gte: dateThreshold } 
  }).sort({ createdAt: -1 });
};

// Static method to search messages by name or email
contactMessageSchema.statics.searchByNameOrEmail = function(searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { name: regex },
      { email: regex }
    ]
  }).sort({ createdAt: -1 });
};

// Static method to get message statistics
contactMessageSchema.statics.getStats = async function() {
  const totalMessages = await this.countDocuments();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMessages = await this.countDocuments({ 
    createdAt: { $gte: today } 
  });
  
  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);
  const weekMessages = await this.countDocuments({ 
    createdAt: { $gte: thisWeek } 
  });
  
  const thisMonth = new Date();
  thisMonth.setDate(thisMonth.getDate() - 30);
  const monthMessages = await this.countDocuments({ 
    createdAt: { $gte: thisMonth } 
  });
  
  return {
    total: totalMessages,
    today: todayMessages,
    thisWeek: weekMessages,
    thisMonth: monthMessages
  };
};

// Static method to find messages by status
contactMessageSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to find messages by category
contactMessageSchema.statics.findByCategory = function(category) {
  return this.find({ category }).sort({ createdAt: -1 });
};

// Static method to find overdue messages
contactMessageSchema.statics.findOverdue = function() {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  return this.find({
    status: 'unread',
    createdAt: { $lt: oneDayAgo }
  }).sort({ createdAt: 1 });
};

// Static method to find high priority messages
contactMessageSchema.statics.findHighPriority = function() {
  return this.find({
    priority: { $in: ['high', 'urgent'] },
    status: { $in: ['unread', 'read', 'in_progress'] }
  }).sort({ priority: -1, createdAt: -1 });
};

// Static method to get enhanced statistics
contactMessageSchema.statics.getEnhancedStats = async function() {
  const [
    statusStats,
    categoryStats,
    priorityStats,
    overdueCount,
    avgResponseTime
  ] = await Promise.all([
    // Status distribution
    this.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),
    // Category distribution
    this.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]),
    // Priority distribution
    this.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]),
    // Overdue messages count
    this.countDocuments({
      status: 'unread',
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }),
    // Average response time
    this.aggregate([
      {
        $match: {
          responseTime: { $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ])
  ]);

  // Process aggregation results
  const statusDistribution = {};
  statusStats.forEach(stat => {
    statusDistribution[stat._id] = stat.count;
  });

  const categoryDistribution = {};
  categoryStats.forEach(stat => {
    categoryDistribution[stat._id] = stat.count;
  });

  const priorityDistribution = {};
  priorityStats.forEach(stat => {
    priorityDistribution[stat._id] = stat.count;
  });

  return {
    overdue: overdueCount,
    averageResponseTime: avgResponseTime[0]?.avgResponseTime || 0,
    distribution: {
      status: statusDistribution,
      category: categoryDistribution,
      priority: priorityDistribution
    }
  };
};

// Instance method to check if message is recent (within last 24 hours)
contactMessageSchema.methods.isRecent = function() {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  return this.createdAt >= oneDayAgo;
};

// Instance method to mark as read
contactMessageSchema.methods.markAsRead = function() {
  if (this.status === 'unread') {
    this.status = 'read';
    if (!this.responseTime) {
      this.responseTime = Math.round((new Date() - this.createdAt) / (1000 * 60 * 60));
    }
  }
  return this.save();
};

// Instance method to mark as in progress
contactMessageSchema.methods.markAsInProgress = function(assignedTo = null) {
  this.status = 'in_progress';
  if (assignedTo) {
    this.assignedTo = assignedTo;
  }
  if (!this.responseTime) {
    this.responseTime = Math.round((new Date() - this.createdAt) / (1000 * 60 * 60));
  }
  return this.save();
};

// Instance method to mark as resolved
contactMessageSchema.methods.markAsResolved = function(notes = '') {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  if (notes) {
    this.notes = notes;
  }
  if (!this.responseTime) {
    this.responseTime = Math.round((new Date() - this.createdAt) / (1000 * 60 * 60));
  }
  return this.save();
};

// Instance method to archive message
contactMessageSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Pre-save middleware to sanitize input
contactMessageSchema.pre('save', function(next) {
  // Trim whitespace and normalize name
  if (this.name) {
    this.name = this.name.trim();
  }
  
  // Ensure email is lowercase
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  
  // Trim message
  if (this.message) {
    this.message = this.message.trim();
  }
  
  next();
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
