import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('hrms_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('hrms_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Demo users for development
      const demoUsers: User[] = [
        {
          id: 'emp-001',
          email: 'john.doe@company.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'Employee',
          department: 'Engineering'
        },
        {
          id: 'admin-001',
          email: 'admin@company.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'Admin',
          department: 'Human Resources'
        },
        {
          id: 'emp-002',
          email: 'jane.smith@company.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'Manager',
          department: 'Product'
        },
        {
          id: 'emp-003',
          email: 'mike.johnson@company.com',
          firstName: 'Mike',
          lastName: 'Johnson',
          role: 'HR Manager',
          department: 'Human Resources'
        },
        {
          id: 'emp-004',
          email: 'sarah.wilson@company.com',
          firstName: 'Sarah',
          lastName: 'Wilson',
          role: 'Marketing Specialist',
          department: 'Marketing'
        }
      ];

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Demo password is 'password123' for all users
      if (password === 'password123') {
        const foundUser = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (foundUser) {
          setUser(foundUser);
          localStorage.setItem('hrms_user', JSON.stringify(foundUser));
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hrms_user');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
