'use client'
import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, AlertTriangle, Loader2, ShieldCheck, Clock, XCircle, ExternalLink, MessageCircle } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { getBilling, createCheckout, getPaymentStatus } from '@/lib/api'

const SUPPORT_WA = '221784632103'
const fcfa = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`
const day  = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—')
const PLAN_NAME = { basic: 'Basic', pro: 'Pro', premium: 'Premium' }

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
    trial        : { tone: 'blue',  icon: Clock,         title: 'Essai gratuit en cours', text: `Votre essai se termine le ${day(sub.trialEnds)}. Payez dès maintenant : vos 30 jours commenceront après la fin de l'essai, vous ne perdez rien.` },
    trial_expired: { tone: 'amber', icon: AlertTriangle, title: 'Votre essai est terminé', text: 'Votre bot WhatsApp ne prend plus de commandes. Choisissez un plan ci-dessous pour le réactiver immédiatement.' },
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
  const [paying,  setPaying]  = useState('')     // plan en cours de redirection
  const [check,   setCheck]   = useState(null)   // { status, until } après retour de PayDunya
  const polled = useRef(false)

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

  const pay = async (plan) => {
    setPaying(plan); setError('')
    try {
      const r = await createCheckout(plan)
      window.location.href = r.data.url // page de paiement sécurisée PayDunya
    } catch (e) {
      setError(e.response?.data?.message || 'Le paiement n\'a pas pu démarrer. Réessayez.')
      setPaying('')
    }
  }

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

      {data && (
        <>
          <StatusCard sub={data.subscription} />

          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              {data.subscription.state === 'active' ? 'Renouveler ou changer de plan' : 'Choisissez votre plan'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.plans.map((plan) => {
                const current = plan.id === data.subscription.plan && ['active', 'overdue'].includes(data.subscription.state)
                const featured = plan.id === 'pro'
                return (
                  <div key={plan.id} className={`bg-white rounded-2xl p-5 flex flex-col relative ${featured ? 'border-2 border-gray-900 shadow-sm' : 'border border-gray-100'}`}>
                    {featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-2xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">Recommandé</span>}
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-gray-500">{plan.name}</p>
                      {current && <span className="text-2xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Votre plan</span>}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{fcfa(plan.price)}</p>
                    <p className="text-xs text-gray-400 mb-4">pour 30 jours</p>
                    <ul className="space-y-2 flex-1 mb-5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-600"><CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />{f}</li>
                      ))}
                    </ul>
                    <button
                      onClick={() => pay(plan.id)}
                      disabled={!data.onlinePayment || Boolean(paying)}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${featured ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    >
                      {paying === plan.id && <Loader2 size={14} className="animate-spin" />}
                      {current ? 'Renouveler' : 'Payer'} {fcfa(plan.price)}
                    </button>
                  </div>
                )
              })}
            </div>

            {data.onlinePayment ? (
              <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-4 text-center">
                <ShieldCheck size={13} /> Paiement sécurisé par PayDunya · Wave, Orange Money, carte bancaire… · Sans engagement
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
                        <td className="px-5 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{fcfa(p.amount)}</td>
                        <td className="px-5 py-3 text-xs">
                          {p.receiptUrl
                            ? <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 underline">Voir <ExternalLink size={11} /></a>
                            : <span className="text-gray-300">{p.provider === 'manual' ? 'Réglé hors ligne' : '—'}</span>}
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
