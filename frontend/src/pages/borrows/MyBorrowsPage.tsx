import { BookOpen, Clock } from 'lucide-react'

const MyBorrowsPage = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 text-primary-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Borrowed Books</h1>
        <p className="text-gray-600">View and manage your currently borrowed books</p>
        <p className="text-sm text-gray-500 mt-4">This page will show active borrows with due dates, return options, and renewal requests.</p>
      </div>
    </div>
  )
}

export default MyBorrowsPage