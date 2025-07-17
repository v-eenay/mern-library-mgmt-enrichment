import axios from 'axios'
import type {
  AuthResponse,
  ApiResponse,
  PaginatedResponse,
  Book,
  User,
  Borrow,
  Category,
  Review,
  BookSearchParams,
  PaginationParams,
  LoginFormData,
  RegisterFormData,
  BookFormData,
  ReviewFormData,
  ProfileFormData,
  ChangePasswordFormData
} from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookie-based auth
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (data: LoginFormData) =>
    api.post<AuthResponse>('/auth/login', data),
  
  register: (data: RegisterFormData) =>
    api.post<AuthResponse>('/auth/register', {
      name: data.name,
      email: data.email,
      password: data.password
    }),
  
  logout: () => api.post('/auth/logout'),
  
  getProfile: () =>
    api.get<ApiResponse<{ user: User }>>('/auth/profile'),
  
  updateProfile: (data: ProfileFormData) =>
    api.put<ApiResponse<{ user: User }>>('/auth/profile', data),
  
  changePassword: (data: ChangePasswordFormData) =>
    api.put<ApiResponse<null>>('/auth/change-password', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    }),
  
  verifyToken: () =>
    api.get<ApiResponse<{ user: User }>>('/auth/verify'),
}

// Books API
export const booksApi = {
  getBooks: (params?: BookSearchParams) =>
    api.get<PaginatedResponse<Book>>('/books', { params }),
  
  getBook: (id: string) =>
    api.get<ApiResponse<{ book: Book }>>(`/books/${id}`),
  
  createBook: (data: BookFormData) =>
    api.post<ApiResponse<{ book: Book }>>('/books', data),
  
  updateBook: (id: string, data: BookFormData) =>
    api.put<ApiResponse<{ book: Book }>>(`/books/${id}`, data),
  
  deleteBook: (id: string) =>
    api.delete<ApiResponse<null>>(`/books/${id}`),
  
  getAvailableBooks: () =>
    api.get<ApiResponse<{ books: Book[]; count: number }>>('/books/available/list'),
  
  getBooksByCategory: (category: string) =>
    api.get<ApiResponse<{ books: Book[]; category: string; count: number }>>(`/books/category/${category}`),
  
  advancedSearch: (params: BookSearchParams) =>
    api.get<PaginatedResponse<Book>>('/books/search/advanced', { params }),
  
  uploadCover: (id: string, file: File) => {
    const formData = new FormData()
    formData.append('coverImage', file)
    return api.post<ApiResponse<{ book: Book; coverUrl: string }>>(`/books/${id}/upload-cover`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}

// Users API
export const usersApi = {
  getUsers: (params?: PaginationParams & { search?: string; role?: string }) =>
    api.get<ApiResponse<{ users: User[]; pagination?: any }>>('/users', { params }),
  
  getUser: (id: string) =>
    api.get<ApiResponse<{ user: User }>>(`/users/${id}`),
  
  createUser: (data: RegisterFormData) =>
    api.post<ApiResponse<{ user: User }>>('/users', {
      name: data.name,
      email: data.email,
      password: data.password
    }),
  
  updateUser: (id: string, data: ProfileFormData) =>
    api.put<ApiResponse<{ user: User }>>(`/users/${id}`, data),
  
  deleteUser: (id: string) =>
    api.delete<ApiResponse<null>>(`/users/${id}`),
  
  getUserStats: () =>
    api.get<ApiResponse<any>>('/users/stats/overview'),
  
  uploadProfilePicture: (file: File) => {
    const formData = new FormData()
    formData.append('profilePicture', file)
    return api.post<ApiResponse<{ user: User }>>('/users/upload-profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}

// Borrows API
export const borrowsApi = {
  borrowBook: (bookId: string) =>
    api.post<ApiResponse<{ borrow: Borrow }>>('/borrows', { bookId }),
  
  returnBook: (borrowId: string) =>
    api.put<ApiResponse<{ borrow: Borrow }>>(`/borrows/${borrowId}/return`),
  
  extendDueDate: (borrowId: string, days: number) =>
    api.put<ApiResponse<{ borrow: Borrow; newDueDate: string }>>(`/borrows/${borrowId}/extend`, { days }),
  
  getMyBorrows: (params?: PaginationParams) =>
    api.get<ApiResponse<{ borrows: Borrow[]; pagination?: any }>>('/borrows/my-borrows', { params }),
  
  getMyOverdueBorrows: () =>
    api.get<ApiResponse<{ borrows: Borrow[]; count: number }>>('/borrows/my-overdue'),
  
  getAllBorrows: (params?: PaginationParams) =>
    api.get<ApiResponse<{ borrows: Borrow[]; pagination?: any }>>('/borrows', { params }),
  
  getOverdueBorrows: (params?: PaginationParams) =>
    api.get<ApiResponse<{ borrows: Borrow[]; pagination?: any }>>('/borrows/overdue', { params }),
  
  getBorrowStats: () =>
    api.get<ApiResponse<any>>('/borrows/stats/overview'),
  
  updateOverdueStatuses: () =>
    api.post<ApiResponse<{ updatedCount: number }>>('/borrows/update-overdue'),
  
  getActiveBorrowsByBook: (bookId: string) =>
    api.get<ApiResponse<{ borrows: Borrow[] }>>(`/borrows/book/${bookId}/active`),
  
  getBorrowById: (id: string) =>
    api.get<ApiResponse<{ borrow: Borrow }>>(`/borrows/${id}`),
}

// Categories API
export const categoriesApi = {
  getCategories: () =>
    api.get<ApiResponse<{ categories: Category[] }>>('/categories'),
  
  getCategory: (id: string) =>
    api.get<ApiResponse<{ category: Category }>>(`/categories/${id}`),
  
  createCategory: (name: string) =>
    api.post<ApiResponse<{ category: Category }>>('/categories', { name }),
  
  updateCategory: (id: string, name: string) =>
    api.put<ApiResponse<{ category: Category }>>(`/categories/${id}`, { name }),
  
  deleteCategory: (id: string) =>
    api.delete<ApiResponse<null>>(`/categories/${id}`),
  
  getCategoryStats: () =>
    api.get<ApiResponse<any>>('/categories/stats/overview'),
  
  getBooksByCategory: (id: string, params?: PaginationParams) =>
    api.get<ApiResponse<{ books: Book[]; category: Category; pagination?: any }>>(`/categories/${id}/books`, { params }),
}

// Reviews API
export const reviewsApi = {
  createReview: (bookId: string, data: ReviewFormData) =>
    api.post<ApiResponse<{ review: Review }>>('/reviews', { bookId, ...data }),
  
  getMyReviews: (params?: PaginationParams) =>
    api.get<ApiResponse<{ reviews: Review[]; pagination?: any }>>('/reviews/my-reviews', { params }),
  
  getAllReviews: (params?: PaginationParams) =>
    api.get<ApiResponse<{ reviews: Review[]; pagination?: any }>>('/reviews', { params }),
  
  getBookReviews: (bookId: string, params?: PaginationParams) =>
    api.get<ApiResponse<{ reviews: Review[]; pagination?: any }>>(`/reviews/book/${bookId}`, { params }),
  
  getUserReviews: (userId: string, params?: PaginationParams) =>
    api.get<ApiResponse<{ reviews: Review[]; pagination?: any }>>(`/reviews/user/${userId}`, { params }),
  
  getReview: (id: string) =>
    api.get<ApiResponse<{ review: Review }>>(`/reviews/${id}`),
  
  updateReview: (id: string, data: ReviewFormData) =>
    api.put<ApiResponse<{ review: Review }>>(`/reviews/${id}`, data),
  
  deleteReview: (id: string) =>
    api.delete<ApiResponse<null>>(`/reviews/${id}`),
  
  getRecentReviews: () =>
    api.get<ApiResponse<{ reviews: Review[] }>>('/reviews/recent/list'),
  
  getTopRatedBooks: () =>
    api.get<ApiResponse<{ books: Book[] }>>('/reviews/top-rated/books'),
  
  getReviewAnalytics: () =>
    api.get<ApiResponse<any>>('/reviews/analytics/overview'),
}

export default api