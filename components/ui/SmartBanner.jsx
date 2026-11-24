'use client'
import { useState, useEffect } from 'react'
import { Mail, Bell, X, Loader2, Share, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import Cookies from 'js-cookie'

const API_URL       = process.env.NEXT_PUBLIC_API_URL || 'https://api.skanema.com'
const VAPID_PUB_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buffer  = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) buffer[i] = rawData.charCodeAt(i)
  return buffer
}

// Abonnement push de cet appareil : le crée s'il manque, puis l'enregistre sur le serveur.
// Renvoie true quand le serveur l'a bien enregistré.
async function syncPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !VAPID_PUB_KEY) return false
  await navigator.serviceWorker.register('/sw.js')
  const reg = await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({
    userVisibleOnly     : true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUB_KEY),
  })
  const res = await fetch(`${API_URL}/api/push/subscribe`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Cookies.get('skanema_token')}` },
    body   : JSON.stringify(sub.toJSON()),
  })
  return res.ok
}

function detectDevice() {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true
}

// ── Bannière email ───────────────────────────────────────────────
function EmailBanner() {
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)

  const handleResend = async () => {
    setSending(true)
    try {
      const token = Cookies.get('skanema_token')
      await fetch(`${API_URL}/api/auth/resend-verification`, {
        method : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setSent(true)
    } catch (_) {}
    finally { setSending(false) }
  }

  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-5">
      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Mail size={15} className="text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">Vérifiez votre adresse email</p>
        <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
          Votre bot WhatsApp est désactivé jusqu'à vérification.{' '}
          {sent ? (
            <span className="text-green-700 font-medium">Email renvoyé ✓</span>
          ) : (
            <button onClick={handleResend} disabled={sending}
              className="underline font-medium hover:text-amber-900 transition-colors inline-flex items-center gap-1">
              {sending && <Loader2 size={10} className="animate-spin" />}
              Renvoyer l'email
            </button>
          )}
        </p>
      </div>
    </div>
  )
}

// ── Guide installation iOS ───────────────────────────────────────
function IOSGuide({ onDismiss }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-white">Installer Skanema sur votre téléphone</p>
        <button onClick={onDismiss} className="text-gray-500 hover:text-gray-300 p-1">
          <X size={15} />
        </button>
      </div>
      <p className="text-xs text-amber-400 font-medium mb-4">
        Pour ne rater aucune commande, installez l'app sur votre écran d'accueil
      </p>
      <div className="space-y-3">
        {[
          { n: 1, text: 'Appuyez sur le bouton Partager', icon: <Share size={13} className="text-blue-400" />, sub: 'En bas de Safari' },
          { n: 2, text: 'Appuyez sur "Sur l\'écran d\'accueil"', icon: <Plus size={13} className="text-gray-300" />, sub: 'Faites défiler la liste' },
          { n: 3, text: 'Appuyez sur Ajouter', sub: 'L\'icône Skanema apparaîtra' },
        ].map(s => (
          <div key={s.n} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#DC2626] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">{s.n}</div>
            <div>
              <p className="text-xs font-medium text-white">{s.text}</p>
              {s.icon ? (
                <div className="flex items-center gap-1.5 mt-1 bg-gray-800 rounded px-2 py-1 w-fit">
                  {s.icon}
                  <span className="text-xs text-gray-400">{s.sub}</span>
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
              )}
            </div>
          </div>
        ))}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 text-white text-xs">✓</div>
          <p className="text-xs text-green-400 font-medium pt-1">Ouvrez Skanema depuis l'écran d'accueil → pour ne rater aucune commande</p>
        </div>
      </div>
      <button onClick={onDismiss} className="mt-4 text-xs text-gray-500 hover:text-gray-400 transition-colors">
        Plus tard
      </button>
    </div>
  )
}

// ── Bannière push ────────────────────────────────────────────────
function PushBanner({ onActivate, onDismiss, loading, failed }) {
  return (
    <div className="flex items-start gap-3 bg-gray-900 rounded-xl px-4 py-3.5 mb-5">
      <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bell size={15} className="text-gray-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">Activez les notifications</p>
        <p className="text-xs text-gray-400 mt-0.5">Recevez une alerte à chaque nouvelle commande, même app fermée.</p>
        {failed && <p className="text-xs text-red-400 mt-1">Activation impossible. Réessayez.</p>}
        <div className="flex items-center gap-2 mt-2.5">
          <button onClick={onActivate} disabled={loading}
            className="text-xs font-semibold bg-white text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1.5">
            {loading && <Loader2 size={11} className="animate-spin" />}
            {loading ? 'Activation…' : 'Activer'}
          </button>
          <button onClick={onDismiss} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            Plus tard
          </button>
        </div>
      </div>
      <button onClick={onDismiss} className="text-gray-600 hover:text-gray-400 flex-shrink-0 p-1">
        <X size={14} />
      </button>
    </div>
  )
}

// ── Composant principal ──────────────────────────────────────────
export function SmartBanner() {
  const { user }           = useAuth()
  const [mounted,      setMounted]      = useState(false)
  const [device,       setDevice]       = useState('desktop')
  const [standalone,   setStandalone]   = useState(false)
  const [pushStatus,   setPushStatus]   = useState('idle')
  const [pushLoading,  setPushLoading]  = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [pushDismissed, setPushDismissed] = useState(false)
  const [subscribed,   setSubscribed]   = useState(null)   // null = pas encore vérifié
  const [pushFailed,   setPushFailed]   = useState(false)

  useEffect(() => {
    const d = detectDevice()
    setDevice(d)
    setStandalone(isInStandaloneMode())

    // Cookie de session — si "Plus tard" cliqué cette session
    if (Cookies.get('skanema_push_later')) {
      setPushDismissed(true)
    }

    if ('Notification' in window) setPushStatus(Notification.permission)
    setMounted(true)
  }, [])

  // Notifications déjà autorisées : on vérifie à chaque ouverture que cet appareil est bien abonné.
  // Une autorisation ne suffit pas : après une réinstallation de l'application, l'abonnement n'existe plus.
  const logged = Boolean(user)
  useEffect(() => {
    if (!mounted || !logged || device === 'desktop' || pushStatus !== 'granted') return
    if (subscribed !== null) return   // déjà fait (par exemple juste après l'appui sur « Activer »)
    let live = true
    syncPushSubscription()
      .then((ok) => live && setSubscribed(ok))
      .catch((err) => { console.error('Push error:', err); if (live) setSubscribed(false) })
    return () => { live = false }
  }, [mounted, logged, device, pushStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleActivatePush = async () => {
    if (device === 'ios' && !standalone) {
      setShowIOSGuide(true)
      return
    }
    setPushLoading(true); setPushFailed(false)
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        const ok = await syncPushSubscription()
        setSubscribed(ok); setPushFailed(!ok)
      }
      setPushStatus(permission)
    } catch (err) { console.error('Push error:', err); setSubscribed(false); setPushFailed(true) }
    finally { setPushLoading(false) }
  }

  // "Plus tard" — cookie de session uniquement, revient à la prochaine connexion
  const handleDismiss = () => {
    Cookies.set('skanema_push_later', '1') // pas d'expires = session cookie
    setPushDismissed(true)
    setShowIOSGuide(false)
  }

  if (!mounted || !user) return null

  const emailUnverified = user.emailVerified === false
  const pushGranted     = pushStatus === 'granted'
  // À proposer : pas encore autorisé, ou autorisé mais l'abonnement de cet appareil n'a pas pu être enregistré
  const pushToActivate  = !pushGranted || subscribed === false
  const isDesktop       = device === 'desktop'
  const pushUnsupported = device === 'desktop' ||
    (device !== 'ios' && !('Notification' in window) && !('serviceWorker' in navigator))

  // Priorité 1 — Email non vérifié
  if (emailUnverified) return <EmailBanner />

  // Priorité 2 — Push non activé sur mobile
  if (!isDesktop && pushToActivate && !pushUnsupported && !pushDismissed) {
    if (showIOSGuide) return <IOSGuide onDismiss={handleDismiss} />
    return <PushBanner onActivate={handleActivatePush} onDismiss={handleDismiss} loading={pushLoading} failed={pushFailed} />
  }

  return null
}
