import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Edit, ArrowLeft, Save, BookOpen } from 'lucide-react'
import type { Book } from '@/types'

const EditBookPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Static book data based on ID
  const getBookById = (bookId: string): Book | null => {
    const books: Book[] = [
      {
        _id: '1',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        description: 'Set in the fictional town of Maycomb, Alabama, during the 1930s, this novel tells the story of Scout Finch, a young girl whose father, Atticus, is a lawyer defending a Black man falsely accused of rape.',
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
        description: 'In a world where Big Brother watches everything and the Thought Police control what people think, Winston Smith works at the Ministry of Truth, rewriting history to fit the Party\'s needs.',
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
        description: 'Set in the summer of 1922, this novel follows Nick Carraway as he becomes neighbor to the mysterious millionaire Jay Gatsby.',
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

    return books.find(book => book._id === bookId) || books[0]
  }

  const book = getBookById(id || '1')

  const [formData, setFormData] = useState({
    title: book?.title || '',
    author: book?.author || '',
    ISBN: book?.ISBN || '',
    category: book?.category || '',
    description: book?.description || '',
    total: book?.total || 1,
    coverImage: book?.coverImage || ''
  })

  const categories = [
    'Fiction',
    'Non-Fiction',
    'Science Fiction',
    'Mystery',
    'Biography',
    'History',
    'Self-Help',
    'Fantasy',
    'Romance',
    'Thriller'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total' ? parseInt(value) || 0 : value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would submit to the API
    console.log('Updating book:', formData)
    // Show success message and redirect
    alert('Book updated successfully! (This is a demo)')
    navigate(`/books/${id}`)
  }

  if (!book) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Book Not Found</h1>
          <p className="text-gray-600">The book you're trying to edit doesn't exist.</p>
          <Link to="/books" className="btn btn-primary mt-4">
            Back to Books
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to={`/books/${id}`}
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Book Details
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Book</h1>
        <p className="text-gray-600">Update book information in the library catalog</p>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Book Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="input"
              placeholder="Enter book title"
              required
            />
          </div>

          {/* Author */}
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
              Author *
            </label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              className="input"
              placeholder="Enter author name"
              required
            />
          </div>

          {/* ISBN and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ISBN" className="block text-sm font-medium text-gray-700 mb-2">
                ISBN *
              </label>
              <input
                type="text"
                id="ISBN"
                name="ISBN"
                value={formData.ISBN}
                onChange={handleInputChange}
                className="input"
                placeholder="978-0-123456-78-9"
                required
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="input"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Total Copies */}
          <div>
            <label htmlFor="total" className="block text-sm font-medium text-gray-700 mb-2">
              Total Copies *
            </label>
            <input
              type="number"
              id="total"
              name="total"
              value={formData.total}
              onChange={handleInputChange}
              className="input"
              min="1"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Available copies: {book.available} (will be recalculated based on current borrows)
            </p>
          </div>

          {/* Cover Image URL */}
          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image URL
            </label>
            <input
              type="url"
              id="coverImage"
              name="coverImage"
              value={formData.coverImage}
              onChange={handleInputChange}
              className="input"
              placeholder="https://example.com/book-cover.jpg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter a URL for the book cover image (optional)
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="input"
              placeholder="Enter book description..."
            />
          </div>

          {/* Preview */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                {formData.coverImage ? (
                  <img
                    src={formData.coverImage}
                    alt="Book cover"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <BookOpen className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">
                  {formData.title || 'Book Title'}
                </h4>
                <p className="text-gray-600">
                  by {formData.author || 'Author Name'}
                </p>
                {formData.category && (
                  <span className="badge badge-primary mt-2">{formData.category}</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Link
              to={`/books/${id}`}
              className="btn btn-outline"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Update Book</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditBookPage