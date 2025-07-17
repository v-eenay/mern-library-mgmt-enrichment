import { Star, MessageSquare } from 'lucide-react'

const MyReviewsPage = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center py-12">
        <Star className="h-16 w-16 text-primary-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Reviews</h1>
        <p className="text-gray-600">View and manage your book reviews</p>
        <p className="text-sm text-gray-500 mt-4">This page will show all your reviews with edit/delete options and review statistics.</p>
      </div>
    </div>
  )
}

export default MyReviewsPage