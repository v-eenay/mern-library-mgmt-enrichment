/**
 * Role-Based Access Control (RBAC) Service
 * Provides comprehensive authorization and permission management
 */

// Define all available permissions in the system
const PERMISSIONS = {
  // User Management
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_READ_ALL: 'user:read:all',
  USER_UPDATE_ROLE: 'user:update:role',
  
  // Profile Management
  PROFILE_READ_OWN: 'profile:read:own',
  PROFILE_UPDATE_OWN: 'profile:update:own',
  PROFILE_READ_ANY: 'profile:read:any',
  PROFILE_UPDATE_ANY: 'profile:update:any',
  
  // Book Management
  BOOK_READ: 'book:read',
  BOOK_CREATE: 'book:create',
  BOOK_UPDATE: 'book:update',
  BOOK_DELETE: 'book:delete',
  BOOK_UPLOAD_COVER: 'book:upload:cover',
  BOOK_BULK_IMPORT: 'book:bulk:import',
  BOOK_CLEANUP_IMAGES: 'book:cleanup:images',
  
  // Borrowing Management
  BORROW_CREATE: 'borrow:create',
  BORROW_READ_OWN: 'borrow:read:own',
  BORROW_READ_ALL: 'borrow:read:all',
  BORROW_UPDATE_OWN: 'borrow:update:own',
  BORROW_UPDATE_ANY: 'borrow:update:any',
  BORROW_EXTEND: 'borrow:extend',
  BORROW_RETURN: 'borrow:return',
  BORROW_STATS: 'borrow:stats',
  BORROW_OVERDUE_MANAGE: 'borrow:overdue:manage',
  
  // Review Management
  REVIEW_CREATE: 'review:create',
  REVIEW_READ: 'review:read',
  REVIEW_UPDATE_OWN: 'review:update:own',
  REVIEW_UPDATE_ANY: 'review:update:any',
  REVIEW_DELETE_OWN: 'review:delete:own',
  REVIEW_DELETE_ANY: 'review:delete:any',
  REVIEW_ANALYTICS: 'review:analytics',
  
  // Category Management
  CATEGORY_READ: 'category:read',
  CATEGORY_CREATE: 'category:create',
  CATEGORY_UPDATE: 'category:update',
  CATEGORY_DELETE: 'category:delete',
  CATEGORY_STATS: 'category:stats',
  
  // Contact Management
  CONTACT_CREATE: 'contact:create',
  CONTACT_READ_ALL: 'contact:read:all',
  CONTACT_UPDATE: 'contact:update',
  CONTACT_DELETE: 'contact:delete',
  
  // System Administration
  SYSTEM_STATS: 'system:stats',
  SYSTEM_SECURITY_MONITOR: 'system:security:monitor',
  SYSTEM_AUDIT_LOG: 'system:audit:log',
  SYSTEM_BULK_OPERATIONS: 'system:bulk:operations',
  SYSTEM_MAINTENANCE: 'system:maintenance',
  
  // File Management
  FILE_UPLOAD_PROFILE: 'file:upload:profile',
  FILE_UPLOAD_BOOK_COVER: 'file:upload:book:cover',
  FILE_DELETE_OWN: 'file:delete:own',
  FILE_DELETE_ANY: 'file:delete:any'
};

// Define role hierarchy and permissions
const ROLES = {
  borrower: {
    name: 'Borrower',
    level: 1,
    permissions: [
      // Profile management
      PERMISSIONS.PROFILE_READ_OWN,
      PERMISSIONS.PROFILE_UPDATE_OWN,
      
      // Book browsing
      PERMISSIONS.BOOK_READ,
      
      // Borrowing
      PERMISSIONS.BORROW_CREATE,
      PERMISSIONS.BORROW_READ_OWN,
      PERMISSIONS.BORROW_UPDATE_OWN,
      PERMISSIONS.BORROW_EXTEND,
      PERMISSIONS.BORROW_RETURN,
      
      // Reviews
      PERMISSIONS.REVIEW_CREATE,
      PERMISSIONS.REVIEW_READ,
      PERMISSIONS.REVIEW_UPDATE_OWN,
      PERMISSIONS.REVIEW_DELETE_OWN,
      
      // Categories
      PERMISSIONS.CATEGORY_READ,
      
      // Contact
      PERMISSIONS.CONTACT_CREATE,
      
      // File uploads
      PERMISSIONS.FILE_UPLOAD_PROFILE,
      PERMISSIONS.FILE_DELETE_OWN
    ]
  },
  
  librarian: {
    name: 'Librarian',
    level: 2,
    permissions: [
      // All borrower permissions
      ...this?.borrower?.permissions || [],
      
      // Enhanced user management
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_READ_ALL,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.PROFILE_READ_ANY,
      PERMISSIONS.PROFILE_UPDATE_ANY,
      
      // Full book management
      PERMISSIONS.BOOK_CREATE,
      PERMISSIONS.BOOK_UPDATE,
      PERMISSIONS.BOOK_DELETE,
      PERMISSIONS.BOOK_UPLOAD_COVER,
      PERMISSIONS.BOOK_CLEANUP_IMAGES,
      
      // Advanced borrowing management
      PERMISSIONS.BORROW_READ_ALL,
      PERMISSIONS.BORROW_UPDATE_ANY,
      PERMISSIONS.BORROW_STATS,
      PERMISSIONS.BORROW_OVERDUE_MANAGE,
      
      // Review management
      PERMISSIONS.REVIEW_UPDATE_ANY,
      PERMISSIONS.REVIEW_DELETE_ANY,
      PERMISSIONS.REVIEW_ANALYTICS,
      
      // Category management
      PERMISSIONS.CATEGORY_CREATE,
      PERMISSIONS.CATEGORY_UPDATE,
      PERMISSIONS.CATEGORY_DELETE,
      PERMISSIONS.CATEGORY_STATS,
      
      // Contact management
      PERMISSIONS.CONTACT_READ_ALL,
      PERMISSIONS.CONTACT_UPDATE,
      PERMISSIONS.CONTACT_DELETE,
      
      // System access
      PERMISSIONS.SYSTEM_STATS,
      PERMISSIONS.SYSTEM_AUDIT_LOG,
      
      // File management
      PERMISSIONS.FILE_UPLOAD_BOOK_COVER,
      PERMISSIONS.FILE_DELETE_ANY
    ]
  },
  
  admin: {
    name: 'Administrator',
    level: 3,
    permissions: [
      // All librarian permissions
      ...this?.librarian?.permissions || [],
      
      // Advanced user management
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_DELETE,
      PERMISSIONS.USER_UPDATE_ROLE,
      
      // Advanced book management
      PERMISSIONS.BOOK_BULK_IMPORT,
      
      // System administration
      PERMISSIONS.SYSTEM_SECURITY_MONITOR,
      PERMISSIONS.SYSTEM_BULK_OPERATIONS,
      PERMISSIONS.SYSTEM_MAINTENANCE
    ]
  }
};

// Fix circular reference by properly setting permissions after role definitions
ROLES.librarian.permissions = [
  ...ROLES.borrower.permissions,
  PERMISSIONS.USER_READ,
  PERMISSIONS.USER_READ_ALL,
  PERMISSIONS.USER_UPDATE,
  PERMISSIONS.PROFILE_READ_ANY,
  PERMISSIONS.PROFILE_UPDATE_ANY,
  PERMISSIONS.BOOK_CREATE,
  PERMISSIONS.BOOK_UPDATE,
  PERMISSIONS.BOOK_DELETE,
  PERMISSIONS.BOOK_UPLOAD_COVER,
  PERMISSIONS.BOOK_CLEANUP_IMAGES,
  PERMISSIONS.BORROW_READ_ALL,
  PERMISSIONS.BORROW_UPDATE_ANY,
  PERMISSIONS.BORROW_STATS,
  PERMISSIONS.BORROW_OVERDUE_MANAGE,
  PERMISSIONS.REVIEW_UPDATE_ANY,
  PERMISSIONS.REVIEW_DELETE_ANY,
  PERMISSIONS.REVIEW_ANALYTICS,
  PERMISSIONS.CATEGORY_CREATE,
  PERMISSIONS.CATEGORY_UPDATE,
  PERMISSIONS.CATEGORY_DELETE,
  PERMISSIONS.CATEGORY_STATS,
  PERMISSIONS.CONTACT_READ_ALL,
  PERMISSIONS.CONTACT_UPDATE,
  PERMISSIONS.CONTACT_DELETE,
  PERMISSIONS.SYSTEM_STATS,
  PERMISSIONS.SYSTEM_AUDIT_LOG,
  PERMISSIONS.FILE_UPLOAD_BOOK_COVER,
  PERMISSIONS.FILE_DELETE_ANY
];

