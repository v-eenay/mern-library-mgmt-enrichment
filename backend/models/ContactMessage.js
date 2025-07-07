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
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters long'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
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

// Compound index for searching by email and date
contactMessageSchema.index({ email: 1, createdAt: -1 });

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

// Instance method to check if message is recent (within last 24 hours)
contactMessageSchema.methods.isRecent = function() {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  return this.createdAt >= oneDayAgo;
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
