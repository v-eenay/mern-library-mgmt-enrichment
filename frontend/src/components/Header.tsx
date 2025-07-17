import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { 
  BookOpen, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Home,
  Search,
  Settings,
  Users,
  BarChart3,
  BookPlus,
  History
} from 'lucide-react'
import { useState } from 'react'

const Header = () => {
  const { user, logout, isAuthenticated, isLibrarian } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const NavLink = ({ to, children, icon: Icon, onClick }: { 
    to: string
    children: React.ReactNode
    icon?: any
    onClick?: () => void
  }) => (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive(to)
          ? 'bg-primary-100 text-primary-700'
          : 'text-gray-700 hover:text-primary-600 hover:bg-gray-100'
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{children}</span>
    </Link>
  )

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">LibraryMS</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink to="/" icon={Home}>Home</NavLink>
            <NavLink to="/books" icon={Search}>Books</NavLink>
            
            {isAuthenticated && (
              <>
                <NavLink to="/dashboard" icon={BarChart3}>Dashboard</NavLink>
                <NavLink to="/my-borrows" icon={BookOpen}>My Borrows</NavLink>
                <NavLink to="/my-reviews" icon={History}>My Reviews</NavLink>
                
                {isLibrarian && (
                  <>
                    <NavLink to="/books/add" icon={BookPlus}>Add Book</NavLink>
                    <NavLink to="/admin/users" icon={Users}>Users</NavLink>
                  </>
                )}
              </>
            )}
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="font-medium">{user?.name}</span>
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                    {user?.role}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-fade-in">
            <div className="flex flex-col space-y-2">
              <NavLink to="/" icon={Home} onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </NavLink>
              <NavLink to="/books" icon={Search} onClick={() => setIsMobileMenuOpen(false)}>
                Books
              </NavLink>
              
              {isAuthenticated && (
                <>
                  <NavLink to="/dashboard" icon={BarChart3} onClick={() => setIsMobileMenuOpen(false)}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/my-borrows" icon={BookOpen} onClick={() => setIsMobileMenuOpen(false)}>
                    My Borrows
                  </NavLink>
                  <NavLink to="/my-reviews" icon={History} onClick={() => setIsMobileMenuOpen(false)}>
                    My Reviews
                  </NavLink>
                  
                  {isLibrarian && (
                    <>
                      <NavLink to="/books/add" icon={BookPlus} onClick={() => setIsMobileMenuOpen(false)}>
                        Add Book
                      </NavLink>
                      <NavLink to="/admin/users" icon={Users} onClick={() => setIsMobileMenuOpen(false)}>
                        Users
                      </NavLink>
                    </>
                  )}
                </>
              )}
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                {isAuthenticated ? (
                  <div className="flex flex-col space-y-2">
                    <NavLink to="/profile" icon={Settings} onClick={() => setIsMobileMenuOpen(false)}>
                      Profile ({user?.name})
                    </NavLink>
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                      className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-red-600 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <NavLink to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      Login
                    </NavLink>
                    <NavLink to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                      Register
                    </NavLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header