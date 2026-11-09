'use client'
import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, AlertTriangle, Loader2, ShieldCheck, Clock, XCircle, ExternalLink, MessageCircle } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { getBilling, getPaymentStatus, startTrial } from '@/lib/api'
import { PayModal } from '@/components/billing/PayModal'

const SUPPORT_WA = '221784632103'
const fcfa = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`
const day  = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—')
const PLAN_NAME = { basic: 'Essai', pro: 'Pro', premium: 'Premium' }
// Premium d'abord : c'est l'offre complète, Pro est l'offre pour démarrer
const ORDER   = { premium: 0, pro: 1 }
const DISPLAY = {
  premium: { badge: 'Le plus complet', tagline: 'Pour les commerces qui tournent' },
  pro    : { badge: 'Pour démarrer',   tagline: 'Une carte courte, votre quartier' },
}
const perDay = (price) => Math.round(price / 30 / 100) * 100

export default function AbonnementPage() {
  return (
    <DashboardLayout title="Abonnement" subtitle="Votre plan Skanema et vos paiements">
      <Suspense fallback={<Spinner />}><Abonnement /></Suspense>
    </DashboardLayout>
  )
}

function Spinner() {
  return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-gray-300" /></div>
}

function StatusCard({ sub }) {
  const plan = PLAN_NAME[sub.plan] || 'Basic'
  const cfg = {
    trial        : { tone: 'blue',  icon: Clock,         title: 'Essai gratuit en cours', text: `Votre essai (10 articles, 1 zone de livraison) se termine le ${day(sub.trialEnds)}. Passez à Pro ou Premium quand vous voulez : vos nouvelles limites s'appliquent dès le paiement.` },
    trial_expired: { tone: 'amber', icon: AlertTriangle, title: 'Votre essai est terminé', text: 'Votre bot WhatsApp ne prend plus de commandes. Choisissez Pro ou Premium ci-dessous pour le réactiver immédiatement.' },
    pending      : { tone: 'amber', icon: Clock,         title: `Finalisez votre abonnement ${PLAN_NAME[sub.intendedPlan] || 'Pro'}`, text: 'Votre compte est créé. Votre bot WhatsApp s\'active dès que le paiement est confirmé.' },
    active       : { tone: 'green', icon: CheckCircle2,  title: `Abonnement ${plan} actif`, text: `Votre bot fonctionne jusqu'au ${day(sub.renewsAt)}. Vous pouvez renouveler à l'avance : les 30 jours s'ajoutent à la date en cours.` },
    overdue      : { tone: 'amber', icon: AlertTriangle, title: 'Abonnement à renouveler', text: `Votre abonnement est arrivé à échéance le ${day(sub.renewsAt)}. Renouvelez avant le ${day(sub.graceEnds)} pour éviter que votre bot soit coupé.` },
    suspended    : { tone: 'red',   icon: XCircle,       title: 'Bot suspendu', text: sub.suspendedReason === 'unpaid' ? 'Votre abonnement n\'a pas été renouvelé : votre bot ne prend plus de commandes. Il repart dès le paiement confirmé.' : 'Votre compte est suspendu. Contactez-nous pour en savoir plus.' },
    cancelled    : { tone: 'red',   icon: XCircle,       title: 'Abonnement résilié', text: 'Choisissez un plan pour réactiver votre bot.' },
  }[sub.state] || { tone: 'blue', icon: Clock, title: 'Abonnement', text: '' }

  const tones = {
    blue : 'bg-blue-50 border-blue-100 text-blue-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    green: 'bg-green-50 border-green-100 text-green-800',
    red  : 'bg-red-50 border-red-100 text-red-700',
  }
  const Icon = cfg.icon
  return (
    <div className={`flex items-start gap-3 border rounded-xl p-4 ${tones[cfg.tone]}`}>
      <Icon size={18} className="flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold">{cfg.title}</p>
        <p className="text-xs mt-1 leading-relaxed opacity-90">{cfg.text}</p>
      </div>
    </div>
  )
}

