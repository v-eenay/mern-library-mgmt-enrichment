import { Link } from 'react-router-dom'
import { Home, ArrowLeft, BookOpen } from 'lucide-react'

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative">
            <div className="text-9xl font-bold text-gray-200 select-none">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="h-24 w-24 text-primary-400" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. 
          It might have been moved, deleted, or you entered the wrong URL.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => window.history.back()}
            className="btn btn-outline flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
          
          <Link
            to="/"
            className="btn btn-primary flex items-center space-x-2"
          >
            <Home className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            You might be looking for:
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              to="/books"
              className="text-primary-600 hover:text-primary-500 hover:underline"
            >
              Browse Books
            </Link>
            <Link
              to="/dashboard"
              className="text-primary-600 hover:text-primary-500 hover:underline"
            >
              Dashboard
            </Link>
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-500 hover:underline"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-primary-600 hover:text-primary-500 hover:underline"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage