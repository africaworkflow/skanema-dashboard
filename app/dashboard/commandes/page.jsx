'use client'
import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { getOrders, updateOrder } from '@/lib/api'
import { OPEN_ORDER_EVENT } from '@/components/ui/NewOrderAlert'
import { formatFCFA, formatDate, STATUS_LABELS } from '@/lib/utils'
import {
  ShoppingBag, Search, Filter, ChevronDown,
  Loader2, RefreshCw, Phone, MapPin, Clock
} from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '',                label: 'Tous les statuts' },
  { value: 'PENDING_PAYMENT', label: 'En attente paiement' },
  { value: 'PAID',            label: 'Payé' },
  { value: 'CONFIRMED',       label: 'Confirmé' },
  { value: 'PREPARING',       label: 'En préparation' },
  { value: 'DELIVERING',      label: 'En livraison' },
  { value: 'DELIVERED',       label: 'Livré' },
  { value: 'CANCELLED',       label: 'Annulé' },
]

const NEXT_STATUS = {
  PAID      : 'CONFIRMED',
  CONFIRMED : 'PREPARING',
  PREPARING : 'DELIVERING',
  DELIVERING: 'DELIVERED',
}

const NEXT_LABEL = {
  PAID      : 'Confirmer',
  CONFIRMED : 'Démarrer préparation',
  PREPARING : 'Envoyer en livraison',
  DELIVERING: 'Marquer livré',
}