function Abonnement() {
  const params = useSearchParams()
  const router = useRouter()
  const { refresh } = useAuth()
  const [data,    setData]    = useState(null)
  const [error,   setError]   = useState('')
  const [paying,  setPaying]  = useState(null)   // plan en cours de paiement (fenêtre ouverte)
  const [check,   setCheck]   = useState(null)   // { status, until } après retour de PayDunya
  const polled = useRef(false)
  const autoOpened = useRef(false)
  const [trialBusy, setTrialBusy] = useState(false)

  const load = useCallback(async () => {
    try { const r = await getBilling(); setData(r.data); setError('') }
    catch (e) { setError(e.response?.data?.message || 'Impossible de charger votre abonnement.') }
  }, [])
  useEffect(() => { load() }, [load])

  // Retour depuis PayDunya : on vérifie le paiement (jusqu'à 1 min)
  useEffect(() => {
    const id = params.get('paiement')
    if (!id || polled.current) return
    polled.current = true
    setCheck({ status: 'pending' })
    let tries = 0
    const tick = async () => {
      tries += 1
      try {
        const r = await getPaymentStatus(id)
        const status = r.data.status
        if (status === 'completed') {
          setCheck({ status, until: r.data.payment.periodEnd })
          await Promise.all([load(), refresh().catch(() => {})])
          return
        }
        if (status === 'cancelled' || status === 'failed') { setCheck({ status }); return }
      } catch (_) { /* on réessaie */ }
      if (tries < 20) setTimeout(tick, 3000)
      else setCheck({ status: 'slow' })
    }
    tick()
    router.replace('/dashboard/abonnement', { scroll: false })
  }, [params, load, refresh, router])

  const pay = (planId) => { setError(''); setPaying(data.plans.find((p) => p.id === planId)) }

  // Inscription sur Pro/Premium : la fenêtre de paiement s'ouvre directement
  useEffect(() => {
    if (!data || autoOpened.current || params.get('paiement')) return
    const wanted = params.get('payer') // seulement en arrivant de l'inscription, pas à chaque visite
    const plan = data.plans.find((p) => p.id === wanted)
    autoOpened.current = true
    if (plan && data.onlinePayment) setPaying(plan)
    if (params.get('payer')) router.replace('/dashboard/abonnement', { scroll: false })
  }, [data, params, router])

  const chooseTrial = async () => {
    setTrialBusy(true); setError('')
    try { await startTrial(); await Promise.all([load(), refresh().catch(() => {})]) }
    catch (e) { setError(e.response?.data?.message || 'Impossible de démarrer l\'essai.') }
    finally { setTrialBusy(false) }
  }
  const onPaid = useCallback(() => { load(); refresh().catch(() => {}) }, [load, refresh])

  const cancelled = params.get('annule') === '1'

  if (!data && !error) return <Spinner />

  return (
    <div className="max-w-4xl space-y-6">
      {check && <CheckBanner check={check} />}
      {cancelled && !check && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-600">Paiement annulé. Aucun montant n'a été débité.</div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertTriangle size={14} className="text-red-500 flex-shrink-0" /><p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {paying && data && (
        <PayModal plan={paying} countries={data.paymentMethods || []} payer={data.payer} onPaid={onPaid} onClose={() => setPaying(null)} />
      )}

      {data && (
        <>
          <StatusCard sub={data.subscription} />

          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              {data.subscription.state === 'active' ? 'Renouveler ou changer de plan' : 'Choisissez votre plan'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 max-w-2xl pt-2">
              {[...data.plans].sort((x, y) => (ORDER[x.id] ?? 9) - (ORDER[y.id] ?? 9)).map((plan) => {
                const active   = ['active', 'overdue'].includes(data.subscription.state)
                const current  = active && plan.id === data.subscription.plan
                const switching = active && !current && ['pro', 'premium'].includes(data.subscription.plan)
                const dark     = plan.id === 'premium'
                const look     = DISPLAY[plan.id] || {}
                const badge    = plan.badge || look.badge
                const tagline  = plan.tagline || look.tagline
                return (
                  <div key={plan.id} className={`rounded-2xl p-5 flex flex-col relative ${dark ? 'bg-gray-900 text-white shadow-lg' : 'bg-white border border-gray-200'}`}>
                    {badge && (
                      <span className={`absolute -top-3 left-5 text-2xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${dark ? 'bg-white text-gray-900 border border-gray-900' : 'bg-white text-gray-600 border border-gray-200'}`}>{badge}</span>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-medium ${dark ? 'text-gray-300' : 'text-gray-500'}`}>{plan.name}</p>
                      {current && <span className={`text-2xs font-medium px-2 py-0.5 rounded-full ${dark ? 'bg-white/10 text-green-300' : 'bg-green-50 text-green-700'}`}>Votre plan</span>}
                    </div>
                    {tagline && <p className={`text-xs mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-400'}`}>{tagline}</p>}
                    <p className={`text-2xl font-bold mt-3 ${dark ? 'text-white' : 'text-gray-900'}`}>{fcfa(plan.price)}</p>
                    <p className={`text-xs mb-4 ${dark ? 'text-gray-400' : 'text-gray-400'}`}>pour 30 jours · ≈ {fcfa(perDay(plan.price))} par jour</p>
                    {plan.intro && <p className={`text-xs font-semibold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>{plan.intro}</p>}
                    <ul className="space-y-2 flex-1 mb-5">
                      {plan.features.map((f) => (
                        <li key={f} className={`flex items-start gap-2 text-xs ${dark ? 'text-gray-200' : 'text-gray-600'}`}>
                          <CheckCircle2 size={13} className={`flex-shrink-0 mt-px ${dark ? 'text-green-400' : 'text-green-500'}`} />{f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => pay(plan.id)}
                      disabled={!data.onlinePayment || Boolean(paying)}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${dark ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    >
                      {current ? 'Renouveler' : switching ? `Passer à ${plan.name}` : 'Payer'} {fcfa(plan.price)}
                    </button>
                    {switching && (
                      <p className={`text-2xs mt-2 text-center ${dark ? 'text-gray-400' : 'text-gray-400'}`}>
                        {plan.id === 'premium' ? 'Premium s\'applique tout de suite, vos jours restants inclus.' : 'Pro s\'applique dès le paiement.'}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {data.subscription.state === 'pending' && (
              <p className="text-xs text-gray-500 mt-4 max-w-2xl text-center">
                Vous préférez d'abord essayer ?{' '}
                <button onClick={chooseTrial} disabled={trialBusy} className="font-medium text-gray-900 underline disabled:opacity-50">
                  Commencer par l'essai gratuit de 14 jours
                </button>{' '}(10 articles, 1 zone de livraison).
              </p>
            )}

            {data.onlinePayment ? (
              <p className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-gray-400 mt-4 text-center max-w-2xl">
                <ShieldCheck size={13} /> Remboursé dès une commande par jour · Mobile money · {(data.paymentMethods || []).map((c) => c.name).join(', ')} · Sans engagement
              </p>
            ) : (
              <div className="mt-4 text-center text-xs text-gray-500">
                Le paiement en ligne arrive très bientôt. En attendant,{' '}
                <a className="inline-flex items-center gap-1 font-medium text-gray-900 underline" target="_blank" rel="noopener noreferrer"
                  href={`https://wa.me/${SUPPORT_WA}?text=${encodeURIComponent('Bonjour Skanema, je souhaite payer mon abonnement.')}`}>
                  <MessageCircle size={12} /> écrivez-nous sur WhatsApp
                </a>.
              </div>
            )}
          </section>

          <section className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <h2 className="text-sm font-semibold text-gray-900 px-5 py-4 border-b border-gray-50">Historique des paiements</h2>
            {data.payments.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400">Aucun paiement pour l'instant.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead className="bg-gray-50/60 border-b border-gray-100">
                    <tr>{['Date', 'Plan', 'Période couverte', 'Montant', 'Reçu'].map((h) => <th key={h} className="text-left text-2xs font-medium text-gray-400 uppercase tracking-wide px-5 py-2.5">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-5 py-3 text-sm text-gray-700">{day(p.paidAt)}</td>
                        <td className="px-5 py-3 text-sm text-gray-700">{PLAN_NAME[p.plan]}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">{day(p.periodStart)} → {day(p.periodEnd)}</td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{p.gift ? 'Offert' : fcfa(p.amount)}</td>
                        <td className="px-5 py-3 text-xs">
                          {p.receiptUrl
                            ? <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 underline">Voir <ExternalLink size={11} /></a>
                            : <span className="text-gray-300">{p.gift ? 'Offert par Skanema' : p.provider === 'manual' ? 'Réglé hors ligne' : '—'}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function CheckBanner({ check }) {
  if (check.status === 'pending') return (
    <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800">
      <Loader2 size={14} className="animate-spin" /> Vérification de votre paiement auprès de PayDunya…
    </div>
  )
  if (check.status === 'completed') return (
    <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-800">
      <CheckCircle2 size={16} /> Paiement confirmé ! Votre bot est actif jusqu'au {day(check.until)}.
    </div>
  )
  if (check.status === 'slow') return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
      La confirmation de PayDunya prend plus de temps que prévu. Si vous avez payé, votre abonnement sera activé automatiquement dans quelques minutes. Rechargez la page plus tard.
    </div>
  )
  return (
    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-700">
      Le paiement n'a pas abouti. Aucun abonnement n'a été activé : vous pouvez réessayer.
    </div>
  )
}
