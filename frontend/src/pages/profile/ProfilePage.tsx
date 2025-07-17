import { User, Settings } from 'lucide-react'

const ProfilePage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center py-12">
        <User className="h-16 w-16 text-primary-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">User Profile</h1>
        <p className="text-gray-600">Manage your account settings and personal information</p>
        <p className="text-sm text-gray-500 mt-4">This page will contain profile editing form, password change, and profile picture upload.</p>
      </div>
    </div>
  )
}

export default ProfilePage