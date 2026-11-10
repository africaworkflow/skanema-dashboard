import axios from 'axios'
import Cookies from 'js-cookie'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 })

api.interceptors.request.use(config => {
  const token = Cookies.get('skanema_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !err.config.url.includes('/api/auth/login')) {
      Cookies.remove('skanema_token')
      if (typeof window !== 'undefined') window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────────
export const login = (email, password) =>
  api.post('/api/auth/login', { email, password })

// ── Dashboard ─────────────────────────────────────────────────────
export const getStats    = () => api.get('/api/orders/stats')
export const getOrders   = (params) => api.get('/api/orders', { params })
export const updateOrder = (id, data) => api.patch(`/api/orders/${id}/status`, data)

// ── Menu ──────────────────────────────────────────────────────────
export const getMenu       = ()       => api.get('/api/menu')
export const createItem    = (data)   => api.post('/api/menu', data)
export const updateItem    = (id, data) => api.put(`/api/menu/${id}`, data)
export const deleteItem    = (id)     => api.delete(`/api/menu/${id}`)
export const toggleItem    = (id, available) => api.put(`/api/menu/${id}`, { available })

// ── Zones ─────────────────────────────────────────────────────────
export const getZones    = ()       => api.get('/api/auth/zones')
export const updateZones = (data)   => api.patch('/api/auth/zones', data)

// ── Abonnement Skanema ────────────────────────────────────────────
export const getBilling       = ()     => api.get('/api/billing')
export const createCheckout   = (plan) => api.post('/api/billing/checkout', { plan })
export const getPaymentStatus = (id)   => api.get(`/api/billing/payments/${id}`)
export const payWithMethod    = (id, data) => api.post(`/api/billing/payments/${id}/pay`, data)

// ── Paiement des clients par PayDunya ──
export const updatePaydunya   = (data)   => api.patch('/api/auth/paydunya', data)
export const startTrial       = ()     => api.post('/api/billing/start-trial')
