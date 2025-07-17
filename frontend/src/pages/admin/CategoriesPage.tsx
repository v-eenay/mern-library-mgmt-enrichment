import { Tag, Plus } from 'lucide-react'

const CategoriesPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center py-12">
        <Tag className="h-16 w-16 text-primary-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Category Management</h1>
        <p className="text-gray-600">Manage book categories and classifications</p>
        <p className="text-sm text-gray-500 mt-4">This page will show category list with add, edit, delete options and book count per category.</p>
      </div>
    </div>
  )
}

export default CategoriesPage