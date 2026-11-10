'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Bell, Volume2 } from 'lucide-react'
import { getOrders } from '@/lib/api'

// Alerte plein écran à chaque nouvelle commande à traiter, pour ne rien rater au comptoir.
// - Une seule interrogation des commandes pour tout le dashboard (toutes les 10 s) ;
//   la cloche reçoit la liste par l'événement « skanema:orders ».
// - Alerte seulement pour une commande payée (Wave) ou une commande cash confirmée,
//   jamais pour une commande encore en attente de paiement.
// - Le son se répète toutes les 10 s jusqu'à « OK, vu » ou « Voir la commande ».
// - Application installée : titre de la fenêtre qui clignote et pastille avec le nombre de commandes.

const POLL_MS       = 10000
const RING_MS       = 10000
const MAX_AGE_MS    = 12 * 60 * 60 * 1000 // on n'alerte pas pour une vieille commande
const SEEN_KEY      = 'skanema_alerted_orders'
const SEEN_MAX      = 300
const ORDERS_EVENT  = 'skanema:orders'
export const OPEN_ORDER_EVENT = 'skanema:open-order'
const SOUND_URL    = '/notification.mp3'
// 0,05 s de silence : sert à débloquer le son au premier toucher sans rien faire entendre
const SILENCE      = 'data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA'

const needsAlert = (o) =>
  o.status === 'PAID' || (o.status === 'CONFIRMED' && o.payment?.provider === 'cash')

function readSeen() {
  try { const v = JSON.parse(localStorage.getItem(SEEN_KEY)); return Array.isArray(v) ? v : null } catch (_) { return null }
}
function writeSeen(ids) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-SEEN_MAX))) } catch (_) {}
}

const nf = (v) => new Intl.NumberFormat('fr-FR').format(Math.round(v || 0)).replace(/\u202f/g, '\u00a0')
function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60)   return 'à l’instant'
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
  return `il y a ${Math.floor(s / 3600)} h`
}

export function NewOrderAlert() {
  const router   = useRouter()
  const pathname = usePathname()
  const [alerts,  setAlerts]  = useState([])   // commandes à signaler, la plus ancienne d'abord
  const [blocked, setBlocked] = useState(false) // son bloqué par le navigateur
  const [, tick]  = useState(0)
  const audioRef  = useRef(null)
  const alertIds  = alerts.map((o) => o._id).join(',')
  const firstBtn  = useRef(null)

  const getAudio = () => {
    if (!audioRef.current && typeof Audio !== 'undefined') {
      audioRef.current = new Audio(SOUND_URL)
      audioRef.current.volume = 0.9
    }
    return audioRef.current
  }

  const ring = useCallback(() => {
    const a = getAudio()
    if (!a) return
    try {
      if (!a.src.endsWith(SOUND_URL)) a.src = SOUND_URL
      a.currentTime = 0
      const p = a.play()
      if (p && p.then) p.then(() => setBlocked(false)).catch((e) => { if (e?.name === 'NotAllowedError') setBlocked(true) })
    } catch (_) {}
  }, [])

  // ── Interrogation des commandes ──
  const poll = useCallback(async () => {
    try {
      const res    = await getOrders({ limit: 10, page: 1 })
      const orders = res.data.data || []
      try { window.__skanemaOrders = orders; window.dispatchEvent(new CustomEvent(ORDERS_EVENT, { detail: orders })) } catch (_) {}

      const seen = readSeen()
      if (seen === null) { writeSeen(orders.map((o) => o._id)); return } // première ouverture : rien d'ancien n'est signalé

      const fresh = orders
        .filter((o) => needsAlert(o) && !seen.includes(o._id) && Date.now() - new Date(o.createdAt) < MAX_AGE_MS)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      setAlerts(fresh)
    } catch (_) {}
  }, [])

  useEffect(() => {
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => clearInterval(id)
  }, [poll])

  // Une validation faite dans un autre onglet ferme l'alerte ici aussi
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== SEEN_KEY) return
      const seen = readSeen() || []
      setAlerts((list) => list.filter((o) => !seen.includes(o._id)))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Débloque le son au premier geste sur la page (le navigateur l'exige).
  // On joue un court silence dans le même lecteur, puis on remet le son des pièces :
  // couper le volume (muted) ne suffit pas sur iPhone, où le son des pièces sortait au premier toucher.
  useEffect(() => {
    const unlock = () => {
      const a = getAudio()
      if (a && a.paused) {
        a.src = SILENCE
        const restore = () => { try { if (a.src === SILENCE) { a.pause(); a.src = SOUND_URL; a.load() } } catch (_) {} }
        try {
          const p = a.play()
          if (p && p.then) p.then(restore, restore)
          else restore()
        } catch (_) { restore() }
      }
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock) }
  }, [])

  // ── Son répété, titre qui clignote, pastille d'application ──
  const count = alerts.length
  const prevIds = useRef('')
  useEffect(() => {
    if (!count) { prevIds.current = ''; return }
    // Sonne tout de suite si une commande vient d'arriver, puis toutes les 10 s
    const arrived = alertIds.split(',').some((id) => !prevIds.current.split(',').includes(id))
    prevIds.current = alertIds
    if (arrived) ring()
    const id = setInterval(ring, RING_MS)
    return () => clearInterval(id)
  }, [alertIds, count, ring])

  useEffect(() => {
    if (!count) return
    const original = document.title
    const flash = count > 1 ? `🔴 ${count} nouvelles commandes` : '🔴 Nouvelle commande'
    let on = false
    const id = setInterval(() => { on = !on; document.title = on ? flash : original }, 1000)
    try { navigator.setAppBadge?.(count)?.catch?.(() => {}) } catch (_) {}
    return () => {
      clearInterval(id)
      document.title = original
      try { navigator.clearAppBadge?.()?.catch?.(() => {}) } catch (_) {}
    }
  }, [count])

  // Temps écoulé mis à jour, focus sur le bouton principal
  useEffect(() => {
    if (!count) return
    const id = setInterval(() => tick((t) => t + 1), 15000)
    firstBtn.current?.focus()
    return () => clearInterval(id)
  }, [count])

  const acknowledge = useCallback(() => {
    const seen = readSeen() || []
    writeSeen([...seen, ...alerts.map((o) => o._id).filter((id) => !seen.includes(id))])
    const a = audioRef.current
    if (a) { try { a.pause(); a.currentTime = 0 } catch (_) {} }
    setAlerts([])
  }, [alerts])

  const openOrder = () => {
    const id = alerts[0]?._id
    acknowledge()
    if (!id) return
    if (pathname === '/dashboard/commandes') {
      window.dispatchEvent(new CustomEvent(OPEN_ORDER_EVENT, { detail: id }))
    } else {
      router.push(`/dashboard/commandes?commande=${id}`)
    }
  }

  // Échap = « OK, vu »
  useEffect(() => {
    if (!count) return
    const onKey = (e) => { if (e.key === 'Escape') acknowledge() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [count, acknowledge])

  if (!count) return null

  const o      = alerts[0]
  const items  = o.items || []
  const shown  = items.slice(0, 4)
  const hidden = items.length - shown.length
  const zone   = o.location?.zoneName || o.location?.zone
  const isCash = o.payment?.provider === 'cash'
  const others = count - 1

  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="noa-title" aria-describedby="noa-desc"
      className="noa fixed inset-0 z-[100] overflow-y-auto text-white">
      <style>{`
        .noa{background:#DC2626;animation:noaPulse 1.6s ease-in-out infinite}
        @keyframes noaPulse{0%,100%{background:#DC2626}50%{background:#B91C1C}}
        .noa-ring:after{content:"";position:absolute;inset:-10px;border-radius:9999px;border:3px solid rgba(255,255,255,.35);animation:noaPing 1.6s ease-out infinite}
        @keyframes noaPing{0%{transform:scale(.85);opacity:1}100%{transform:scale(1.35);opacity:0}}
        @media (prefers-reduced-motion: reduce){.noa,.noa-ring:after{animation:none}}
      `}</style>

      {blocked && (
        <button onClick={ring}
          className="fixed top-4 right-4 flex items-center gap-1.5 text-sm font-semibold bg-white text-red-700 rounded-full px-3.5 py-2 shadow">
          <Volume2 size={15} /> Activer le son
        </button>
      )}

      <div className="min-h-full flex flex-col items-center justify-center text-center px-4 py-6 sm:py-10">
        <div className="noa-ring relative w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-white/20 flex items-center justify-center mb-4 sm:mb-5">
          <Bell className="w-7 h-7 sm:w-9 sm:h-9" strokeWidth={2} />
        </div>
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] opacity-90">Nouvelle commande</p>
        <h2 id="noa-title" className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-1 sm:mt-1.5 mb-1">{o.orderNumber}</h2>
        <p className="text-sm sm:text-lg opacity-90">
          {timeAgo(o.createdAt)}{zone ? ` · ${zone}` : ''}{o.customerName ? ` · ${o.customerName}` : ''}
        </p>

        <div id="noa-desc" className="w-full max-w-md my-4 sm:my-6 bg-black/15 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-left">
          {shown.map((it, i) => (
            <div key={i} className="flex justify-between gap-3 py-0.5 sm:py-1 text-sm sm:text-base">
              <span className="min-w-0 truncate">{it.quantity} × {it.name}</span>
              <span className="font-bold tabular-nums flex-shrink-0">{nf(it.subtotal ?? (it.unitPrice || it.price) * it.quantity)}</span>
            </div>
          ))}
          {hidden > 0 && <p className="py-0.5 sm:py-1 text-sm opacity-80">+ {hidden} autre{hidden > 1 ? 's' : ''} article{hidden > 1 ? 's' : ''}</p>}
          {o.deliveryFee > 0 && (
            <div className="flex justify-between gap-3 py-0.5 sm:py-1 text-sm sm:text-base">
              <span>Livraison</span><span className="font-bold tabular-nums">{nf(o.deliveryFee)}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 mt-1.5 pt-2.5 border-t border-white/25">
            <span className="text-2xl sm:text-3xl font-extrabold tabular-nums whitespace-nowrap">{nf(o.total)} FCFA</span>
            <span className="bg-white text-red-700 font-bold text-sm rounded-full px-3 py-1 whitespace-nowrap">
              {isCash ? 'Cash à la livraison' : '✓ Payé Wave'}
            </span>
          </div>
        </div>

        <div className="w-full max-w-md flex justify-center gap-3">
          <button ref={firstBtn} onClick={openOrder}
            className="flex-1 sm:flex-none bg-white text-red-700 font-extrabold text-base sm:text-lg rounded-2xl px-4 sm:px-7 py-3.5 sm:py-4 whitespace-nowrap focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60">
            Voir la commande →
          </button>
          <button onClick={acknowledge}
            className="font-semibold text-base rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 whitespace-nowrap border-2 border-white/60 hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60">
            OK, vu
          </button>
        </div>
        {others > 0 && (
          <p className="mt-3 sm:mt-4 text-sm opacity-90">+ {others} autre{others > 1 ? 's' : ''} nouvelle{others > 1 ? 's' : ''} commande{others > 1 ? 's' : ''}</p>
        )}
      </div>
    </div>
  )
}