export default function CommandesPage() {
  const [orders,    setOrders]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [status,    setStatus]    = useState('')
  const [page,      setPage]      = useState(1)
  const [total,     setTotal]     = useState(0)
  const [expanded,  setExpanded]  = useState(null)
  const [updating,  setUpdating]  = useState(null)
  const LIMIT = 15

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getOrders({ page, limit: LIMIT, status: status || undefined })
      setOrders(res.data.data || [])
      setTotal(res.data.total || 0)
    } catch (_) {}
    finally { setLoading(false) }
  }, [page, status])

  useEffect(() => { load() }, [load])

  // Ouvre la commande choisie depuis l'alerte « Nouvelle commande »
  const openFromAlert = useCallback((id) => {
    if (!id) return
    setSearch(''); setStatus(''); setPage(1); setExpanded(id)
    load()
  }, [load])
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('commande')
    if (id) {
      setExpanded(id)
      window.history.replaceState(null, '', window.location.pathname)
    }
    const onOpen = (e) => openFromAlert(e.detail)
    window.addEventListener(OPEN_ORDER_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_ORDER_EVENT, onOpen)
  }, [openFromAlert])

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdating(orderId)
    try {
      await updateOrder(orderId, { status: newStatus })
      await load()
    } catch (_) {}
    finally { setUpdating(null) }
  }

  const filtered = search
    ? orders.filter(o =>
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.customerPhone.includes(search)
      )
    : orders

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <DashboardLayout
      title="Commandes"
      subtitle={`${total} commande${total > 1 ? 's' : ''} au total`}
      actions={
        <button onClick={load} className="btn-ghost flex items-center gap-1.5">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      }
    >
      <div className="space-y-4">

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par numéro ou téléphone…"
              className="input pl-8"
            />
          </div>
          <div className="relative">
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1) }}
              className="input pr-8 appearance-none cursor-pointer min-w-[180px]"
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Aucune commande trouvée"
            description="Les commandes apparaissent ici dès qu'un client passe commande via WhatsApp."
          />
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {filtered.map((order, i) => {
              const s           = STATUS_LABELS[order.status] || STATUS_LABELS.PAID
              const badgeVar    = s.badge.replace('badge-', '')
              const isExpanded  = expanded === order._id
              const nextStatus  = NEXT_STATUS[order.status]
              const nextLabel   = NEXT_LABEL[order.status]

              return (
                <div key={order._id} className={i < filtered.length - 1 ? 'border-b border-gray-50' : ''}>
                  {/* Ligne principale */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : order._id)}
                    className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-gray-50 transition-colors text-left gap-3"
                  >
                    {/* Infos gauche */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {order.orderNumber}
                        </p>
                        {/* Badge visible seulement sur desktop inline */}
                        <span className="hidden sm:inline">
                          <Badge variant={badgeVar}>{s.label}</Badge>
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Phone size={10} />
                          {order.customerPhone}
                        </span>
                        <span className="hidden sm:inline text-gray-200">·</span>
                        <span className="text-xs text-gray-400">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      {/* Badge mobile sous les infos */}
                      <div className="sm:hidden mt-1.5">
                        <Badge variant={badgeVar}>{s.label}</Badge>
                      </div>
                    </div>

                    {/* Montant + chevron droite */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                        {formatFCFA(order.total)}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`text-gray-300 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  {/* Détail expandable */}
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-4 bg-gray-50/50 border-t border-gray-50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">

                        {/* Articles */}
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Articles commandés</p>
                          <div className="space-y-3">
                            {order.items?.map((item, j) => {
                              const unitPrice   = item.unitPrice || item.price
                              const realSubtotal = unitPrice * item.quantity
                              const hasOptions   = item.options?.length > 0
                              const extraTotal   = unitPrice - item.price

                              return (
                                <div key={j} className={hasOptions ? 'bg-white rounded-lg p-2.5 border border-gray-100' : ''}>
                                  {/* Nom + total */}
                                  <div className="flex justify-between text-xs">
                                    <span className="font-medium text-gray-900">
                                      {item.name}
                                      <span className="text-gray-400 font-normal ml-1">×{item.quantity}</span>
                                    </span>
                                    <span className="font-semibold text-gray-900 ml-2 flex-shrink-0">
                                      {formatFCFA(realSubtotal)}
                                    </span>
                                  </div>

                                  {/* Détail options */}
                                  {hasOptions && (
                                    <div className="mt-1.5 space-y-0.5">
                                      <div className="flex justify-between text-2xs text-gray-400">
                                        <span>Prix de base</span>
                                        <span>{formatFCFA(item.price)}</span>
                                      </div>
                                      {item.options.map((opt, oi) => (
                                        <div key={oi}>
                                          {opt.choices.map((choice, ci) => (
                                            <div key={ci} className="flex justify-between text-2xs text-gray-500">
                                              <span className="flex items-center gap-1">
                                                <span className="text-gray-300">+</span> {choice}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      ))}
                                      {extraTotal > 0 && (
                                        <div className="flex justify-between text-2xs font-medium text-gray-700 border-t border-gray-100 pt-1 mt-1">
                                          <span>Total / unité</span>
                                          <span>{formatFCFA(unitPrice)}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                          <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>Sous-total</span>
                              <span>{formatFCFA(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>Livraison</span>
                              <span>{formatFCFA(order.deliveryFee)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium text-gray-900">
                              <span>Total</span>
                              <span>{formatFCFA(order.total)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Infos livraison */}
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Livraison</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                              Zone {order.location?.zoneName || order.location?.zone || '—'}
                            </div>
                            {order.estimatedDeliveryTime && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Clock size={12} className="text-gray-400 flex-shrink-0" />
                                Estimée à {new Date(order.estimatedDeliveryTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Phone size={12} className="text-gray-400 flex-shrink-0" />
                              {order.customerPhone}
                            </div>
                          </div>

                          {/* Action bouton */}
                          {nextStatus && (
                            <button
                              onClick={() => handleUpdateStatus(order._id, nextStatus)}
                              disabled={updating === order._id}
                              className="btn-primary mt-4 w-full flex items-center justify-center gap-2 text-xs py-2"
                            >
                              {updating === order._id && <Loader2 size={12} className="animate-spin" />}
                              {nextLabel}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Page {page} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-40"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
