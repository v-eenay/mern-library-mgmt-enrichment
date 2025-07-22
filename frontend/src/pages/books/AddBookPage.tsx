import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookPlus, ArrowLeft, Upload, Save } from 'lucide-react'

const AddBookPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    ISBN: '',
    category: '',
    description: '',
    total: 1,
    coverImageUrl: ''
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
    console.log('Adding book:', formData)
    // Show success message and redirect
    alert('Book added successfully! (This is a demo)')
    navigate('/books')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/books"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Books
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Book</h1>
        <p className="text-gray-600">Add a new book to the library catalog</p>
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
          </div>

          {/* Cover Image URL */}
          <div>
            <label htmlFor="coverImageUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image URL
            </label>
            <input
              type="url"
              id="coverImageUrl"
              name="coverImageUrl"
              value={formData.coverImageUrl}
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
          {(formData.title || formData.author || formData.coverImageUrl) && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                  {formData.coverImageUrl ? (
                    <img
                      src={formData.coverImageUrl}
                      alt="Book cover"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <BookPlus className="h-8 w-8 text-gray-400" />
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
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Link
              to="/books"
              className="btn btn-outline"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Add Book</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddBookPage