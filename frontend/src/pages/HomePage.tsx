import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { 
  BookOpen, 
  Users, 
  Clock, 
  Shield, 
  Star,
  TrendingUp,
  Award,
  ArrowRight
} from 'lucide-react'

const HomePage = () => {
  const { isAuthenticated } = useAuth()

  const features = [
    {
      icon: BookOpen,
      title: 'Comprehensive Catalog',
      description: 'Manage thousands of books with advanced search, categorization, and availability tracking.'
    },
    {
      icon: Users,
      title: 'User Management',
      description: 'Role-based access control for borrowers, librarians, and administrators with detailed profiles.'
    },
    {
      icon: Clock,
      title: 'Smart Borrowing',
      description: 'Automated due date tracking, renewal system, and overdue notifications to keep everything organized.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Built with modern security practices, data encryption, and reliable backup systems.'
    }
  ]

  const stats = [
    { label: 'Books Managed', value: '50,000+', icon: BookOpen },
    { label: 'Active Users', value: '10,000+', icon: Users },
    { label: 'Libraries Served', value: '500+', icon: Award },
    { label: 'Uptime', value: '99.9%', icon: TrendingUp }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Modern Library
              <span className="block text-primary-200">Management</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto leading-relaxed">
              Streamline your library operations with our comprehensive management system. 
              From cataloging to user management, we've got everything covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold flex items-center space-x-2"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/books"
                    className="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
                  >
                    Browse Books
                  </Link>
                  <Link
                    to="/register"
                    className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 text-lg font-semibold"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary-500 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-primary-400 rounded-full opacity-20 blur-3xl"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary-100 p-3 rounded-full">
                    <stat.icon className="h-8 w-8 text-primary-600" />
                  </div>
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed specifically for modern library management, 
              making operations efficient and user-friendly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 p-3 rounded-lg flex-shrink-0">
                    <feature.icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Credentials Section */}
      {!isAuthenticated && (
        <section className="py-16 bg-primary-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Try Our Demo
            </h2>
            <p className="text-gray-600 mb-8">
              Experience the full functionality with our demo accounts
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Admin</h3>
                <p className="text-sm text-gray-600 mb-3">Full system access</p>
                <div className="text-xs bg-gray-50 p-3 rounded font-mono">
                  <div>admin@library.com</div>
                  <div>admin123</div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Librarian</h3>
                <p className="text-sm text-gray-600 mb-3">Manage books & users</p>
                <div className="text-xs bg-gray-50 p-3 rounded font-mono">
                  <div>librarian@library.com</div>
                  <div>librarian123</div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Borrower</h3>
                <p className="text-sm text-gray-600 mb-3">Browse & borrow books</p>
                <div className="text-xs bg-gray-50 p-3 rounded font-mono">
                  <div>borrower@library.com</div>
                  <div>borrower123</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform Your Library?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join thousands of libraries worldwide that trust our system for their daily operations.
          </p>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="btn bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 text-lg font-semibold inline-flex items-center space-x-2"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}

export default HomePage