import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import BooksPage from './pages/books/BooksPage'
import BookDetailsPage from './pages/books/BookDetailsPage'
import AddBookPage from './pages/books/AddBookPage'
import EditBookPage from './pages/books/EditBookPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ProfilePage from './pages/profile/ProfilePage'
import MyBorrowsPage from './pages/borrows/MyBorrowsPage'
import BorrowHistoryPage from './pages/borrows/BorrowHistoryPage'
import MyReviewsPage from './pages/reviews/MyReviewsPage'
import UsersPage from './pages/admin/UsersPage'
import CategoriesPage from './pages/admin/CategoriesPage'
import AllBorrowsPage from './pages/admin/AllBorrowsPage'
import OverdueBorrowsPage from './pages/admin/OverdueBorrowsPage'
import ProtectedRoute from './components/ProtectedRoute'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="books" element={<BooksPage />} />
        <Route path="books/:id" element={<BookDetailsPage />} />
        
        {/* Protected Routes - All Users */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        
        {/* Protected Routes - Borrowers */}
        <Route
          path="my-borrows"
          element={
            <ProtectedRoute>
              <MyBorrowsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="borrow-history"
          element={
            <ProtectedRoute>
              <BorrowHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-reviews"
          element={
            <ProtectedRoute>
              <MyReviewsPage />
            </ProtectedRoute>
          }
        />
        
        {/* Protected Routes - Librarians & Admins */}
        <Route
          path="books/add"
          element={
            <ProtectedRoute requiredRole="librarian">
              <AddBookPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="books/:id/edit"
          element={
            <ProtectedRoute requiredRole="librarian">
              <EditBookPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute requiredRole="librarian">
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/categories"
          element={
            <ProtectedRoute requiredRole="librarian">
              <CategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/borrows"
          element={
            <ProtectedRoute requiredRole="librarian">
              <AllBorrowsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/overdue"
          element={
            <ProtectedRoute requiredRole="librarian">
              <OverdueBorrowsPage />
            </ProtectedRoute>
          }
        />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App