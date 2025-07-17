import { BookPlus } from 'lucide-react'

const AddBookPage = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center py-12">
        <BookPlus className="h-16 w-16 text-primary-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Add New Book</h1>
        <p className="text-gray-600">Form to add a new book to the library catalog</p>
        <p className="text-sm text-gray-500 mt-4">This page will contain a form with fields for title, author, ISBN, category, description, quantity, and cover image upload.</p>
      </div>
    </div>
  )
}

export default AddBookPage