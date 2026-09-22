import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'expense_tracker_token'
const USER_KEY = 'expense_tracker_user'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY)
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(true)

  // Verify token with backend /api/auth/me on mount
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      if (!storedToken) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const response = await api.get('/api/auth/me')
        setUser(response.data)
        localStorage.setItem(USER_KEY, JSON.stringify(response.data))
      } catch (err) {
        console.warn('Session expired or invalid token:', err?.response?.data?.detail || err.message)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }

    verifyToken()

    // Listen for unauthorized events dispatched by Axios interceptor
    const handleUnauthorized = () => {
      setUser(null)
      setToken(null)
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  // Login handler
  const login = useCallback(async (email, password) => {
    const response = await api.post('/api/auth/login', {
      email: email.trim(),
      password,
    })
    const { access_token, user: userData } = response.data

    localStorage.setItem(TOKEN_KEY, access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setToken(access_token)
    setUser(userData)
    return userData
  }, [])

  // Register handler
  const register = useCallback(async (name, email, password) => {
    // 1. Create account
    await api.post('/api/auth/register', {
      name: name.trim(),
      email: email.trim(),
      password,
    })
    // 2. Automatically log in to get access token
    return await login(email, password)
  }, [login])

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
    setToken(null)
  }, [])

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
