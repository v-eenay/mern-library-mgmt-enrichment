const { User } = require('../models');
const { generateToken } = require('../utils/helpers');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} User data and token
   */
  static async registerUser(userData) {
    const { name, email, password, role = 'borrower' } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  /**
   * Authenticate user login
   * @param {Object} credentials - Login credentials
   * @returns {Object} User data and token
   */
  static async loginUser(credentials) {
    const { email, password } = credentials;

    // Find user with password
    const user = await User.findByEmailWithPassword(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = generateToken(user._id);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  /**
   * Update user profile
   * @param {Object} user - Current user object
   * @param {Object} updateData - Profile update data
   * @returns {Object} Updated user data
   */
  static async updateUserProfile(user, updateData) {
    const { name, email } = updateData;

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('Email already exists');
      }
      user.email = email;
    }

    if (name) user.name = name;

    await user.save();

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  /**
   * Change user password
   * @param {Object} user - Current user object
   * @param {Object} passwordData - Password change data
   * @returns {void}
   */
  static async changeUserPassword(user, passwordData) {
    const { currentPassword, newPassword } = passwordData;

    // Get user with password
    const userWithPassword = await User.findByEmailWithPassword(user.email);

    // Verify current password
    const isCurrentPasswordValid = await userWithPassword.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    userWithPassword.password = newPassword;
    await userWithPassword.save();
  }

  /**
   * Get user profile data
   * @param {Object} user - Current user object
   * @returns {Object} User profile data
   */
  static getUserProfile(user) {
    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    };
  }
}

module.exports = AuthService;
