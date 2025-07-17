import { BookOpen, List } from 'lucide-react'

const AllBorrowsPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center py-12">
        <List className="h-16 w-16 text-primary-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">All Borrows</h1>
        <p className="text-gray-600">View and manage all library borrows</p>
        <p className="text-sm text-gray-500 mt-4">This page will show all borrows with filtering, search, and management options.</p>
      </div>
    </div>
  )
}

export default AllBorrowsPage