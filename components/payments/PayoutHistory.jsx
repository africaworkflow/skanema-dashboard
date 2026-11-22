'use client'
import { useEffect, useState } from 'react'
import { Loader2, Download } from 'lucide-react'
import { getPayouts, exportPayouts } from '@/lib/api'

const OPS = { wave: 'Wave', om: 'Orange Money' }
const fcfa = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`
const fmtPhone = (p) => String(p || '').replace(/^(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4')
const hour = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Dakar' })
const dayHour = (d, period) => (period === 'today' ? hour(d)
  : `${new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', ...(period === 'custom' ? { year: '2-digit' } : {}), timeZone: 'Africa/Dakar' })} ${hour(d)}`)

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

// Total encaissé sur une période, avec le détail en ligne / espèces
function TotalCard({ label, block, dark }) {
  const sub = dark ? 'text-gray-300 sm:text-gray-600' : 'text-gray-600'
  return (
    <div className={dark ? 'bg-gray-900 sm:bg-white text-white sm:text-gray-900 sm:border sm:border-gray-100 rounded-xl p-5' : 'bg-white border border-gray-100 rounded-xl p-5 text-gray-900'}>
      <p className={`text-xs font-medium ${dark ? 'text-gray-300 sm:text-gray-500' : 'text-gray-500'}`}>{label}</p>
      <p className="mt-2 text-2xl font-semibold">{block ? fcfa(block.total) : '—'}</p>
      <dl className={`mt-3 pt-2.5 border-t grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-sm ${dark ? 'border-gray-700 sm:border-gray-100' : 'border-gray-100'}`}>
        <dt className={sub}>Reçu en ligne</dt><dd className="font-semibold text-right">{block ? fcfa(block.online) : '—'}</dd>
        <dt className={sub}>Espèces (livrées)</dt><dd className="font-semibold text-right">{block ? fcfa(block.cash) : '—'}</dd>
      </dl>
    </div>
  )
}

const SELECT = 'text-sm sm:text-xs px-2.5 py-2 sm:py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900'

// Historique de ce que le restaurant a encaissé : paiements en ligne et commandes en espèces livrées
// online = { platform, active } : Skanema encaisse (numéro de réception) ou état du paiement en ligne
export function PayoutHistory({ payout, online, onSettings }) {
  const [period, setPeriod] = useState('today')
  const [method, setMethod] = useState('')
  const [status, setStatus] = useState('')
  const [data, setData]     = useState(null)
  const [error, setError]   = useState('')
  const [exporting, setExporting] = useState(false)

  const [from, setFrom]     = useState('')
  const [to, setTo]         = useState('')

  const custom = period === 'custom'
  const ready  = !custom || Boolean(from && to && from <= to)   // dates au choix : attendre les deux dates
  const params = { period, ...(custom ? { from, to } : {}), ...(method ? { method } : {}), ...(status ? { status } : {}) }

  useEffect(() => {
    if (!ready) return
    let live = true
    setError('')
    getPayouts(params)
      .then((r) => live && setData(r.data))
      .catch((e) => live && (setData((d) => d && { ...d, payouts: [] }), setError(e?.response?.status === 400 ? 'Choisissez une période d\'un an au plus.' : 'Historique indisponible. Réessayez.')))
    return () => { live = false }
  }, [period, from, to, method, status]) // eslint-disable-line react-hooks/exhaustive-deps

  const today = new Date().toISOString().slice(0, 10)
  const download = async () => {
    setExporting(true); setError('')
    try {
      const r = await exportPayouts(params)
      const url = URL.createObjectURL(new Blob([r.data], { type: 'text/csv;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      const label = { today, '7d': `7-jours-${today}`, month: `mois-en-cours-${today}`, last_month: `mois-dernier-${today}`, year: `annee-${today.slice(0, 4)}`, custom: from === to ? from : `${from}_${to}` }[period]
      a.download = `skanema-paiements-${label}.csv`
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (_) { setError('Export impossible. Réessayez.') }
    finally { setExporting(false) }
  }

  const s = data?.summary
  const rows = ready ? data?.payouts || [] : []
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TotalCard label="Encaissé aujourd'hui" block={s?.today} dark />
        <TotalCard label="Encaissé ce mois-ci" block={s?.month} />
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          {online?.platform ? (
            <>
              <p className="text-xs font-medium text-gray-500">Votre argent arrive sur</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{payout ? `${OPS[payout.operator]} · ${fmtPhone(payout.phone)}` : 'Aucun numéro vérifié'}</p>
              <button onClick={onSettings} className="mt-1.5 py-1 text-xs font-medium text-gray-900 underline">Modifier dans Réglages</button>
            </>
          ) : (
            <>
              <p className="text-xs font-medium text-gray-500">Paiement en ligne</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{online?.active ? 'Activé' : 'Pas encore activé'}</p>
              <button onClick={onSettings} className="mt-1.5 py-1 text-xs font-medium text-gray-900 underline">Voir dans Réglages</button>
            </>
          )}
        </div>
      </div>

      <section className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Historique</h2>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-600">Période
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className={SELECT}>
                <option value="today">Aujourd'hui</option><option value="7d">7 derniers jours</option><option value="month">Ce mois-ci</option>
                <option value="last_month">Mois dernier</option><option value="year">Cette année</option><option value="custom">Dates au choix</option>
              </select>
            </label>
            {custom && (
              <>
                <label className="flex items-center gap-1.5 text-xs text-gray-600">Du
                  <input type="date" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} className={SELECT} />
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-600">Au
                  <input type="date" value={to} min={from || undefined} max={today} onChange={(e) => setTo(e.target.value)} className={SELECT} />
                </label>
              </>
            )}
            <label className="flex items-center gap-1.5 text-xs text-gray-600">Moyen
              <select value={method} onChange={(e) => setMethod(e.target.value)} className={SELECT}>
                <option value="">Tous</option><option value="online">En ligne</option><option value="cash">Espèces</option>
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-600">Statut
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={SELECT}>
                <option value="">Tous</option><option value="received">Reçus</option><option value="sending">En cours</option><option value="checking">En vérification</option>
              </select>
            </label>
            <button type="button" onClick={download} disabled={exporting || !rows.length}
              className="inline-flex items-center gap-1.5 text-sm sm:text-xs font-medium px-3 py-2 sm:py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 disabled:opacity-50">
              {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Exporter (Excel)
            </button>
          </div>
        </div>

        {!data && !error && <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-gray-300" /></div>}
        {error && <p className="px-5 py-6 text-xs text-red-600">{error}</p>}
        {data && ready && !error && !rows.length && <p className="px-5 py-8 text-sm text-gray-500 text-center">Aucun paiement sur cette période.</p>}

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
                    <tr key={`${p.kind}-${p.id}`} className="border-t border-gray-100">
                      <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{dayHour(p.at, period)}</td>
                      <td className="px-3 py-3.5 font-mono text-xs whitespace-nowrap">{p.orderNumber}</td>
                      <td className="px-3 py-3.5">{p.methodLabel}</td>
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
                <li key={`${p.kind}-${p.id}`} className="px-4 py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-600">{dayHour(p.at, period)} · {p.methodLabel} · <span className="font-mono">{p.orderNumber}</span></span>
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
      </section>
    </div>
  )
}
