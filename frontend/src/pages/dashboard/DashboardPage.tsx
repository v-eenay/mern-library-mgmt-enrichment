import { useAuth } from '@/contexts/AuthContext'
import {
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Star
} from 'lucide-react'

const DashboardPage = () => {
  const { user, isLibrarian } = useAuth()

  // Static data for librarian dashboard
  const borrowStats = {
    totalBooks: 1247,
    activeBorrows: 89,
    overdueBorrows: 12,
    newBooksThisMonth: 23,
    popularCategory: 'Fiction'
  }

  const userStats = {
    totalUsers: 456,
    newUsersThisMonth: 18,
    activeBorrowers: 234
  }

  // Static data for borrower dashboard
  const myBorrows = [
    {
      _id: '1',
      bookId: {
        _id: '1',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=687&auto=format&fit=crop'
      },
      borrowDate: '2024-01-15T00:00:00.000Z',
      dueDate: '2024-02-15T00:00:00.000Z',
      status: 'active'
    },
    {
      _id: '2',
      bookId: {
        _id: '2',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=687&auto=format&fit=crop'
      },
      borrowDate: '2023-12-20T00:00:00.000Z',
      dueDate: '2024-01-10T00:00:00.000Z',
      status: 'overdue'
    },
    {
      _id: '3',
      bookId: {
        _id: '3',
        title: 'Sapiens',
        author: 'Yuval Noah Harari',
        coverImage: 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=1476&auto=format&fit=crop'
      },
      borrowDate: '2023-11-01T00:00:00.000Z',
      dueDate: '2023-12-01T00:00:00.000Z',
      status: 'returned'
    }
  ]

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'blue',
    subtitle 
  }: {
    title: string
    value: string | number
    icon: any
    color?: 'blue' | 'green' | 'yellow' | 'red'
    subtitle?: string
  }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600'
    }

    return (
      <div className="card">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    )
  }



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          {isLibrarian 
            ? 'Here\'s an overview of your library system'
            : 'Manage your borrowed books and discover new ones'
          }
        </p>
      </div>

      {isLibrarian ? (
        /* Librarian Dashboard */
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Books"
              value={borrowStats?.totalBooks || 0}
              icon={BookOpen}
              color="blue"
            />
            <StatCard
              title="Total Users"
              value={userStats?.totalUsers || 0}
              icon={Users}
              color="green"
            />
            <StatCard
              title="Active Borrows"
              value={borrowStats?.activeBorrows || 0}
              icon={Clock}
              color="yellow"
            />
            <StatCard
              title="Overdue Books"
              value={borrowStats?.overdueBorrows || 0}
              icon={AlertCircle}
              color="red"
            />
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="/books/add" className="btn btn-primary">
                Add New Book
              </a>
              <a href="/admin/users" className="btn btn-outline">
                Manage Users
              </a>
              <a href="/admin/overdue" className="btn btn-outline">
                View Overdue Books
              </a>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">System Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">User Statistics</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>New users this month:</span>
                    <span className="font-medium">{userStats?.newUsersThisMonth || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active borrowers:</span>
                    <span className="font-medium">{userStats?.activeBorrowers || 0}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Book Statistics</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Books added this month:</span>
                    <span className="font-medium">{borrowStats?.newBooksThisMonth || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Most popular category:</span>
                    <span className="font-medium">{borrowStats?.popularCategory || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Borrower Dashboard */
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Currently Borrowed"
              value={myBorrows.filter((b: any) => b.status === 'active').length}
              icon={BookOpen}
              color="blue"
            />
            <StatCard
              title="Books Returned"
              value={myBorrows.filter((b: any) => b.status === 'returned').length}
              icon={CheckCircle}
              color="green"
            />
            <StatCard
              title="Overdue"
              value={myBorrows.filter((b: any) => b.status === 'overdue').length}
              icon={AlertCircle}
              color="red"
            />
          </div>

          {/* Current Borrows */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Current Borrows</h2>
            {myBorrows.filter((b: any) => b.status === 'active' || b.status === 'overdue').length > 0 ? (
              <div className="space-y-4">
                {myBorrows
                  .filter((b: any) => b.status === 'active' || b.status === 'overdue')
                  .map((borrow: any) => {
                    const book = typeof borrow.bookId === 'object' ? borrow.bookId : null
                    const dueDate = new Date(borrow.dueDate)
                    const isOverdue = dueDate < new Date()
                    
                    return (
                      <div key={borrow._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {book?.title || 'Unknown Book'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            by {book?.author || 'Unknown Author'}
                          </p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-sm text-gray-500">
                              Borrowed: {new Date(borrow.borrowDate).toLocaleDateString()}
                            </span>
                            <span className={`text-sm ${
                              isOverdue ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              Due: {dueDate.toLocaleDateString()}
                              {isOverdue && ' (Overdue)'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isOverdue && (
                            <span className="badge badge-danger">Overdue</span>
                          )}
                          <a
                            href={`/books/${book?._id}`}
                            className="btn btn-outline btn-sm"
                          >
                            View Book
                          </a>
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No books currently borrowed</p>
                <a href="/books" className="btn btn-primary mt-4">
                  Browse Books
                </a>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="/books" className="btn btn-primary">
                Browse Books
              </a>
              <a href="/my-borrows" className="btn btn-outline">
                View All Borrows
              </a>
              <a href="/my-reviews" className="btn btn-outline">
                My Reviews
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage