'use client'
import { useState, useEffect, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, AlertTriangle, CheckCircle2, Smartphone, Check, QrCode, Wallet, BellRing } from 'lucide-react'
import Cookies from 'js-cookie'
import { PhoneInput } from '@/components/ui/PhoneInput'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skanema.com'

// Essai gratuit (limites réduites) ou offre payante réglée dès l'inscription
const PLANS = [
  { id: 'essai',   name: 'Essai gratuit', price: 0,     period: '14 jours', features: ['10 articles au catalogue', '1 zone de livraison', 'Bot WhatsApp et paiement mobile'] },
  { id: 'pro',     name: 'Pro',           price: 35000, period: '/mois', popular: true, features: ['25 articles au catalogue', '3 zones de livraison', 'Statistiques avancées', 'Reçus par e-mail'] },
  { id: 'premium', name: 'Premium',       price: 75000, period: '/mois', features: ['Articles illimités', 'Zones illimitées', 'Statistiques avancées', 'Support prioritaire'] },
]

function fmt(n) { return new Intl.NumberFormat('fr-FR').format(n).replace(/\u202f|\u00a0/g, ' ') + ' FCFA' }

function PasswordStrength({ password }) {
  if (!password) return null
  const s1 = password.length >= 8
  const s2 = s1 && /[A-Z]/.test(password) && /[a-z]/.test(password)
  const s3 = s2 && /[0-9]/.test(password)
  const score = s3 ? 3 : s2 ? 2 : s1 ? 1 : 0
  const missing = []
  if (!s1) missing.push('8 caractères minimum')
  if (s1 && !s2) { if (!/[A-Z]/.test(password)) missing.push('une majuscule'); if (!/[a-z]/.test(password)) missing.push('une minuscule') }
  if (s2 && !s3) missing.push('un chiffre')
  const color = score <= 1 ? '#ef4444' : score === 2 ? '#f97316' : '#16a34a'
  const label = score === 0 ? '8 caractères minimum' : score === 3 ? 'Fort — mot de passe sécurisé' : 'Ajoutez ' + missing.join(' et ')
  return (
    <div className="mt-2.5 space-y-1.5">
      <div className="flex gap-1.5">
        {[1,2,3].map(i => (
          <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
               style={{ background: (i === 1 && password.length > 0) || i <= score ? color : '#e5e7eb' }} />
        ))}
      </div>
      {label && <p className="text-xs font-medium transition-all duration-300" style={{ color }}>{label}</p>}
    </div>
  )
}

function StepOneAction({ isPaid, plan, onNext }) {
  return (
    <>
      <p className="text-xs text-gray-500 text-center mb-2.5" aria-live="polite">
        {isPaid
          ? <>Paiement de <b className="text-gray-900">{fmt(plan.price)}</b> par mobile money à la fin · Sans engagement</>
          : <>Aucun paiement pendant 14 jours · Sans engagement</>}
      </p>
      <button onClick={onNext}
        className="w-full bg-gray-900 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all">
        {isPaid ? `Continuer avec ${plan.name}` : 'Commencer l\'essai gratuit'} <ArrowRight size={18} />
      </button>
    </>
  )
}

function OnboardingContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const initPlan     = ['pro', 'premium'].includes(searchParams.get('plan')) ? searchParams.get('plan') : 'essai'

  const [step,         setStep]         = useState(1)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [showPass,     setShowPass]     = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(initPlan)
  const [form,         setForm]         = useState({ name: '', email: '', phone: '', dialCode: '221', password: '' })
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [otpSent,      setOtpSent]      = useState(false)
  const [otpCode,      setOtpCode]      = useState('')
  const [otpLoading,   setOtpLoading]   = useState(false)
  const [countdown,    setCountdown]    = useState(0)
  const [otpChannel,   setOtpChannel]   = useState('whatsapp') // canal réellement utilisé par le serveur

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const plan  = PLANS.find(p => p.id === selectedPlan) || PLANS[0]
  const isPaid = plan.price > 0
  const passOk = form.password.length >= 8 && /[A-Z]/.test(form.password) && /[a-z]/.test(form.password) && /[0-9]/.test(form.password)

  // ── Envoie OTP ──────────────────────────────────────────────────
  const handleSendOTP = async (channel) => {
    if (!form.phone.trim()) { setError('Entrez votre numéro de téléphone.'); return }
    setOtpLoading(true)
    setError('')
    try {
      const res  = await fetch(`${API_URL}/api/otp/send`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ phone: form.phone.trim(), ...(channel === 'sms' ? { channel: 'sms' } : {}) }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.message || 'Le code n\'a pas pu être envoyé.'); return }
      setOtpSent(true)
      setOtpCode('')
      setOtpChannel(data.channel === 'whatsapp' ? 'whatsapp' : 'sms')
      // Délai avant de pouvoir renvoyer (plus court si WhatsApp : on propose vite le SMS en secours)
      setCountdown(data.channel === 'whatsapp' ? 20 : 60)
      const t = setInterval(() => {
        setCountdown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 })
      }, 1000)
    } catch (_) {
      setError('Erreur réseau. Vérifiez votre connexion.')
    } finally {
      setOtpLoading(false)
    }
  }

  // ── Vérifie OTP ─────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) { setError('Entrez le code à 6 chiffres.'); return }
    setOtpLoading(true)
    setError('')
    try {
      const res  = await fetch(`${API_URL}/api/otp/verify`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ phone: form.phone.trim(), code: otpCode }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.message || 'Code incorrect.'); return }
      setPhoneVerified(true)
      setStep(3)
      setError('')
    } catch (_) {
      setError('Erreur réseau.')
    } finally {
      setOtpLoading(false)
    }
  }

  // ── Inscription finale ──────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.name.trim())  { setError('Le nom du restaurant est requis.');   return }
    if (!form.email.trim()) { setError('L\'email est requis.');               return }
    if (!passOk)            { setError('Mot de passe : 8 caractères minimum, une majuscule, une minuscule et un chiffre.'); return }

    setLoading(true)
    setError('')
    try {
      const res  = await fetch(`${API_URL}/api/auth/register`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          name    : form.name.trim(),
          email   : form.email.trim(),
          phone   : form.phone.trim(),
          password: form.password,
          plan    : selectedPlan,
          whatsappPhoneNumberId: 'A_CONFIGURER',
          whatsappAccessToken  : 'A_CONFIGURER',
          whatsappVerifyToken  : 'skanema_' + Date.now(),
        }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.message || 'Erreur. Veuillez réessayer.'); return }
      const isProd = window.location.hostname.includes('skanema.com')
      const domain = isProd ? '.skanema.com' : undefined
      const opts   = { expires: 7, secure: isProd, sameSite: isProd ? 'None' : 'Lax', domain }
      ;['.skanema.com', 'skanema.com', undefined].forEach(d => {
        Cookies.remove('skanema_token', { domain: d, path: '/' })
        Cookies.remove('skanema_user',  { domain: d, path: '/' })
      })
      Cookies.set('skanema_token', data.token,                opts)
      Cookies.set('skanema_user',  JSON.stringify(data.data), opts)
      // Pro/Premium : la fenêtre de paiement s'ouvre directement sur la page Abonnement
      window.location.href = isPaid ? `/dashboard/abonnement?payer=${plan.id}` : '/dashboard'
    } catch (_) {
      setError('Erreur réseau. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  const STEPS = [
    { n: 1, label: 'Votre offre'   },
    { n: 2, label: 'Vérification'  },
    { n: 3, label: 'Votre compte'  },
    ...(isPaid ? [{ n: 4, label: 'Paiement' }] : []),
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">

      {/* ── Panneau gauche ── */}
      <div className="hidden lg:flex lg:w-[42%] bg-gray-900 flex-col justify-between p-12 relative overflow-hidden sticky top-0 h-screen">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        {/* Logo Skanema (identique à la landing) — renvoie vers l'accueil */}
        <a href="https://www.skanema.com" aria-label="Retour à l'accueil Skanema" className="flex items-center gap-3 relative self-start hover:opacity-80 transition-opacity">
          <svg width="26" height="34" viewBox="0 0 52 82" aria-hidden="true">
            <g fill="#DC2626" stroke="#DC2626" strokeWidth="5" strokeLinejoin="round">
              <polygon points="4,18 22,7 22,52 4,63" />
              <polygon points="31,36 49,25 49,69 31,80" />
            </g>
            <circle cx="39" cy="67" r="4" fill="#111827" />
          </svg>
          <span className="text-white" style={{ fontFamily: 'Montserrat, Inter, sans-serif', fontWeight: 900, fontSize: 22, letterSpacing: '-.02em', textTransform: 'uppercase', lineHeight: .98 }}>Skanema</span>
        </a>
        <div className="relative">
          <h2 className="text-white text-3xl font-bold leading-tight mb-8">Vos clients commandent<br />et paient sur WhatsApp.</h2>
          <ul className="space-y-5">
            {[
              { icon: QrCode,   title: 'Catalogue et QR code',    text: 'Vos clients scannent, choisissent et envoient leur panier en un message.' },
              { icon: Wallet,   title: 'Paiement mobile money',   text: 'Wave, Orange Money, ou paiement à la livraison si vous le souhaitez.' },
              { icon: BellRing, title: 'Commande sur votre téléphone', text: 'Avec le détail du panier et la position du client pour la livraison.' },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5">
                <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0"><Icon size={17} className="text-white" /></span>
                <div>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-white/50 text-sm leading-relaxed mt-0.5">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-white/40 text-xs">Sans engagement · Aucune commission sur vos ventes</p>
      </div>

      {/* ── Panneau droit ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 lg:px-16">
        <div className="w-full max-w-md">

          {/* Indicateur étapes */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  s.n < step   ? 'bg-green-500 text-white' :
                  s.n === step ? 'bg-gray-900 text-white'  : 'bg-gray-100 text-gray-400'
                }`}>
                  {s.n < step ? <CheckCircle2 size={13} /> : s.n}
                </div>
                <span className={`text-xs leading-tight ${s.n === step ? 'text-gray-900 font-medium' : 'text-gray-400 hidden sm:inline'}`}>{s.label}</span>
                {i < STEPS.length - 1 && <div className="w-4 h-px bg-gray-200 mx-1 flex-shrink-0" />}
              </div>
            ))}
          </div>

          {/* ── ÉTAPE 1 — Plan ── */}
          {step === 1 && (
            <div style={{ animation: 'fadeUp 0.3s ease both' }}>
              <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Choisissez votre offre</h1>
              <p className="text-sm text-gray-400 mb-6">Commencez gratuitement, ou démarrez directement avec tout le potentiel de Skanema.</p>
              <div className="space-y-3 mb-6" role="radiogroup" aria-label="Offre">
                {PLANS.map(p => {
                  const active = selectedPlan === p.id
                  return (
                    <button key={p.id} role="radio" aria-checked={active} onClick={() => setSelectedPlan(p.id)}
                      className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 ${active ? 'border-gray-900 bg-white' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-gray-900">{p.name}</p>
                          {p.popular && <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full font-medium">Populaire</span>}
                        </div>
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <span className="font-bold text-gray-900 whitespace-nowrap">
                            {p.price === 0 ? '0 FCFA' : fmt(p.price)}
                            <span className="text-xs font-normal text-gray-400 ml-1">{p.period}</span>
                          </span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${active ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}`}>
                            {active && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {p.features.map((f, i) => (
                          <span key={i} className={`text-xs flex items-center gap-1 ${active ? 'text-gray-600' : 'text-gray-400'}`}>
                            <Check size={11} className={active ? 'text-green-600' : 'text-gray-300'} /> {f}
                          </span>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
              {/* Bouton toujours visible : à sa place sur ordinateur, collé en bas de l'écran sur téléphone */}
              <div className="hidden lg:block mt-2"><StepOneAction isPaid={isPaid} plan={plan} onNext={() => setStep(2)} /></div>
              <div className="h-32 lg:hidden" aria-hidden="true" />
              {mounted && createPortal(
                <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-gray-100 px-5 pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
                     style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
                  <div className="max-w-md mx-auto"><StepOneAction isPaid={isPaid} plan={plan} onNext={() => setStep(2)} /></div>
                </div>,
                document.body
              )}
            </div>
          )}
                
          {/* ── ÉTAPE 2 — Vérification téléphone ── */}
          {step === 2 && (
            <div style={{ animation: 'fadeUp 0.3s ease both' }}>
              <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                  <Smartphone size={18} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Vérifiez votre numéro</h1>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                Ce numéro recevra les notifications de commandes.
              </p>

              {!otpSent ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Numéro de téléphone *</label>
                    <PhoneInput
                      value={form.phone}
                      onChange={(full, dial, local) => setForm(f => ({ ...f, phone: full, dialCode: dial }))}
                      style={{ minHeight: '52px' }}
                    />
                    <p className="text-xs text-gray-400 mt-1">Vous recevrez un code de vérification sur WhatsApp (ou par SMS).</p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                      <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => { setStep(1); setError('') }}
                      className="px-4 py-4 rounded-2xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                      <ArrowLeft size={18} />
                    </button>
                    <button onClick={() => handleSendOTP()} disabled={otpLoading || !form.phone}
                      className="flex-1 bg-gray-900 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      {otpLoading ? <><Loader2 size={18} className="animate-spin" /> Envoi…</> : <>Recevoir mon code <ArrowRight size={18} /></>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500">{otpChannel === 'whatsapp' ? 'Code envoyé sur WhatsApp au' : 'Code envoyé par SMS au'}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{form.phone}</p>
                    <button onClick={() => { setOtpSent(false); setOtpCode(''); setError('') }}
                      className="text-xs text-gray-400 hover:text-gray-600 underline mt-1">
                      Changer de numéro
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Code de vérification à 6 chiffres</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      style={{ fontSize: '24px', letterSpacing: '0.3em', textAlign: 'center' }}
                      className="w-full border border-gray-200 rounded-xl px-4 py-4 outline-none focus:border-gray-400 transition-colors placeholder-gray-300 font-mono"
                      autoFocus
                    />
                  </div>

                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-xs text-gray-400">{otpChannel === 'whatsapp' ? `Pas reçu ? Option SMS dans ${countdown} s` : `Renvoyer dans ${countdown} s`}</p>
                    ) : otpChannel === 'whatsapp' ? (
                      <button onClick={() => handleSendOTP('sms')} disabled={otpLoading}
                        className="text-xs text-gray-600 hover:text-gray-900 underline">
                        Pas reçu sur WhatsApp ? Recevoir le code par SMS
                      </button>
                    ) : (
                      <button onClick={() => handleSendOTP('sms')} disabled={otpLoading}
                        className="text-xs text-gray-600 hover:text-gray-900 underline">
                        Renvoyer le code par SMS
                      </button>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                      <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600">{error}</p>
                    </div>
                  )}

                  <button onClick={handleVerifyOTP} disabled={otpLoading || otpCode.length !== 6}
                    className="w-full bg-gray-900 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    {otpLoading ? <><Loader2 size={18} className="animate-spin" /> Vérification…</> : <>Vérifier le code <ArrowRight size={18} /></>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── ÉTAPE 3 — Compte ── */}
          {step === 3 && (
            <div style={{ animation: 'fadeUp 0.3s ease both' }}>
              <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Créez votre compte</h1>
              <p className="text-sm text-gray-400 mb-6">
                {isPaid
                  ? <>Plan <span className="font-semibold text-gray-700">{plan.name}</span> · {fmt(plan.price)}/mois, payé à l'étape suivante</>
                  : <><span className="font-semibold text-gray-700">Essai gratuit</span> · 14 jours, sans paiement</>}
                <button onClick={() => { setStep(1); setError('') }} className="text-gray-400 hover:text-gray-600 underline ml-2 text-xs">Changer</button>
              </p>

              <div className="space-y-4">
                {/* Numéro vérifié — readonly */}
                <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                  <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-green-800">Numéro vérifié</p>
                    <p className="text-xs text-green-600">{form.phone}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Nom du restaurant *</label>
                  <input autoFocus value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="Ex: Chez Fatou, Le Pélican…"
                    style={{ fontSize: '16px' }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-gray-400 transition-colors placeholder-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Email *</label>
                  <input type="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="vous@email.com"
                    style={{ fontSize: '16px' }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-gray-400 transition-colors placeholder-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Mot de passe *</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      placeholder="Min. 8 caractères"
                      style={{ fontSize: '16px' }}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3.5 pr-11 outline-none focus:border-gray-400 transition-colors placeholder-gray-300"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PasswordStrength password={form.password} />
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => { setStep(2); setOtpSent(false); setOtpCode(''); setError('') }}
                  className="px-4 py-4 rounded-2xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                  <ArrowLeft size={18} />
                </button>
                <button onClick={handleSubmit} disabled={loading || !form.name || !form.email || !form.password}
                  className="flex-1 bg-gray-900 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Création en cours…</> : <><span>{isPaid ? 'Continuer vers le paiement' : 'Démarrer mon essai gratuit'}</span><ArrowRight size={18} /></>}
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-4">
                En créant un compte vous acceptez nos{' '}
                <a href="/cgu" className="underline hover:text-gray-600">conditions d'utilisation</a>
              </p>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-8">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-gray-900 font-medium hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
