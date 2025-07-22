import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, BookOpen, Plus, Star } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import type { Book, BookSearchParams } from '@/types'

const BooksPage = () => {
  const { isLibrarian } = useAuth()
  const [searchParams, setSearchParams] = useState<BookSearchParams>({
    page: 0,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  // Static categories data
  const categories = [
    { _id: '1', name: 'Fiction' },
    { _id: '2', name: 'Non-Fiction' },
    { _id: '3', name: 'Science Fiction' },
    { _id: '4', name: 'Mystery' },
    { _id: '5', name: 'Biography' },
    { _id: '6', name: 'History' },
    { _id: '7', name: 'Self-Help' },
    { _id: '8', name: 'Fantasy' }
  ]

  // Static books data with online images
  const staticBooks: Book[] = [
    {
      _id: '1',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      description: 'A classic novel about racial injustice in the American South.',
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
      description: 'A dystopian novel set in a totalitarian society.',
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
      description: 'A novel about the American Dream in the 1920s.',
      ISBN: '9780743273565',
      category: 'Fiction',
      coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=687&auto=format&fit=crop',
      available: 3,
      total: 7,
      averageRating: 4.3,
      totalReviews: 85,
      createdAt: '2023-03-05T00:00:00.000Z',
      updatedAt: '2023-03-05T00:00:00.000Z'
    },
    {
      _id: '4',
      title: 'Sapiens: A Brief History of Humankind',
      author: 'Yuval Noah Harari',
      description: 'A book exploring the history and impact of Homo sapiens.',
      ISBN: '9780062316097',
      category: 'Non-Fiction',
      coverImage: 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=1476&auto=format&fit=crop',
      available: 2,
      total: 5,
      averageRating: 4.7,
      totalReviews: 110,
      createdAt: '2023-04-20T00:00:00.000Z',
      updatedAt: '2023-04-20T00:00:00.000Z'
    },
    {
      _id: '5',
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      description: 'A fantasy novel about the adventures of Bilbo Baggins.',
      ISBN: '9780547928227',
      category: 'Fantasy',
      coverImage: 'https://images.unsplash.com/photo-1629992101753-56d196c8aabb?q=80&w=690&auto=format&fit=crop',
      available: 4,
      total: 10,
      averageRating: 4.9,
      totalReviews: 150,
      createdAt: '2023-05-12T00:00:00.000Z',
      updatedAt: '2023-05-12T00:00:00.000Z'
    },
    {
      _id: '6',
      title: 'Becoming',
      author: 'Michelle Obama',
      description: 'A memoir by the former First Lady of the United States.',
      ISBN: '9781524763138',
      category: 'Biography',
      coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=687&auto=format&fit=crop',
      available: 1,
      total: 4,
      averageRating: 4.5,
      totalReviews: 95,
      createdAt: '2023-06-08T00:00:00.000Z',
      updatedAt: '2023-06-08T00:00:00.000Z'
    }
  ]

  // Filter books based on search params (simplified)
  const books = staticBooks.filter(book => {
    // Filter by category if specified
    if (searchParams.category && book.category !== searchParams.category) {
      return false
    }

    // Filter by availability if specified
    if (searchParams.available !== undefined) {
      if (searchParams.available && book.available <= 0) return false
      if (!searchParams.available && book.available > 0) return false
    }

    // Filter by search query if specified
    if (searchParams.q) {
      const query = searchParams.q.toLowerCase()
      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.ISBN.includes(query)
      )
    }

    return true
  })

  // Pagination data
  const pagination = {
    page: searchParams.page || 0,
    limit: searchParams.limit || 12,
    total: books.length,
    pages: Math.ceil(books.length / (searchParams.limit || 12))
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get('search') as string
    setSearchParams(prev => ({ ...prev, q: query, page: 0 }))
  }

  const handleFilterChange = (key: keyof BookSearchParams, value: any) => {
    setSearchParams(prev => ({ ...prev, [key]: value, page: 0 }))
  }

  const BookCard = ({ book }: { book: Book }) => (
    <div className="card hover:shadow-md transition-shadow">
      <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <BookOpen className="h-16 w-16 text-gray-400" />
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 line-clamp-2" title={book.title}>
          {book.title}
        </h3>
        
        <p className="text-sm text-gray-600">by {book.author}</p>
        
        <div className="flex items-center justify-between">
          <span className="badge badge-primary">{book.category}</span>
          {book.totalReviews > 0 && (
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">
                {book.averageRating.toFixed(1)} ({book.totalReviews})
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${
            book.available > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {book.available > 0 ? `${book.available} available` : 'Not available'}
          </span>
          <Link
            to={`/books/${book._id}`}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Catalog</h1>
          <p className="text-gray-600">Discover and explore our collection</p>
        </div>
        {isLibrarian && (
          <Link
            to="/books/add"
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Book</span>
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card mb-8">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                name="search"
                type="text"
                placeholder="Search books, authors, or ISBN..."
                className="input pl-10"
                defaultValue={searchParams.q || ''}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>
        </form>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            className="input w-auto"
            value={searchParams.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category: any) => (
              <option key={category._id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            className="input w-auto"
            value={searchParams.available === undefined ? '' : searchParams.available.toString()}
            onChange={(e) => handleFilterChange('available', e.target.value === '' ? undefined : e.target.value === 'true')}
          >
            <option value="">All Books</option>
            <option value="true">Available Only</option>
            <option value="false">Unavailable</option>
          </select>

          <select
            className="input w-auto"
            value={`${searchParams.sortBy}-${searchParams.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-')
              setSearchParams(prev => ({ ...prev, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }))
            }}
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
            <option value="author-asc">Author A-Z</option>
            <option value="averageRating-desc">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Books Grid */}
      {books.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {books.map((book: Book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => setSearchParams(prev => ({ ...prev, page: Math.max(0, (prev.page || 0) - 1) }))}
                disabled={!pagination.page || pagination.page === 0}
                className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Page {(pagination.page || 0) + 1} of {pagination.pages}
              </span>
              
              <button
                onClick={() => setSearchParams(prev => ({ ...prev, page: (prev.page || 0) + 1 }))}
                disabled={!pagination.page || pagination.page >= pagination.pages - 1}
                className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  )
}

export default BooksPage