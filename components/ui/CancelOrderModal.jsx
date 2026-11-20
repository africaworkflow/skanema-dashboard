'use client'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cancelOrder } from '@/lib/api'
import { formatFCFA } from '@/lib/utils'

const REASONS = [
  { value: 'fake_order',   label: 'Fausse commande', hint: 'Ce numéro ne pourra plus payer en espèces chez vous, seulement par Wave ou Orange Money. S\'il est signalé par 2 restaurants différents, il ne pourra plus payer en espèces sur Skanema.' },
  { value: 'unreachable',  label: 'Client injoignable' },
  { value: 'out_of_stock', label: 'Rupture de stock' },
  { value: 'other',        label: 'Autre raison' },
]

// Annulation d'une commande payée en espèces, avec un motif. Le client est prévenu sur WhatsApp.
export function CancelOrderModal({ order, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [busy,   setBusy]   = useState(false)
  const [error,  setError]  = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!reason) { setError('Choisissez un motif.'); return }
    setBusy(true); setError('')
    try {
      await cancelOrder(order._id, reason)
      onDone()
    } catch (err) {
      setError(err.response?.data?.message || 'Annulation impossible. Réessayez.')
    } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose() }}>
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="cancel-title"
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div>
          <h2 id="cancel-title" className="text-base font-semibold text-gray-900">Annuler la commande {order.orderNumber} ?</h2>
          <p className="text-sm text-gray-500 mt-1">{formatFCFA(order.total)} · paiement en espèces · {order.customerPhone}</p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-gray-700 mb-2">Motif</legend>
          {REASONS.map((r) => (
            <label key={r.value}
              className={`flex gap-3 items-start p-3 rounded-xl cursor-pointer border ${reason === r.value ? 'border-2 border-gray-900' : 'border-gray-200'}`}>
              <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)}
                className="mt-0.5 accent-gray-900" />
              <span>
                <span className="block text-sm font-medium text-gray-900">{r.label}</span>
                {r.hint && reason === r.value && <span className="block text-xs text-gray-500 mt-1">{r.hint}</span>}
              </span>
            </label>
          ))}
        </fieldset>

        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-2xs font-semibold text-gray-500 tracking-wide">MESSAGE ENVOYÉ AU CLIENT SUR WHATSAPP</p>
          <p className="text-sm text-gray-900 mt-1">Votre commande {order.orderNumber} a été annulée par le restaurant. Pour toute question, appelez le restaurant au <span className="text-gray-500">[votre numéro]</span>.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2.5">
          <button type="button" onClick={onClose} disabled={busy} className="btn-ghost flex-1 py-2.5">Retour</button>
          <button type="submit" disabled={busy}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-60 flex items-center justify-center gap-2">
            {busy && <Loader2 size={14} className="animate-spin" />} Annuler la commande
          </button>
        </div>
      </form>
    </div>
  )
}
