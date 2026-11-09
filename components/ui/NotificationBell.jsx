'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, ShoppingBag, X, CheckCheck } from 'lucide-react'
import { formatFCFA } from '@/lib/utils'

// La liste des commandes est interrogée une seule fois pour tout le dashboard, par NewOrderAlert
// (toutes les 10 s), qui joue aussi le son. La cloche reçoit la liste par l'événement « skanema:orders ».
const STORAGE_KEY   = 'skanema_last_seen_order'

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60)   return 'à l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const STATUS_COLORS = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
  PAID           : 'bg-blue-100 text-blue-700',
  CONFIRMED      : 'bg-blue-100 text-blue-700',
  PREPARING      : 'bg-purple-100 text-purple-700',
  DELIVERING     : 'bg-orange-100 text-orange-700',
  DELIVERED      : 'bg-green-100 text-green-700',
  CANCELLED      : 'bg-red-100 text-red-700',
}

const STATUS_LABELS = {
  PENDING_PAYMENT: 'En attente',
  PAID           : 'Payé',
  CONFIRMED      : 'Confirmé',
  PREPARING      : 'En préparation',
  DELIVERING     : 'En livraison',
  DELIVERED      : 'Livré',
  CANCELLED      : 'Annulé',
}

export function NotificationBell() {
  const [open,         setOpen]         = useState(false)
  const [newOrders,    setNewOrders]    = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading,      setLoading]      = useState(false)
  const dropdownRef = useRef(null)
  const lastSeenRef = useRef(
  typeof window !== 'undefined'
    ? localStorage.getItem(STORAGE_KEY) || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
)

  const update = useCallback((orders) => {
    // Nouvelles commandes depuis la dernière consultation
    const unseen = orders.filter(o =>
      new Date(o.createdAt) > new Date(lastSeenRef.current) &&
      o.status !== 'CANCELLED'
    )
    setNewOrders(unseen)
    setRecentOrders(orders)
  }, [])

  // Reçoit la liste des commandes à chaque interrogation
  useEffect(() => {
    if (typeof window !== 'undefined' && window.__skanemaOrders) update(window.__skanemaOrders)
    const onOrders = (e) => update(e.detail || [])
    window.addEventListener('skanema:orders', onOrders)
    return () => window.removeEventListener('skanema:orders', onOrders)
  }, [update])

  // Ferme le dropdown en cliquant dehors
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    setOpen(o => !o)
    if (!open) {
      // Marque comme lu
      const now = new Date().toISOString()
      lastSeenRef.current = now
      localStorage.setItem(STORAGE_KEY, now)
      setNewOrders([])
    }
  }

  const count = newOrders.length

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton cloche */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white
                           text-2xs font-bold rounded-full flex items-center justify-center px-1
                           animate-pulse">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100
                        rounded-2xl shadow-xl z-50 overflow-hidden"
             style={{ animation: 'fadeDown 0.15s ease' }}>
          <style>{`@keyframes fadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <span className="text-xs bg-red-50 text-red-600 font-medium px-2 py-0.5 rounded-full">
                  {count} nouvelle{count > 1 ? 's' : ''}
                </span>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Liste commandes */}
          <div className="max-h-80 overflow-y-auto">
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <ShoppingBag size={24} className="text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Aucune commande récente</p>
              </div>
            ) : recentOrders.map(order => {
              const isNew = new Date(order.createdAt) > new Date(lastSeenRef.current)
              return (
                <a
                  key={order._id}
                  href="/dashboard/commandes"
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50
                             last:border-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                    isNew ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isNew ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <ShoppingBag size={14} className={isNew ? 'text-blue-600' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {order.orderNumber}
                      </p>
                      <span className={`text-2xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'
                      }`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatFCFA(order.total)} · {order.customerPhone}
                    </p>
                    <p className="text-2xs text-gray-400 mt-0.5">{timeAgo(order.createdAt)}</p>
                  </div>
                  {isNew && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                  )}
                </a>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <a
              href="/dashboard/commandes"
              className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors
                         flex items-center justify-center gap-1.5"
            >
              Voir toutes les commandes →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
