import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, AlertCircle, CheckCircle, Calendar, RotateCcw } from 'lucide-react'

const MyBorrowsPage = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'overdue' | 'all'>('active')

  // Static borrow data
  const borrows = [
    {
      _id: '1',
      book: {
        _id: '1',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=687&auto=format&fit=crop',
        ISBN: '9780061120084'
      },
      borrowDate: '2024-01-15T00:00:00.000Z',
      dueDate: '2024-02-15T00:00:00.000Z',
      status: 'active',
      renewalCount: 0,
      maxRenewals: 2
    },
    {
      _id: '2',
      book: {
        _id: '2',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=687&auto=format&fit=crop',
        ISBN: '9780743273565'
      },
      borrowDate: '2023-12-20T00:00:00.000Z',
      dueDate: '2024-01-10T00:00:00.000Z',
      status: 'overdue',
      renewalCount: 1,
      maxRenewals: 2
    },
    {
      _id: '3',
      book: {
        _id: '3',
        title: 'Sapiens',
        author: 'Yuval Noah Harari',
        coverImage: 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=1476&auto=format&fit=crop',
        ISBN: '9780062316097'
      },
      borrowDate: '2024-01-20T00:00:00.000Z',
      dueDate: '2024-02-20T00:00:00.000Z',
      status: 'active',
      renewalCount: 0,
      maxRenewals: 2
    },
    {
      _id: '4',
      book: {
        _id: '4',
        title: '1984',
        author: 'George Orwell',
        coverImage: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=688&auto=format&fit=crop',
        ISBN: '9780451524935'
      },
      borrowDate: '2023-12-01T00:00:00.000Z',
      dueDate: '2024-01-01T00:00:00.000Z',
      status: 'overdue',
      renewalCount: 2,
      maxRenewals: 2
    }
  ]

  const filteredBorrows = borrows.filter(borrow => {
    if (activeTab === 'active') return borrow.status === 'active'
    if (activeTab === 'overdue') return borrow.status === 'overdue'
    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Active</span>
      case 'overdue':
        return <span className="badge badge-danger">Overdue</span>
      default:
        return <span className="badge badge-secondary">{status}</span>
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleRenew = (borrowId: string) => {
    // In a real app, this would make an API call
    console.log('Renewing borrow:', borrowId)
    // Show success message
  }

  const handleReturn = (borrowId: string) => {
    // In a real app, this would make an API call
    console.log('Returning book:', borrowId)
    // Show success message
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Borrowed Books</h1>
        <p className="text-gray-600">Manage your current and past book borrowings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Borrows</p>
              <p className="text-2xl font-bold text-gray-900">
                {borrows.filter(b => b.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">
                {borrows.filter(b => b.status === 'overdue').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Borrowed</p>
              <p className="text-2xl font-bold text-gray-900">{borrows.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-6">
        <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active ({borrows.filter(b => b.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overdue'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overdue ({borrows.filter(b => b.status === 'overdue').length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({borrows.length})
          </button>
        </div>
      </div>

      {/* Borrows List */}
      {filteredBorrows.length > 0 ? (
        <div className="space-y-4">
          {filteredBorrows.map((borrow) => {
            const daysUntilDue = getDaysUntilDue(borrow.dueDate)
            const isOverdue = daysUntilDue < 0
            const canRenew = borrow.renewalCount < borrow.maxRenewals && !isOverdue

            return (
              <div key={borrow._id} className="card">
                <div className="flex items-start space-x-4">
                  {/* Book Cover */}
                  <div className="flex-shrink-0">
                    <img
                      src={borrow.book.coverImage}
                      alt={borrow.book.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                  </div>

                  {/* Book Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          <Link
                            to={`/books/${borrow.book._id}`}
                            className="hover:text-primary-600"
                          >
                            {borrow.book.title}
                          </Link>
                        </h3>
                        <p className="text-gray-600 mb-2">by {borrow.book.author}</p>
                        <p className="text-sm text-gray-500">ISBN: {borrow.book.ISBN}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(borrow.status)}
                      </div>
                    </div>

                    {/* Dates and Status */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        Borrowed: {new Date(borrow.borrowDate).toLocaleDateString()}
                      </div>
                      <div className={`flex items-center ${
                        isOverdue ? 'text-red-600' : daysUntilDue <= 3 ? 'text-yellow-600' : 'text-gray-600'
                      }`}>
                        <Clock className="h-4 w-4 mr-1" />
                        Due: {new Date(borrow.dueDate).toLocaleDateString()}
                        {isOverdue && ` (${Math.abs(daysUntilDue)} days overdue)`}
                        {!isOverdue && daysUntilDue <= 3 && ` (${daysUntilDue} days left)`}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Renewals: {borrow.renewalCount}/{borrow.maxRenewals}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center space-x-3">
                      {canRenew && (
                        <button
                          onClick={() => handleRenew(borrow._id)}
                          className="btn btn-outline btn-sm"
                        >
                          Renew Book
                        </button>
                      )}
                      <button
                        onClick={() => handleReturn(borrow._id)}
                        className="btn btn-primary btn-sm"
                      >
                        Return Book
                      </button>
                      <Link
                        to={`/books/${borrow.book._id}`}
                        className="btn btn-outline btn-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {activeTab === 'all' ? '' : activeTab} borrows found
          </h3>
          <p className="text-gray-600 mb-4">
            {activeTab === 'active' && "You don't have any active borrows."}
            {activeTab === 'overdue' && "You don't have any overdue books."}
            {activeTab === 'all' && "You haven't borrowed any books yet."}
          </p>
          <Link to="/books" className="btn btn-primary">
            Browse Books
          </Link>
        </div>
      )}
    </div>
  )
}

export default MyBorrowsPage