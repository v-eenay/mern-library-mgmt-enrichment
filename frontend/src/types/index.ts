// User Types
export interface User {
  _id: string
  name: string
  email: string
  role: 'borrower' | 'librarian' | 'admin'
  profilePicture?: string
  createdAt: string
  updatedAt: string
}

// Book Types
export interface Book {
  _id: string
  title: string
  author: string
  isbn: string
  category: string
  description?: string
  quantity: number
  available: number
  coverImage?: string
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  createdAt: string
  updatedAt: string
}

// Borrow Types
export interface Borrow {
  _id: string
  userId: string | User
  bookId: string | Book
  borrowDate: string
  dueDate: string
  returnDate?: string
  status: 'active' | 'returned' | 'overdue'
  createdAt: string
  updatedAt: string
}

// Category Types
export interface Category {
  _id: string
  name: string
  createdAt: string
  updatedAt: string
}

// Review Types
export interface Review {
  _id: string
  userId: string | User
  bookId: string | Book
  rating: number
  comment?: string
  createdAt: string
  updatedAt: string
}

// API Response Types
export interface AuthResponse {
  status: string
  message: string
  data: {
    user: User
    token: string
  }
}

export interface ApiResponse<T = any> {
  status: string
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  status: string
  message: string
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Search and Filter Types
export interface BookSearchParams {
  q?: string
  title?: string
  author?: string
  isbn?: string
  category?: string
  available?: boolean
  minQuantity?: number
  maxQuantity?: number
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface PaginationParams {
  page?: number
  limit?: number
}

// Form Types
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface BookFormData {
  title: string
  author: string
  isbn: string
  category: string
  description?: string
  quantity: number
  coverImage?: string
}

export interface ReviewFormData {
  rating: number
  comment?: string
}

export interface ProfileFormData {
  name: string
  email: string
}

export interface ChangePasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Statistics Types
export interface DashboardStats {
  totalBooks: number
  totalUsers: number
  activeBorrows: number
  overdueBorrows: number
  totalCategories: number
  newBooksThisMonth: number
  newUsersThisMonth: number
  popularBooks: Book[]
  recentReviews: Review[]
}

export interface UserStats {
  totalBorrows: number
  activeBorrows: number
  overdueBorrows: number
  returnedBorrows: number
  totalReviews: number
  favoriteCategories: string[]
}

// Error Types
export interface ApiError {
  status: string
  message: string
  code?: string
  errors?: Record<string, string[]>
}

// Notification Types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
}