import { Link } from 'react-router-dom'
import { History, BookOpen, Calendar, CheckCircle, Star } from 'lucide-react'

const BorrowHistoryPage = () => {
  // Static history data
  const borrowHistory = [
    {
      _id: '1',
      book: {
        _id: '1',
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        coverImage: 'https://images.unsplash.com/photo-1629992101753-56d196c8aabb?q=80&w=690&auto=format&fit=crop'
      },
      borrowDate: '2023-11-01T00:00:00.000Z',
      dueDate: '2023-12-01T00:00:00.000Z',
      returnDate: '2023-11-28T00:00:00.000Z',
      status: 'returned',
      hasReview: true
    },
    {
      _id: '2',
      book: {
        _id: '2',
        title: 'Becoming',
        author: 'Michelle Obama',
        coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=687&auto=format&fit=crop'
      },
      borrowDate: '2023-10-15T00:00:00.000Z',
      dueDate: '2023-11-15T00:00:00.000Z',
      returnDate: '2023-11-10T00:00:00.000Z',
      status: 'returned',
      hasReview: false
    },
    {
      _id: '3',
      book: {
        _id: '3',
        title: 'Dune',
        author: 'Frank Herbert',
        coverImage: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=688&auto=format&fit=crop'
      },
      borrowDate: '2023-09-20T00:00:00.000Z',
      dueDate: '2023-10-20T00:00:00.000Z',
      returnDate: '2023-10-18T00:00:00.000Z',
      status: 'returned',
      hasReview: true
    }
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Borrowing History</h1>
        <p className="text-gray-600">Your complete record of borrowed books</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Borrowed</p>
              <p className="text-2xl font-bold text-gray-900">{borrowHistory.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Returned On Time</p>
              <p className="text-2xl font-bold text-gray-900">{borrowHistory.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Star className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reviews Written</p>
              <p className="text-2xl font-bold text-gray-900">
                {borrowHistory.filter(b => b.hasReview).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Borrowing History</h2>

        {borrowHistory.length > 0 ? (
          <div className="space-y-4">
            {borrowHistory.map((borrow) => (
              <div key={borrow._id} className="border border-gray-200 rounded-lg p-4">
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
                      </div>
                      <span className="badge badge-success">Returned</span>
                    </div>

                    {/* Dates */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Borrowed: {new Date(borrow.borrowDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Due: {new Date(borrow.dueDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Returned: {new Date(borrow.returnDate!).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center space-x-3">
                      <Link
                        to={`/books/${borrow.book._id}`}
                        className="btn btn-outline btn-sm"
                      >
                        View Book
                      </Link>
                      {borrow.hasReview ? (
                        <span className="text-sm text-green-600 flex items-center">
                          <Star className="h-4 w-4 mr-1" />
                          Review written
                        </span>
                      ) : (
                        <button className="btn btn-primary btn-sm">
                          Write Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No borrowing history</h3>
            <p className="text-gray-600 mb-4">You haven't borrowed any books yet.</p>
            <Link to="/books" className="btn btn-primary">
              Browse Books
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default BorrowHistoryPage