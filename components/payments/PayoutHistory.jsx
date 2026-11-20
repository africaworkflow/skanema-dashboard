'use client'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { getPayouts } from '@/lib/api'

const OPS = { wave: 'Wave', om: 'Orange Money' }
const METHOD = { wave_sn: 'Wave', om_sn: 'Orange Money' }
const fcfa = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`
const fmtPhone = (p) => String(p || '').replace(/^(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4')
const hour = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Dakar' })
const dayHour = (d, period) => (period === 'today' ? hour(d) : `${new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Africa/Dakar' })} ${hour(d)}`)

const STATE = {
  received: { label: 'Reçu',            cls: 'bg-green-50 text-green-700' },
  sending : { label: 'En cours',        cls: 'bg-amber-50 text-amber-800', hint: (op) => `Envoi vers votre ${OPS[op] || 'numéro'}…` },
  waiting : { label: 'En attente',      cls: 'bg-amber-50 text-amber-800', hint: () => 'Vérifiez votre numéro dans Réglages' },
  checking: { label: 'En vérification', cls: 'bg-gray-100 text-gray-700', hint: () => 'Notre équipe s\'en occupe' },
}

function Badge({ state }) {
  const s = STATE[state] || STATE.sending
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${s.cls}`}>{s.label}</span>
}

// Historique des reversements : ce que le marchand a reçu pour chaque commande payée en ligne
export function PayoutHistory({ payout, onSettings }) {
  const [period, setPeriod] = useState('today')
  const [status, setStatus] = useState('')
  const [data, setData]     = useState(null)
  const [error, setError]   = useState('')

  useEffect(() => {
    let live = true
    setError('')
    getPayouts({ period, ...(status ? { status } : {}) })
      .then((r) => live && setData(r.data))
      .catch(() => live && setError('Historique indisponible. Réessayez.'))
    return () => { live = false }
  }, [period, status])

  const s = data?.summary
  const rows = data?.payouts || []
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-gray-900 sm:bg-white text-white sm:text-gray-900 sm:border sm:border-gray-100 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-300 sm:text-gray-500">Reçu aujourd'hui</p>
          <p className="mt-2 text-2xl font-semibold">{s ? fcfa(s.today) : '—'}</p>
          <p className="mt-1 text-xs text-gray-300 sm:text-gray-500">{s ? `${s.todayCount} reçu${s.todayCount > 1 ? 's' : ''}${s.sending ? ` · ${s.sending} en cours d'envoi` : ''}` : ''}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500">Reçu ce mois-ci</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{s ? fcfa(s.month) : '—'}</p>
          <p className="mt-1 text-xs text-gray-500">{s ? `${s.monthCount} paiement${s.monthCount > 1 ? 's' : ''} en ligne` : ''}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500">Votre argent arrive sur</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">{payout ? `${OPS[payout.operator]} · ${fmtPhone(payout.phone)}` : 'Aucun numéro vérifié'}</p>
          <button onClick={onSettings} className="mt-1.5 text-xs font-medium text-gray-900 underline">Modifier dans Réglages</button>
        </div>
      </div>

      <section className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Historique</h2>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-600">Période
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="text-sm sm:text-xs px-2.5 py-2 sm:py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900">
                <option value="today">Aujourd'hui</option><option value="7d">7 derniers jours</option><option value="month">Ce mois-ci</option>
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-600">État
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="text-sm sm:text-xs px-2.5 py-2 sm:py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900">
                <option value="">Tous</option><option value="received">Reçus</option><option value="sending">En cours</option><option value="checking">En vérification</option>
              </select>
            </label>
          </div>
        </div>

        {!data && !error && <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-gray-300" /></div>}
        {error && <p className="px-5 py-6 text-xs text-red-600">{error}</p>}
        {data && !rows.length && <p className="px-5 py-8 text-sm text-gray-500 text-center">Aucun paiement en ligne sur cette période.</p>}

        {rows.length > 0 && (
          <>
            {/* Ordinateur : tableau */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-2xs font-semibold text-gray-500 tracking-wide">
                    <th scope="col" className="px-5 py-2.5">HEURE</th>
                    <th scope="col" className="px-3 py-2.5">COMMANDE</th>
                    <th scope="col" className="px-3 py-2.5">MOYEN</th>
                    <th scope="col" className="px-3 py-2.5 text-right">MONTANT</th>
                    <th scope="col" className="px-3 py-2.5 text-right">VOUS RECEVEZ</th>
                    <th scope="col" className="px-5 py-2.5">ÉTAT</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{dayHour(p.createdAt, period)}</td>
                      <td className="px-3 py-3.5 font-mono text-xs">{p.orderNumber}</td>
                      <td className="px-3 py-3.5">{METHOD[p.method] || p.method}</td>
                      <td className="px-3 py-3.5 text-right whitespace-nowrap">{fcfa(p.orderTotal)}</td>
                      <td className="px-3 py-3.5 text-right whitespace-nowrap font-semibold">{fcfa(p.net)}</td>
                      <td className="px-5 py-3.5">
                        <Badge state={p.state} />
                        {STATE[p.state]?.hint && <p className="mt-1 text-2xs text-gray-500">{STATE[p.state].hint(p.operator)}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Téléphone : cartes */}
            <ul className="sm:hidden divide-y divide-gray-100">
              {rows.map((p) => (
                <li key={p.id} className="px-4 py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-600">{dayHour(p.createdAt, period)} · {METHOD[p.method] || p.method} · <span className="font-mono">{p.orderNumber}</span></span>
                    <Badge state={p.state} />
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-gray-600">Montant {fcfa(p.orderTotal)}</span>
                    <span className="text-base font-bold text-gray-900">{fcfa(p.net)}</span>
                  </div>
                  {STATE[p.state]?.hint && <p className="text-2xs text-gray-500">{STATE[p.state].hint(p.operator)}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="px-5 py-3.5 border-t border-gray-100 text-2xs text-gray-500">« Vous recevez » : montant après les frais. Les paiements en espèces sont dans Commandes.</p>
      </section>
    </div>
  )
}
