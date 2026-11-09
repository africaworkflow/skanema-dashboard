'use client'
import { useState, useEffect, createContext, useContext, useRef } from 'react'
import Cookies from 'js-cookie'
import { login as apiLogin } from '@/lib/api'
import api from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)
  const fetchedRef = useRef(false)

  useEffect(() => {
    const token = Cookies.get('skanema_token')

    if (!token) {
      setLoading(false)
      return
    }

    if (fetchedRef.current) {
      setLoading(false)
      return
    }

    fetchedRef.current = true

    // Charge le cookie immédiatement
    const data = Cookies.get('skanema_user')
    if (data) {
      try { setUser(JSON.parse(data)) } catch (_) {}
    }

    // Enrichit avec /api/auth/me et met à jour le cookie
    api.get('/api/auth/me').then(res => {
      const d = res.data.data
      try {
        const prev   = JSON.parse(Cookies.get('skanema_user') || '{}')
        const merged = { ...prev, ...d }
        Cookies.set('skanema_user', JSON.stringify(merged), { expires: 7, sameSite: 'lax' })
        setUser(merged)
      } catch (_) {
        setUser(d)
      }
    }).catch(() => {}).finally(() => {
      setLoading(false)
    })
  }, [])

  const login = async (email, password) => {
    const res = await apiLogin(email, password)
    const { token, data } = res.data
    Cookies.set('skanema_token', token, { expires: 7, secure: true, sameSite: 'lax' })
    Cookies.set('skanema_user',  JSON.stringify(data), { expires: 7 })
    fetchedRef.current = true // évite un double fetch au redirect
    setUser(data)
    return data
  }

  // Recharge le profil depuis l'API (ex. après un paiement d'abonnement)
  const refresh = async () => {
    const res = await api.get('/api/auth/me')
    const d = res.data.data
    let merged = d
    try { merged = { ...JSON.parse(Cookies.get('skanema_user') || '{}'), ...d } } catch (_) {}
    Cookies.set('skanema_user', JSON.stringify(merged), { expires: 7, sameSite: 'lax' })
    setUser(merged)
    return merged
  }

  const logout = () => {
    const domains = ['.skanema.com', 'skanema.com', 'dashboard.skanema.com', undefined]
    domains.forEach(domain => {
      Cookies.remove('skanema_token', { domain, path: '/' })
      Cookies.remove('skanema_user',  { domain, path: '/' })
    })

    // Supprime aussi le cookie de session push
      Cookies.remove('skanema_push_later')
      
    document.cookie = 'skanema_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;domain=.skanema.com;path=/'
    document.cookie = 'skanema_user=;expires=Thu, 01 Jan 1970 00:00:00 GMT;domain=.skanema.com;path=/'
    fetchedRef.current = false
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
