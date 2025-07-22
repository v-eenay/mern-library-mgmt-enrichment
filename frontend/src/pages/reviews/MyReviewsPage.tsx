import { Link } from 'react-router-dom'
import { Star, MessageSquare, Edit2, Trash2, Calendar } from 'lucide-react'

const MyReviewsPage = () => {
  // Static reviews data
  const myReviews = [
    {
      _id: '1',
      book: {
        _id: '1',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=687&auto=format&fit=crop'
      },
      rating: 5,
      comment: 'An absolutely incredible book that changed my perspective on justice and morality. Harper Lee\'s writing is both beautiful and powerful.',
      createdAt: '2023-12-01T00:00:00.000Z',
      updatedAt: '2023-12-01T00:00:00.000Z'
    },
    {
      _id: '2',
      book: {
        _id: '2',
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        coverImage: 'https://images.unsplash.com/photo-1629992101753-56d196c8aabb?q=80&w=690&auto=format&fit=crop'
      },
      rating: 4,
      comment: 'A wonderful adventure story that captures the imagination. Tolkien\'s world-building is exceptional.',
      createdAt: '2023-11-15T00:00:00.000Z',
      updatedAt: '2023-11-15T00:00:00.000Z'
    },
    {
      _id: '3',
      book: {
        _id: '3',
        title: 'Sapiens',
        author: 'Yuval Noah Harari',
        coverImage: 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=1476&auto=format&fit=crop'
      },
      rating: 5,
      comment: 'Mind-blowing insights into human history and evolution. This book completely changed how I think about humanity.',
      createdAt: '2023-10-20T00:00:00.000Z',
      updatedAt: '2023-10-20T00:00:00.000Z'
    }
  ]

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const averageRating = myReviews.reduce((sum, review) => sum + review.rating, 0) / myReviews.length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reviews</h1>
        <p className="text-gray-600">Manage your book reviews and ratings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Star className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{myReviews.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Star className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">5-Star Reviews</p>
              <p className="text-2xl font-bold text-gray-900">
                {myReviews.filter(r => r.rating === 5).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Reviews</h2>

        {myReviews.length > 0 ? (
          <div className="space-y-6">
            {myReviews.map((review) => (
              <div key={review._id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  {/* Book Cover */}
                  <div className="flex-shrink-0">
                    <img
                      src={review.book.coverImage}
                      alt={review.book.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                  </div>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          <Link
                            to={`/books/${review.book._id}`}
                            className="hover:text-primary-600"
                          >
                            {review.book.title}
                          </Link>
                        </h3>
                        <p className="text-gray-600">by {review.book.author}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-primary-600">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex items-center space-x-1">
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-sm text-gray-600">
                        {review.rating} out of 5 stars
                      </span>
                    </div>

                    {/* Comment */}
                    <p className="text-gray-700 mb-4">{review.comment}</p>

                    {/* Date */}
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                      {review.updatedAt !== review.createdAt && (
                        <span className="ml-2">(edited)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600 mb-4">Start reviewing books you've read to help other readers.</p>
            <Link to="/books" className="btn btn-primary">
              Browse Books
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyReviewsPage