import { Users, UserPlus } from 'lucide-react'

const UsersPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-primary-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage library users and their permissions</p>
        <p className="text-sm text-gray-500 mt-4">This page will show user list with search, filtering, role management, and user creation options.</p>
      </div>
    </div>
  )
}

export default UsersPage