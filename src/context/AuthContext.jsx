import { createContext, useContext, useState, useEffect } from 'react'
import API from '../api/axios'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setLoading(false)
          return
        }
        const { data } = await API.get('/users/me')
        setUser(data.user)
      } catch (err) {
        localStorage.removeItem('token')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const loginAsGuest = async (fingerprint = 'default') => {
    try {
      const { data } = await API.post('/auth/guest', { fingerprint })
      localStorage.setItem('token', data.token)
      setUser(data.user)
      toast.success(`Welcome, ${data.user.username}!`)
      return data.user
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create guest account')
      throw err
    }
  }

  const register = async (username, email, password) => {
    try {
      const { data } = await API.post('/auth/register', { username, email, password })
      localStorage.setItem('token', data.token)
      setUser(data.user)
      toast.success('Registered! Check your email for verification.')
      return data.user
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
      throw err
    }
  }

  const login = async (email, password) => {
    try {
      const { data } = await API.post('/auth/login', { email, password })
      localStorage.setItem('token', data.token)
      setUser(data.user)
      toast.success(`Welcome back, ${data.user.username}!`)
      return data.user
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
      throw err
    }
  }

  const logout = async () => {
    try {
      await API.post('/auth/logout')
    } catch (err) {
      // ignore
    }
    localStorage.removeItem('token')
    setUser(null)
    toast.success('Logged out')
  }

  const destroyAccount = async () => {
    try {
      await API.delete('/auth/me')
      localStorage.removeItem('token')
      setUser(null)
      toast.success('Account deleted successfully')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete account')
      throw err
    }
  }

  const resendVerification = async () => {
    try {
      const { data } = await API.post('/auth/resend-verification')
      toast.success(data.message || 'Verification email sent!')
      return data
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend verification')
      throw err
    }
  }

  const refreshUser = async () => {
    try {
      const { data } = await API.get('/users/me')
      setUser(data.user)
      return data.user
    } catch (err) {
      // If unauthorized, clear session
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        setUser(null)
      }
      throw err
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        loginAsGuest,
        register,
        login,
        logout,
        destroyAccount,
        resendVerification,
        refreshUser,
        updateProfile: setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
