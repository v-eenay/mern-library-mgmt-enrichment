// Simple toast notification system
import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

let toastId = 0
const toasts: Toast[] = []
const listeners: ((toasts: Toast[]) => void)[] = []

export const toast = {
  success: (title: string, message?: string) => addToast({ type: 'success', title, message }),
  error: (title: string, message?: string) => addToast({ type: 'error', title, message }),
  warning: (title: string, message?: string) => addToast({ type: 'warning', title, message }),
  info: (title: string, message?: string) => addToast({ type: 'info', title, message }),
}

const addToast = (toast: Omit<Toast, 'id'>) => {
  const newToast: Toast = {
    ...toast,
    id: (++toastId).toString(),
    duration: toast.duration || 5000,
  }
  
  toasts.push(newToast)
  listeners.forEach(listener => listener([...toasts]))
  
  setTimeout(() => removeToast(newToast.id), newToast.duration)
}

const removeToast = (id: string) => {
  const index = toasts.findIndex(toast => toast.id === id)
  if (index > -1) {
    toasts.splice(index, 1)
    listeners.forEach(listener => listener([...toasts]))
  }
}

export const Toaster = () => {
  const [toastList, setToastList] = useState<Toast[]>([])

  useEffect(() => {
    listeners.push(setToastList)
    return () => {
      const index = listeners.indexOf(setToastList)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBackgroundColor = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toastList.map((toast) => (
        <div
          key={toast.id}
          className={`max-w-sm w-full border rounded-lg p-4 shadow-lg animate-fade-in ${getBackgroundColor(toast.type)}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon(toast.type)}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {toast.title}
              </p>
              {toast.message && (
                <p className="mt-1 text-sm text-gray-600">
                  {toast.message}
                </p>
              )}
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => removeToast(toast.id)}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}