ROLES.admin.permissions = [
  ...ROLES.librarian.permissions,
  PERMISSIONS.USER_CREATE,
  PERMISSIONS.USER_DELETE,
  PERMISSIONS.USER_UPDATE_ROLE,
  PERMISSIONS.BOOK_BULK_IMPORT,
  PERMISSIONS.SYSTEM_SECURITY_MONITOR,
  PERMISSIONS.SYSTEM_BULK_OPERATIONS,
  PERMISSIONS.SYSTEM_MAINTENANCE
];

class RBACService {
  constructor() {
    this.permissions = PERMISSIONS;
    this.roles = ROLES;
  }

  /**
   * Check if a user has a specific permission
   * @param {Object} user - User object with role
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  hasPermission(user, permission) {
    if (!user || !user.role) {
      return false;
    }

    const role = this.roles[user.role];
    if (!role) {
      return false;
    }

    return role.permissions.includes(permission);
  }

  /**
   * Check if a user has any of the specified permissions
   * @param {Object} user - User object with role
   * @param {Array} permissions - Array of permissions to check
   * @returns {boolean} True if user has any of the permissions
   */
  hasAnyPermission(user, permissions) {
    return permissions.some(permission => this.hasPermission(user, permission));
  }

  /**
   * Check if a user has all of the specified permissions
   * @param {Object} user - User object with role
   * @param {Array} permissions - Array of permissions to check
   * @returns {boolean} True if user has all permissions
   */
  hasAllPermissions(user, permissions) {
    return permissions.every(permission => this.hasPermission(user, permission));
  }

  /**
   * Check if a user can access a resource they own
   * @param {Object} user - User object
   * @param {Object} resource - Resource object with userId field
   * @param {string} ownPermission - Permission for own resource
   * @param {string} anyPermission - Permission for any resource
   * @returns {boolean} True if user can access the resource
   */
  canAccessResource(user, resource, ownPermission, anyPermission = null) {
    if (!user || !resource) {
      return false;
    }

    // Check if user has permission to access any resource of this type
    if (anyPermission && this.hasPermission(user, anyPermission)) {
      return true;
    }

    // Check if user owns the resource and has permission for own resources
    if (ownPermission && this.hasPermission(user, ownPermission)) {
      const resourceUserId = resource.userId || resource.user || resource._id;
      return resourceUserId && resourceUserId.toString() === user._id.toString();
    }

    return false;
  }

  /**
   * Check if a user has a higher or equal role level than another user
   * @param {Object} user1 - First user
   * @param {Object} user2 - Second user
   * @returns {boolean} True if user1 has higher or equal role level
   */
  hasHigherOrEqualRole(user1, user2) {
    if (!user1 || !user2) {
      return false;
    }

    const role1 = this.roles[user1.role];
    const role2 = this.roles[user2.role];

    if (!role1 || !role2) {
      return false;
    }

    return role1.level >= role2.level;
  }

  /**
   * Get all permissions for a role
   * @param {string} roleName - Role name
   * @returns {Array} Array of permissions
   */
  getRolePermissions(roleName) {
    const role = this.roles[roleName];
    return role ? role.permissions : [];
  }

  /**
   * Get user's effective permissions
   * @param {Object} user - User object
   * @returns {Array} Array of permissions
   */
  getUserPermissions(user) {
    if (!user || !user.role) {
      return [];
    }

    return this.getRolePermissions(user.role);
  }

  /**
   * Check if a role exists
   * @param {string} roleName - Role name to check
   * @returns {boolean} True if role exists
   */
  isValidRole(roleName) {
    return Object.keys(this.roles).includes(roleName);
  }

  /**
   * Get all available roles
   * @returns {Object} Object containing all roles
   */
  getAllRoles() {
    return this.roles;
  }

  /**
   * Get all available permissions
   * @returns {Object} Object containing all permissions
   */
  getAllPermissions() {
    return this.permissions;
  }
}

// Export singleton instance and constants
module.exports = {
  rbacService: new RBACService(),
  PERMISSIONS,
  ROLES
};
