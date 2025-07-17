import { History } from 'lucide-react'

const BorrowHistoryPage = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center py-12">
        <History className="h-16 w-16 text-primary-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Borrowing History</h1>
        <p className="text-gray-600">View your complete borrowing history</p>
        <p className="text-sm text-gray-500 mt-4">This page will show all past borrows with dates, return status, and review options.</p>
      </div>
    </div>
  )
}

export default BorrowHistoryPage