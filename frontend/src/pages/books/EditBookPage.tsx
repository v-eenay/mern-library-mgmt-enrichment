import { useParams } from 'react-router-dom'
import { Edit } from 'lucide-react'

const EditBookPage = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center py-12">
        <Edit className="h-16 w-16 text-primary-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Book</h1>
        <p className="text-gray-600">Book ID: {id}</p>
        <p className="text-sm text-gray-500 mt-4">This page will contain a pre-filled form to edit book details.</p>
      </div>
    </div>
  )
}

export default EditBookPage