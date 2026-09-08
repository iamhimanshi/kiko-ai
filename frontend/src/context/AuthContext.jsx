import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as authApi from '../services/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('kiko_user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('kiko_token')
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .fetchMe()
      .then((data) => {
        setUser(data)
        localStorage.setItem('kiko_user', JSON.stringify(data))
      })
      .catch(() => {
        localStorage.removeItem('kiko_token')
        localStorage.removeItem('kiko_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const doLogin = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password })
    localStorage.setItem('kiko_token', data.access_token)
    localStorage.setItem('kiko_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const doSignup = useCallback(async (name, email, password) => {
    await authApi.signup({ name, email, password })
    return doLogin(email, password)
  }, [doLogin])

  const doStartDemo = useCallback(async () => {
    const data = await authApi.startDemo()
    localStorage.setItem('kiko_token', data.access_token)
    localStorage.setItem('kiko_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const doLogout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // token may already be invalid/expired — clear local state regardless
    }
    localStorage.removeItem('kiko_token')
    localStorage.removeItem('kiko_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login: doLogin, signup: doSignup, logout: doLogout, startDemo: doStartDemo }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
