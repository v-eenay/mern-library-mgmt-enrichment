import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/types'
import { authApi } from '@/services/api'

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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      
      if (storedToken && storedUser) {
        try {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
          
          // Verify token is still valid
          const response = await authApi.verifyToken()
          if (response.data.data.user) {
            setUser(response.data.data.user)
            localStorage.setItem('user', JSON.stringify(response.data.data.user))
          }
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
        }
      }
      
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password })
      const { user: userData, token: userToken } = response.data.data
      
      setUser(userData)
      setToken(userToken)
      localStorage.setItem('token', userToken)
      localStorage.setItem('user', JSON.stringify(userData))
    } catch (error) {
      throw error
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await authApi.register({ 
        name, 
        email, 
        password, 
        confirmPassword: password 
      })
      const { user: userData, token: userToken } = response.data.data
      
      setUser(userData)
      setToken(userToken)
      localStorage.setItem('token', userToken)
      localStorage.setItem('user', JSON.stringify(userData))
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
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