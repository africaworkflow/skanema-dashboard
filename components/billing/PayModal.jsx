'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { X, ArrowLeft, Loader2, CheckCircle2, Smartphone, ShieldCheck, ExternalLink, AlertTriangle } from 'lucide-react'
import { createCheckout, payWithMethod, getPaymentStatus } from '@/lib/api'
import { Flag } from './Flag'

const fcfa = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`
const day  = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—')

// Logos officiels des opérateurs : fichiers fournis par les opérateurs, déposés dans public/payments/.
// Tant qu'un fichier manque, une pastille aux couleurs de l'opérateur s'affiche à la place.
const BRAND = {
  wave  : { logo: '/payments/wave.png',         bg: '#1DC8F2', fg: '#fff', short: 'W'   },
  om    : { logo: '/payments/orange-money.png', bg: '#FF7900', fg: '#fff', short: 'OM'  },
  mtn   : { logo: '/payments/mtn-momo.png',     bg: '#FFCB05', fg: '#111', short: 'MTN' },
  moov  : { logo: '/payments/moov-money.png',   bg: '#0066B3', fg: '#fff', short: 'M'   },
  tmoney: { logo: '/payments/mixx-by-yas.png',  bg: '#FFE600', fg: '#111', short: 'Mx'  },
}
const brandOf = (id) => BRAND[id.split('_')[0]] || { bg: '#111', fg: '#fff', short: '?' }

function OperatorLogo({ id, size = 36 }) {
  const b = brandOf(id)
  const [failed, setFailed] = useState(!b.logo)
  if (failed) return (
    <span className="rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ width: size, height: size, background: b.bg, color: b.fg }}>{b.short}</span>
  )
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={b.logo} alt="" width={size} height={size} onError={() => setFailed(true)} className="rounded-lg object-contain flex-shrink-0 bg-white" style={{ width: size, height: size }} />
}

// Ce que le client doit faire, par moyen de paiement
const CODE_HINT = {
  om_sn_code: <>Composez <b>#144#391#</b> sur votre téléphone Orange, saisissez votre code secret : vous recevez un code de paiement par SMS.</>,
  om_ci     : <>Composez <b>#144*82#</b>, choisissez l'option <b>2</b> et saisissez votre code secret : vous recevez un code de paiement.</>,
  om_bf     : <>Générez un code de paiement depuis votre menu Orange Money (<b>*144#</b>), puis saisissez-le ici.</>,
  om_ml     : <>Générez un code de paiement depuis votre menu Orange Money (<b>#144#</b>), puis saisissez-le ici.</>,
}
const WAIT_HINT = {
  moov_bf: <>Composez <b>*555*6#</b> sur votre téléphone pour finaliser le paiement.</>,
}
const DEFAULT_WAIT = <>Une demande de paiement arrive sur votre téléphone (notification ou SMS). Validez-la avec votre code secret.</>

const isMobile = () => typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

export function PayModal({ plan, countries, payer, onClose, onPaid }) {
  const startCountry = countries.find((c) => c.code === payer?.country)?.code || countries[0]?.code
  const [country, setCountry] = useState(startCountry)
  const [method,  setMethod]  = useState('')     // id de base de la tuile choisie
  const [variant, setVariant] = useState('')     // Orange Money Sénégal : application ou code
  const [step,    setStep]    = useState('choose') // choose | form | wait | done
  const [form,    setForm]    = useState({ name: '', phone: '', code: '' })
  const [busy,    setBusy]    = useState(false)
  const [error,   setError]   = useState('')
  const [waitMsg, setWaitMsg] = useState('')
  const [until,   setUntil]   = useState(null)
  const paymentId = useRef(null)
  const poll = useRef(null)

  const c = countries.find((x) => x.code === country) || countries[0]

  // Tuiles : une seule par opérateur (« om_sn » et « om_sn_code » ne font qu'une)
  const tiles = useMemo(() => (c?.methods || []).filter((m) => !m.id.endsWith('_code')), [c])
  const variantOf = (id) => (c?.methods || []).find((m) => m.id === `${id}_code`)
  const selected = (c?.methods || []).find((m) => m.id === (variant || method))

  // Pré-remplit le numéro du restaurant s'il est du bon pays
  useEffect(() => {
    if (!c || !payer?.phone) return
    const d = payer.phone.replace(/\D/g, '')
    if (d.startsWith(c.dial)) setForm((f) => (f.phone ? f : { ...f, phone: d.slice(c.dial.length) }))
  }, [c, payer])

  useEffect(() => () => clearTimeout(poll.current), [])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && step !== 'wait') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose, step])

  // Une facture par ouverture de la fenêtre, réutilisée si le client réessaie
  const ensurePayment = async () => {
    if (paymentId.current) return paymentId.current
    const r = await createCheckout(plan.id)
    paymentId.current = r.data.paymentId
    return paymentId.current
  }

  const pickCountry = (code) => { setCountry(code); setMethod(''); setVariant(''); setError('') }
  const pickMethod = (id) => {
    setMethod(id); setError('')
    setVariant('')
    setStep('form')
  }

  const startPolling = (id) => {
    let tries = 0
    const tick = async () => {
      tries += 1
      try {
        const r = await getPaymentStatus(id)
        if (r.data.status === 'completed') { setUntil(r.data.payment.periodEnd); setStep('done'); onPaid(); return }
        if (r.data.status === 'failed' || r.data.status === 'cancelled') {
          paymentId.current = null
          setError('Le paiement a été refusé ou annulé. Aucun montant n\'a été débité : vous pouvez réessayer.')
          setStep('form'); return
        }
      } catch (_) { /* réseau : on réessaie */ }
      if (tries < 60) poll.current = setTimeout(tick, 3000)
      else setWaitMsg('slow')
    }
    poll.current = setTimeout(tick, 3000)
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const id = await ensurePayment()
      const r = await payWithMethod(id, { method: selected.id, name: form.name, phone: form.phone, code: form.code })
      if (r.data.flow === 'redirect') {
        const app = r.data.appUrls?.maxit || r.data.appUrls?.om
        window.location.href = isMobile() && app ? app : r.data.url
        return
      }
      setWaitMsg(r.data.message || '')
      setStep('wait')
      startPolling(id)
    } catch (err) {
      const status = err.response?.status
      if (status === 409 || status === 410) paymentId.current = null
      setError(err.response?.data?.message || 'Le paiement n\'a pas pu démarrer. Vérifiez votre connexion et réessayez.')
    } finally { setBusy(false) }
  }

  const hosted = async () => {
    setBusy(true); setError('')
    try {
      paymentId.current = null
      const r = await createCheckout(plan.id)
      window.location.href = r.data.url
    } catch (err) {
      setError(err.response?.data?.message || 'Le paiement n\'a pas pu démarrer.'); setBusy(false)
    }
  }

  const backToChoice = () => { clearTimeout(poll.current); setStep('choose'); setError(''); setWaitMsg('') }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && step !== 'wait') onClose() }}>
      <div role="dialog" aria-modal="true" aria-label="Paiement de l'abonnement" className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto">
        {/* En-tête */}
        <div className="sticky top-0 bg-white flex items-center gap-2 px-5 pt-4 pb-3 border-b border-gray-50 z-10">
          {step === 'form' && (
            <button onClick={backToChoice} aria-label="Retour" className="p-1 -ml-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"><ArrowLeft size={18} /></button>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Abonnement {plan.name}</p>
            <p className="text-xs text-gray-400">{fcfa(plan.price)} · 30 jours</p>
          </div>
          {step !== 'wait' && (
            <button onClick={onClose} aria-label="Fermer" className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"><X size={18} /></button>
          )}
        </div>

        <div className="px-5 py-5">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 mb-4">
              <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" /><p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* 1. Pays + opérateur */}
          {step === 'choose' && (
            <>
              <p className="text-xs font-medium text-gray-500 mb-2" id="pay-country">Pays du compte mobile money</p>
              <div className="grid grid-cols-3 gap-2 mb-5" role="radiogroup" aria-labelledby="pay-country">
                {countries.map((x) => {
                  const on = x.code === country
                  return (
                    <button key={x.code} type="button" role="radio" aria-checked={on} onClick={() => pickCountry(x.code)}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl px-1.5 py-2.5 border transition-colors ${on ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-400'}`}>
                      <Flag code={x.code} className="w-7 h-[19px]" />
                      <span className={`text-[11px] leading-tight text-center ${on ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{x.name}</span>
                    </button>
                  )
                })}
              </div>

              <p className="text-xs font-medium text-gray-500 mb-2">Payer avec</p>
              <div className="grid grid-cols-2 gap-2.5" data-testid="operators">
                {tiles.map((m) => (
                  <button key={m.id} onClick={() => pickMethod(m.id)}
                    className="flex items-center gap-2.5 border border-gray-200 rounded-xl px-3 py-3 text-left hover:border-gray-900 hover:bg-gray-50 transition-colors">
                    <OperatorLogo id={m.id} />
                    <span className="text-sm font-medium text-gray-900 leading-tight">{m.label}</span>
                  </button>
                ))}
              </div>

              <button onClick={hosted} disabled={busy} className="mt-5 w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-50">
                {busy ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />} Carte bancaire ou autre moyen de paiement
              </button>
            </>
          )}

          {/* 2. Coordonnées */}
          {step === 'form' && selected && (
            <form onSubmit={submit} className="space-y-4">
              <div className="flex items-center gap-2.5">
                <OperatorLogo id={method} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{tiles.find((t) => t.id === method)?.label}</p>
                  <p className="flex items-center gap-1.5 text-xs text-gray-400"><Flag code={c.code} className="w-4 h-[11px]" />{c.name}</p>
                </div>
              </div>

              {variantOf(method) && (
                <div className="grid grid-cols-2 gap-1 bg-gray-100 rounded-xl p-1" role="tablist">
                  {[['', 'Application Max it'], [`${method}_code`, 'Code par USSD']].map(([v, l]) => (
                    <button type="button" key={l} role="tab" aria-selected={variant === v} onClick={() => setVariant(v)}
                      className={`py-2 rounded-lg text-xs font-medium transition-colors ${variant === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{l}</button>
                  ))}
                </div>
              )}

              <div>
                <label htmlFor="pay-name" className="block text-xs font-medium text-gray-500 mb-1.5">Nom du titulaire du compte</label>
                <input id="pay-name" required minLength={2} maxLength={80} autoComplete="name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex. Awa Diop"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
              </div>

              <div>
                <label htmlFor="pay-phone" className="block text-xs font-medium text-gray-500 mb-1.5">Numéro {tiles.find((t) => t.id === method)?.label}</label>
                <div className="flex items-stretch border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-gray-900/10">
                  <span className="flex items-center px-3 bg-gray-50 text-base sm:text-sm text-gray-500 border-r border-gray-200">+{c.dial}</span>
                  <input id="pay-phone" required inputMode="tel" autoComplete="tel-national" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={c.example}
                    className="flex-1 min-w-0 px-3 py-2.5 text-base sm:text-sm focus:outline-none" />
                </div>
              </div>

              {selected.needsCode && (
                <div>
                  <div className="flex items-start gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5 mb-2.5 text-xs text-orange-900 leading-relaxed">
                    <Smartphone size={14} className="flex-shrink-0 mt-0.5" /><span>{CODE_HINT[selected.id] || 'Générez un code de paiement depuis votre menu mobile money, puis saisissez-le ici.'}</span>
                  </div>
                  <label htmlFor="pay-code" className="block text-xs font-medium text-gray-500 mb-1.5">Code de paiement</label>
                  <input id="pay-code" required inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, '') })} placeholder="••••••"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                </div>
              )}

              {selected.flow === 'redirect' && (
                <p className="text-xs text-gray-400 leading-relaxed">
                  {method.startsWith('wave') ? 'Vous serez dirigé vers Wave pour confirmer, puis ramené ici automatiquement.' : 'Vous serez dirigé vers Orange Money (Max it) pour confirmer, puis ramené ici.'}
                </p>
              )}

              <button type="submit" disabled={busy}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-60">
                {busy && <Loader2 size={15} className="animate-spin" />} Payer {fcfa(plan.price)}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-2xs text-gray-400"><ShieldCheck size={12} /> Paiement sécurisé par PayDunya · Sans engagement</p>
            </form>
          )}

          {/* 3. Validation sur le téléphone */}
          {step === 'wait' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-gray-50 flex items-center justify-center mb-4 relative">
                <Smartphone size={24} className="text-gray-700" />
                <Loader2 size={56} className="absolute inset-0 animate-spin text-gray-200" strokeWidth={1} />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Validez le paiement sur votre téléphone</p>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">{WAIT_HINT[selected?.id] || (selected?.needsCode ? 'Votre code a été transmis. La confirmation arrive dans quelques secondes.' : DEFAULT_WAIT)}</p>
              {waitMsg && waitMsg !== 'slow' && <p className="text-xs text-gray-400 mt-3 italic">« {waitMsg} »</p>}
              {waitMsg === 'slow' ? (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2.5 mt-4">La confirmation prend plus de temps que prévu. Si vous avez validé, votre abonnement s'activera automatiquement dans quelques minutes.</p>
              ) : (
                <p className="text-2xs text-gray-400 mt-4">En attente de la confirmation de l'opérateur…</p>
              )}
              <button onClick={backToChoice} className="mt-5 text-xs text-gray-500 underline hover:text-gray-900">Changer de moyen de paiement</button>
            </div>
          )}

          {/* 4. Confirmé */}
          {step === 'done' && (
            <div className="text-center py-4">
              <CheckCircle2 size={44} className="mx-auto text-green-500 mb-3" />
              <p className="text-base font-semibold text-gray-900">Paiement confirmé</p>
              <p className="text-sm text-gray-500 mt-1.5">Votre bot est actif jusqu'au <b className="text-gray-900">{day(until)}</b>.</p>
              <button onClick={onClose} className="mt-6 w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-gray-800">Terminé</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
