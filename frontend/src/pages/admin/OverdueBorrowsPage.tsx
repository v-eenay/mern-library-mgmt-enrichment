import { AlertCircle, Clock } from 'lucide-react'

const OverdueBorrowsPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Overdue Books</h1>
        <p className="text-gray-600">Manage overdue book returns and notifications</p>
        <p className="text-sm text-gray-500 mt-4">This page will show overdue borrows with contact options and fine management.</p>
      </div>
    </div>
  )
}

export default OverdueBorrowsPage