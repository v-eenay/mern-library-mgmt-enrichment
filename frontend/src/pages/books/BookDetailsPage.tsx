import { useParams, Link } from 'react-router-dom'
import { BookOpen, Star, User, Calendar, ArrowLeft, Heart, Share2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import type { Book, Review } from '@/types'

const BookDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const { user, isAuthenticated } = useAuth()

  // Static book data based on ID
  const getBookById = (bookId: string): Book | null => {
    const books: Book[] = [
      {
        _id: '1',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        description: 'Set in the fictional town of Maycomb, Alabama, during the 1930s, this novel tells the story of Scout Finch, a young girl whose father, Atticus, is a lawyer defending a Black man falsely accused of rape. Through Scout\'s eyes, we witness the complexities of human nature, the importance of moral courage, and the devastating effects of prejudice and racism in the American South.',
        ISBN: '9780061120084',
        category: 'Fiction',
        coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=687&auto=format&fit=crop',
        available: 5,
        total: 8,
        averageRating: 4.8,
        totalReviews: 120,
        createdAt: '2023-01-15T00:00:00.000Z',
        updatedAt: '2023-01-15T00:00:00.000Z'
      },
      {
        _id: '2',
        title: '1984',
        author: 'George Orwell',
        description: 'In a world where Big Brother watches everything and the Thought Police control what people think, Winston Smith works at the Ministry of Truth, rewriting history to fit the Party\'s needs. But Winston harbors dangerous thoughts of rebellion and freedom. This dystopian masterpiece explores themes of totalitarianism, surveillance, and the power of language to shape reality.',
        ISBN: '9780451524935',
        category: 'Science Fiction',
        coverImage: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=688&auto=format&fit=crop',
        available: 0,
        total: 6,
        averageRating: 4.6,
        totalReviews: 98,
        createdAt: '2023-02-10T00:00:00.000Z',
        updatedAt: '2023-02-10T00:00:00.000Z'
      },
      {
        _id: '3',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        description: 'Set in the summer of 1922, this novel follows Nick Carraway as he becomes neighbor to the mysterious millionaire Jay Gatsby. Gatsby\'s obsessive pursuit of his lost love, Daisy Buchanan, serves as a backdrop for Fitzgerald\'s critique of the American Dream and the excess of the Jazz Age. A timeless exploration of love, wealth, and the corruption of the American ideal.',
        ISBN: '9780743273565',
        category: 'Fiction',
        coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=687&auto=format&fit=crop',
        available: 3,
        total: 7,
        averageRating: 4.3,
        totalReviews: 85,
        createdAt: '2023-03-05T00:00:00.000Z',
        updatedAt: '2023-03-05T00:00:00.000Z'
      }
    ]

    return books.find(book => book._id === bookId) || books[0] // Default to first book if ID not found
  }

  // Static reviews data
  const getReviewsForBook = (bookId: string): Review[] => {
    return [
      {
        _id: '1',
        book: bookId,
        user: {
          _id: 'user1',
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          role: 'borrower'
        },
        rating: 5,
        comment: 'An absolutely incredible book that changed my perspective on justice and morality. Harper Lee\'s writing is both beautiful and powerful.',
        createdAt: '2023-12-01T00:00:00.000Z',
        updatedAt: '2023-12-01T00:00:00.000Z'
      },
      {
        _id: '2',
        book: bookId,
        user: {
          _id: 'user2',
          name: 'Michael Chen',
          email: 'michael@example.com',
          role: 'borrower'
        },
        rating: 4,
        comment: 'A classic that everyone should read. The character development is exceptional and the themes are still relevant today.',
        createdAt: '2023-11-15T00:00:00.000Z',
        updatedAt: '2023-11-15T00:00:00.000Z'
      },
      {
        _id: '3',
        book: bookId,
        user: {
          _id: 'user3',
          name: 'Emily Rodriguez',
          email: 'emily@example.com',
          role: 'borrower'
        },
        rating: 5,
        comment: 'Beautifully written and deeply moving. This book stays with you long after you finish reading it.',
        createdAt: '2023-10-20T00:00:00.000Z',
        updatedAt: '2023-10-20T00:00:00.000Z'
      }
    ]
  }

  const book = getBookById(id || '1')
  const reviews = getReviewsForBook(id || '1')

  if (!book) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Book Not Found</h1>
          <p className="text-gray-600">The book you're looking for doesn't exist.</p>
          <Link to="/books" className="btn btn-primary mt-4">
            Back to Books
          </Link>
        </div>
      </div>
    )
  }

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        to="/books"
        className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Books
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Book Cover and Actions */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-6">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {isAuthenticated && (
                <button
                  className={`w-full btn ${
                    book.available > 0 ? 'btn-primary' : 'btn-outline opacity-50 cursor-not-allowed'
                  }`}
                  disabled={book.available <= 0}
                >
                  {book.available > 0 ? 'Borrow Book' : 'Not Available'}
                </button>
              )}

              <div className="flex space-x-2">
                <button className="flex-1 btn btn-outline flex items-center justify-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Favorite</span>
                </button>
                <button className="flex-1 btn btn-outline flex items-center justify-center space-x-2">
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Book Details */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Title and Author */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
              <p className="text-xl text-gray-600 mb-4">by {book.author}</p>

              {/* Rating and Reviews */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  {renderStars(Math.round(book.averageRating))}
                  <span className="text-lg font-medium text-gray-900 ml-2">
                    {book.averageRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-gray-600">
                  ({book.totalReviews} reviews)
                </span>
              </div>

              {/* Category and Availability */}
              <div className="flex items-center space-x-4">
                <span className="badge badge-primary">{book.category}</span>
                <span className={`text-sm font-medium ${
                  book.available > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {book.available > 0
                    ? `${book.available} of ${book.total} available`
                    : 'Currently unavailable'
                  }
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed">{book.description}</p>
            </div>

            {/* Book Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">ISBN:</span>
                  <p className="text-gray-900">{book.ISBN}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Category:</span>
                  <p className="text-gray-900">{book.category}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Total Copies:</span>
                  <p className="text-gray-900">{book.total}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Available:</span>
                  <p className="text-gray-900">{book.available}</p>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Reviews ({reviews.length})
                </h2>
                {isAuthenticated && (
                  <button className="btn btn-outline">Write a Review</button>
                )}
              </div>

              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="card">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{review.user.name}</h4>
                          <div className="flex items-center space-x-1">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookDetailsPage