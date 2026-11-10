import { clsx } from 'clsx'

export function cn(...inputs) { return clsx(inputs) }

export function formatFCFA(amount) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA'
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}

export function formatRelative(date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'à l\'instant'
  if (mins < 60) return `il y a ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `il y a ${hrs}h`
  return formatDate(date)
}

export const STATUS_LABELS = {
  PENDING_PAYMENT: { label: 'En attente paiement', badge: 'badge-gray'  },
  PAID           : { label: 'Payé',                badge: 'badge-blue'  },
  CONFIRMED      : { label: 'Confirmé',            badge: 'badge-blue'  },
  PREPARING      : { label: 'En préparation',      badge: 'badge-amber' },
  DELIVERING     : { label: 'En livraison',        badge: 'badge-amber' },
  DELIVERED      : { label: 'Livré',               badge: 'badge-green' },
  CANCELLED      : { label: 'Annulé',              badge: 'badge-red'   },
}
