'use client'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NextStepBanner } from '@/components/ui/NextStepBanner'
import { useAuth } from '@/hooks/useAuth'
import { Loader2, CheckCircle2, Wifi, WifiOff, RefreshCw, ChevronDown, Save, Webhook } from 'lucide-react'
import api from '@/lib/api'

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID || '1320436230274815'

export default function WhatsAppPage() {
  const { user } = useAuth()
  const [fbLoaded,      setFbLoaded]      = useState(false)
  const [connecting,    setConnecting]    = useState(false)
  const [success,       setSuccess]       = useState(false)
  const [error,         setError]         = useState('')
  const [showManual,    setShowManual]    = useState(false)
  const [manual,        setManual]        = useState({ phoneNumberId: '', accessToken: '', verifyToken: '' })
  const [manualLoading, setManualLoading] = useState(false)
  const [manualSuccess, setManualSuccess] = useState(false)
  const [manualError,   setManualError]   = useState('')

  const pid      = user?.whatsappPhoneNumberId
  const isActive = pid && !pid.startsWith('PENDING_') && pid !== 'A_CONFIGURER'

  // Charge le SDK Facebook
  useEffect(() => {
    if (window.FB) { setFbLoaded(true); return }
    window.fbAsyncInit = function () {
      window.FB.init({ appId: META_APP_ID, cookie: true, xfbml: true, version: 'v21.0' })
      setFbLoaded(true)
    }
    const script   = document.createElement('script')
    script.src     = 'https://connect.facebook.net/fr_FR/sdk.js'
    script.async   = true
    script.defer   = true
    document.body.appendChild(script)

    // Stocke les données du MessageEvent pour les synchroniser avec FB.login
    const handleMessage = (event) => {
      if (event.origin !== 'https://www.facebook.com') return
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          if (data.event === 'FINISH') {
            const { phone_number_id, waba_id } = data.data
            // Stocke dans window pour que FB.login callback puisse y accéder
            window._skanemaWAData = { phone_number_id, waba_id }
          } else if (data.event === 'CANCEL') {
            setConnecting(false); setError('Connexion annulée.')
          } else if (data.event === 'ERROR') {
            setConnecting(false); setError('Une erreur est survenue.')
          }
        }
      } catch (_) {}
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleSignupComplete = async (code, wabaId, phoneNumberId) => {
    if (!code || !wabaId || !phoneNumberId) {
      setError('Données de connexion incomplètes.'); setConnecting(false); return
    }
    try {
      await api.post('/api/whatsapp/callback', { code, wabaId, phoneNumberId })
      setSuccess(true); setConnecting(false)
      setTimeout(() => window.location.reload(), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'activation.')
      setConnecting(false)
    }
  }

  const launchEmbeddedSignup = () => {
    if (!window.FB) { setError('SDK Facebook non chargé. Rechargez la page.'); return }
    setConnecting(true); setError('')
    window._skanemaWAData = null // reset avant chaque tentative
    window.FB.login(
      (response) => {
        if (!response.authResponse?.code) {
          setConnecting(false)
          setError('Connexion annulée ou refusée.')
          return
        }
        const code    = response.authResponse.code
        const waData  = window._skanemaWAData
        if (!waData?.waba_id || !waData?.phone_number_id) {
          setConnecting(false)
          setError('Données WhatsApp incomplètes. Réessayez.')
          return
        }
        handleSignupComplete(code, waData.waba_id, waData.phone_number_id)
      },
      { config_id: '1704259907386003', response_type: 'code', override_default_response_type: true,
        extras: { setup: {}, featureType: '', sessionInfoVersion: '3' } }
    )
  }

  const handleManualSave = async () => {
    if (!manual.phoneNumberId.trim() || !manual.accessToken.trim()) {
      setManualError('Phone Number ID et Access Token sont requis.'); return
    }
    setManualLoading(true); setManualError('')
    try {
      await api.patch('/api/auth/whatsapp', {
        phoneNumberId: manual.phoneNumberId.trim(),
        accessToken  : manual.accessToken.trim(),
        verifyToken  : manual.verifyToken.trim() || ('skanema_' + Date.now()),
      })
      setManualSuccess(true)
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      setManualError(err.response?.data?.message || 'Erreur lors de la sauvegarde.')
    } finally {
      setManualLoading(false)
    }
  }

  return (
    <DashboardLayout title="WhatsApp" subtitle="Connexion de votre bot WhatsApp">
      <div className="max-w-2xl space-y-5">
        <NextStepBanner current="whatsapp" done={Boolean(isActive)} />

        {/* Statut */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Statut du bot</h2>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-green-50' : 'bg-gray-50'}`}>
              {isActive ? <Wifi size={18} className="text-green-500" /> : <WifiOff size={18} className="text-gray-400" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{isActive ? 'Bot actif' : 'Bot non connecté'}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isActive ? `Numéro ID : ${pid}` : 'Connectez votre numéro WhatsApp Business pour activer le bot'}
              </p>
            </div>
          </div>
        </div>

        {/* Embedded Signup */}
        {!isActive && (
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Connecter WhatsApp</h2>
            <p className="text-xs text-gray-500 leading-relaxed mb-5">
              Connectez votre numéro WhatsApp Business en quelques clics. Vous aurez besoin d'un compte Facebook et d'un numéro dédié.
            </p>
            {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4"><p className="text-xs text-red-600">{error}</p></div>}
            {success ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 size={18} />
                <p className="text-sm font-medium">Bot activé avec succès ! Rechargement…</p>
              </div>
            ) : (
              <button onClick={launchEmbeddedSignup} disabled={connecting || !fbLoaded} className="btn-primary flex items-center gap-2">
                {(connecting || !fbLoaded) && <Loader2 size={14} className="animate-spin" />}
                {connecting ? 'Connexion en cours…' : !fbLoaded ? 'Chargement…' : 'Connecter mon WhatsApp Business'}
              </button>
            )}
          </div>
        )}

        {/* Reconnexion */}
        {isActive && (
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Changer de numéro</h2>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">Vous pouvez reconnecter un autre numéro WhatsApp Business si nécessaire.</p>
            {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4"><p className="text-xs text-red-600">{error}</p></div>}
            <button onClick={launchEmbeddedSignup} disabled={connecting || !fbLoaded} className="btn-ghost flex items-center gap-2">
              {connecting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {connecting ? 'Connexion en cours…' : 'Reconnecter WhatsApp'}
            </button>
          </div>
        )}

        {/* Guide */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-700 mb-3">Comment ça marche ?</p>
          <div className="space-y-2">
            {['Cliquez sur "Connecter mon WhatsApp Business"','Connectez-vous avec votre compte Facebook professionnel','Sélectionnez ou créez un compte WhatsApp Business','Ajoutez et vérifiez votre numéro de téléphone','Votre bot Skanema est activé automatiquement'].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-2xs font-bold text-gray-600">{i + 1}</span>
                </div>
                <p className="text-xs text-gray-500">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration manuelle — accordéon */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <button onClick={() => setShowManual(!showManual)}
            className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors">
            <div>
              <p className="text-sm font-medium text-gray-700 text-left">Configuration manuelle</p>
              <p className="text-xs text-gray-400 mt-0.5 text-left">Pour les utilisateurs avancés — saisissez vos credentials WhatsApp Cloud API</p>
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 ml-3 ${showManual ? 'rotate-180' : ''}`} />
          </button>

          {showManual && (
            <div className="bg-gray-50 border-t border-gray-100 p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                <p className="text-xs text-amber-700">
                  Ces informations se trouvent dans <strong>Meta for Developers</strong> → WhatsApp → API Setup.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone Number ID *</label>
                <input type="text" value={manual.phoneNumberId}
                  onChange={e => setManual(m => ({ ...m, phoneNumberId: e.target.value }))}
                  placeholder="Ex: 123456789012345" className="input w-full" style={{ fontSize: '14px' }} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Access Token *</label>
                <input type="password" value={manual.accessToken}
                  onChange={e => setManual(m => ({ ...m, accessToken: e.target.value }))}
                  placeholder="EAAxxxxxxx..." className="input w-full" style={{ fontSize: '14px' }} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Verify Token <span className="text-gray-400">(optionnel)</span>
                </label>
                <input type="text" value={manual.verifyToken}
                  onChange={e => setManual(m => ({ ...m, verifyToken: e.target.value }))}
                  placeholder="Généré automatiquement si vide" className="input w-full" style={{ fontSize: '14px' }} />
              </div>

              {manualError && (
                <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  <p className="text-xs text-red-600">{manualError}</p>
                </div>
              )}

              {manualSuccess && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 size={16} />
                  <p className="text-xs font-medium">Configuration sauvegardée ! Rechargement…</p>
                </div>
              )}

              <button onClick={handleManualSave} disabled={manualLoading || manualSuccess}
                className="btn-primary flex items-center gap-2">
                {manualLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {manualLoading ? 'Sauvegarde…' : 'Enregistrer'}
              </button>

              {/* Webhook info */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Webhook size={14} className="text-gray-400" />
                  <p className="text-xs font-medium text-gray-700">URL du Webhook</p>
                </div>
                <p className="text-xs text-gray-400">
                  Copiez dans Meta → WhatsApp → Configuration → Webhooks.
                </p>
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 font-mono text-xs text-gray-700 break-all select-all">
                  https://api.skanema.com/webhook/whatsapp
                </div>
                {user?.whatsappVerifyToken && (
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5">
                    <p className="text-2xs text-gray-400 mb-0.5">Token de vérification</p>
                    <p className="font-mono text-xs text-gray-700 break-all select-all">{user.whatsappVerifyToken}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-xs bg-white border border-gray-200 rounded-lg p-3">
                  <div>
                    <p className="text-2xs text-gray-400 mb-0.5">Événements requis</p>
                    <p className="font-medium text-gray-700">messages</p>
                  </div>
                  <div>
                    <p className="text-2xs text-gray-400 mb-0.5">Mode</p>
                    <p className="font-medium text-gray-700">subscribe</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}
