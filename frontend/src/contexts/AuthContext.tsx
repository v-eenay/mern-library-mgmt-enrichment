import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
  hasRole: (role: string | string[]) => boolean
  isAdmin: boolean
  isLibrarian: boolean
  isBorrower: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

// Mock user database
const MOCK_USERS = [
  {
    _id: 'admin-1',
    name: 'Admin User',
    email: 'admin@library.com',
    password: 'DevAdmin2024!',
    role: 'admin' as const,
    createdAt: '2022-01-01T00:00:00.000Z',
    updatedAt: '2024-01-21T00:00:00.000Z'
  },
  {
    _id: 'librarian-1',
    name: 'Jane Smith',
    email: 'librarian@library.com',
    password: 'DevLibrarian2024!',
    role: 'librarian' as const,
    createdAt: '2022-06-10T00:00:00.000Z',
    updatedAt: '2024-01-21T00:00:00.000Z'
  },
  {
    _id: 'borrower-1',
    name: 'John Doe',
    email: 'borrower@library.com',
    password: 'DevBorrower2024!',
    role: 'borrower' as const,
    createdAt: '2023-01-15T00:00:00.000Z',
    updatedAt: '2024-01-20T00:00:00.000Z'
  }
]

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem('mock_token')
      const storedUser = localStorage.getItem('mock_user')

      if (storedToken && storedUser) {
        try {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
        } catch (error) {
          // Invalid stored data, clear storage
          localStorage.removeItem('mock_token')
          localStorage.removeItem('mock_user')
          setToken(null)
          setUser(null)
        }
      }

      setLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Find user in mock database
    const mockUser = MOCK_USERS.find(u => u.email === email && u.password === password)

    if (!mockUser) {
      throw new Error('Invalid email or password')
    }

    // Create mock token
    const mockToken = `mock_token_${mockUser._id}_${Date.now()}`

    // Remove password from user object
    const { password: _, ...userData } = mockUser

    setUser(userData)
    setToken(mockToken)
    localStorage.setItem('mock_token', mockToken)
    localStorage.setItem('mock_user', JSON.stringify(userData))
  }

  const register = async (name: string, email: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Check if user already exists
    const existingUser = MOCK_USERS.find(u => u.email === email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Create new mock user
    const newUser = {
      _id: `user_${Date.now()}`,
      name,
      email,
      role: 'borrower' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Create mock token
    const mockToken = `mock_token_${newUser._id}_${Date.now()}`

    setUser(newUser)
    setToken(mockToken)
    localStorage.setItem('mock_token', mockToken)
    localStorage.setItem('mock_user', JSON.stringify(newUser))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('mock_token')
    localStorage.removeItem('mock_user')
  }

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false
    
    const roles = Array.isArray(role) ? role : [role]
    
    // Role hierarchy: admin > librarian > borrower
    const roleHierarchy = { admin: 3, librarian: 2, borrower: 1 }
    const userRoleLevel = roleHierarchy[user.role]
    
    return roles.some(r => {
      const requiredLevel = roleHierarchy[r as keyof typeof roleHierarchy]
      return userRoleLevel >= requiredLevel
    })
  }

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user && !!token,
    hasRole,
    isAdmin: user?.role === 'admin',
    isLibrarian: user?.role === 'librarian' || user?.role === 'admin',
    isBorrower: !!user, // All authenticated users can borrow
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}