'use client'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Toggle } from '@/components/ui/Toggle'
import { Loader2, CheckCircle2, Eye, EyeOff, AlertTriangle, Banknote, ChevronDown, KeyRound } from 'lucide-react'
import api, { updatePaydunya } from '@/lib/api'

// Logos officiels des moyens de paiement (dossier public/payments)
const LOGO = {
  wave_sn: 'wave', wave_ci: 'wave', om_sn: 'maxit-sn', mtn_ci: 'mtn-momo', mtn_bj: 'mtn-momo',
  moov_bj: 'moov-money-bf', moov_bf: 'moov-money-bf', tmoney_tg: 'mixx-tg', moov_tg: 'moov-flooz',
}
const day = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '')

function SecretInput({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          autoComplete="off" spellCheck={false} className="input pr-10 font-mono text-base sm:text-xs" />
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Masquer' : 'Afficher'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}

export default function PaiementsPage() {
  const [loading,     setLoading]     = useState(true)
  const [pd,          setPd]          = useState(null)   // état PayDunya renvoyé par le serveur
  const [keys,        setKeys]        = useState({ masterKey: '', privateKey: '', token: '' })
  const [editKeys,    setEditKeys]    = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [notice,      setNotice]      = useState('')
  const [confirmDel,  setConfirmDel]  = useState(false)
  const [cashEnabled, setCashEnabled] = useState(false)
  // Ancienne connexion Wave directe (utilisée seulement sans PayDunya)
  const [wave,      setWave]      = useState({ apiKey: '', webhookSecret: '' })
  const [waveMsg,   setWaveMsg]   = useState('')
  const [waveBusy,  setWaveBusy]  = useState(false)

  useEffect(() => {
    api.get('/api/auth/me').then((res) => {
      const d = res.data.data
      setPd(d.paydunya || null)
      setCashEnabled(d.cashEnabled || false)
      setWave({ apiKey: d.waveApiKey || '', webhookSecret: d.waveWebhookSecret || '' })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 3500) }

  const saveKeys = async () => {
    setError('')
    if (!keys.masterKey.trim() || !keys.privateKey.trim() || !keys.token.trim()) { setError('Renseignez les trois clés.'); return }
    setSaving(true)
    try {
      const r = await updatePaydunya(keys)
      setPd(r.data.paydunya); setKeys({ masterKey: '', privateKey: '', token: '' }); setEditKeys(false)
      flash('Clés vérifiées et enregistrées : vos clients peuvent payer en ligne.')
    } catch (e) { setError(e.response?.data?.message || 'Enregistrement impossible. Réessayez.') }
    finally { setSaving(false) }
  }

  const toggleMethod = async (key) => {
    const next = pd.methods.map((m) => (m.key === key ? { ...m, enabled: !m.enabled } : m))
    setPd({ ...pd, methods: next })
    try { const r = await updatePaydunya({ methods: next.filter((m) => m.enabled).map((m) => m.key) }); setPd(r.data.paydunya) }
    catch (_) { setPd(pd); setError('Modification non enregistrée. Réessayez.') }
  }

  const removeKeys = async () => {
    setSaving(true); setError('')
    try { const r = await updatePaydunya({ remove: true }); setPd(r.data.paydunya); setConfirmDel(false); flash('Clés retirées : le paiement en ligne est désactivé.') }
    catch (_) { setError('Suppression impossible. Réessayez.') }
    finally { setSaving(false) }
  }

  const handleToggleCash = async (val) => {
    setCashEnabled(val)
    try { await api.patch('/api/auth/payment', { cashEnabled: val }) } catch (_) { setCashEnabled(!val) }
  }

  const saveWave = async () => {
    if (!wave.apiKey || !wave.webhookSecret) { setWaveMsg('Les deux champs sont requis.'); return }
    setWaveBusy(true); setWaveMsg('')
    try { await api.patch('/api/auth/payment', { waveApiKey: wave.apiKey, waveWebhookSecret: wave.webhookSecret }); setWaveMsg('Enregistré.') }
    catch (_) { setWaveMsg('Erreur lors de la sauvegarde.') }
    finally { setWaveBusy(false) }
  }

  if (loading) return (
    <DashboardLayout title="Paiements" subtitle="Comment vos clients paient">
      <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-gray-300" /></div>
    </DashboardLayout>
  )

  const configured = Boolean(pd?.configured)
  const showForm   = !configured || editKeys
  const enabledCount = (pd?.methods || []).filter((m) => m.enabled).length

  return (
    <DashboardLayout title="Paiements" subtitle="Comment vos clients paient">
      <div className="max-w-2xl space-y-5">
        {notice && <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-xs text-green-700"><CheckCircle2 size={14} /> {notice}</div>}

        {/* ── Paiement mobile par PayDunya ── */}
        <section className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-900">Paiement mobile</p>
              <p className="text-xs text-gray-400 mt-0.5">Par PayDunya, l'argent arrive directement sur votre compte</p>
            </div>
            <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${configured ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${configured ? 'bg-green-500' : 'bg-amber-400'}`} />
              {configured ? 'Activé' : 'À configurer'}
            </span>
          </div>

          <div className="p-5 space-y-5">
            {/* Moyens proposés aux clients */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Moyens proposés à vos clients</p>
              <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl">
                {(pd?.methods || []).map((m) => (
                  <div key={m.key} className={`flex items-center gap-3 px-4 py-3 ${configured ? '' : 'opacity-50'}`}>
                    <img src={`/payments/${LOGO[m.key] || 'wave'}.png`} alt="" className="w-9 h-9 rounded-lg object-contain flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{m.label}</p>
                      <p className="text-2xs text-gray-400">{m.opensApp ? 'Un appui ouvre directement l\'application' : 'Le client valide sur son téléphone'}</p>
                    </div>
                    <Toggle checked={configured && m.enabled} onChange={() => configured && toggleMethod(m.key)} />
                  </div>
                ))}
                {!pd?.methods?.length && <p className="px-4 py-3 text-xs text-gray-400">Aucun moyen de paiement en ligne disponible dans votre pays pour le moment.</p>}
              </div>
              {configured && enabledCount === 0 && <p className="text-2xs text-amber-600 mt-1.5">Aucun moyen activé : vos clients ne peuvent payer qu'en espèces.</p>}
            </div>

            {/* Clés PayDunya */}
            {configured && !editKeys && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-600 flex items-center gap-2"><KeyRound size={14} className="text-gray-400" /> Clés enregistrées{pd.configuredAt ? ` le ${day(pd.configuredAt)}` : ''}</p>
                <div className="flex gap-3 text-xs font-medium">
                  <button onClick={() => { setEditKeys(true); setConfirmDel(false) }} className="text-gray-700 underline">Remplacer</button>
                  <button onClick={() => setConfirmDel(true)} className="text-red-600 underline">Retirer</button>
                </div>
              </div>
            )}
            {confirmDel && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-xs text-red-700">Retirer les clés désactive le paiement en ligne : vos clients ne pourront plus payer qu'en espèces.</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setConfirmDel(false)} className="btn-ghost text-xs py-1.5">Annuler</button>
                  <button onClick={removeKeys} disabled={saving} className="btn-danger text-xs py-1.5">Retirer les clés</button>
                </div>
              </div>
            )}
            {showForm && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Dans votre espace PayDunya, copiez les clés de <b className="text-gray-700">production</b> de votre application (pas celles de test),
                  puis collez-les ici. Skanema les vérifie auprès de PayDunya avant de les enregistrer, et ne les affiche plus jamais ensuite.
                </p>
                <SecretInput label="Master Key"  value={keys.masterKey}  onChange={(v) => setKeys((k) => ({ ...k, masterKey: v }))}  placeholder="Clé principale" />
                <SecretInput label="Private Key" value={keys.privateKey} onChange={(v) => setKeys((k) => ({ ...k, privateKey: v }))} placeholder="live_private_…" />
                <SecretInput label="Token"       value={keys.token}      onChange={(v) => setKeys((k) => ({ ...k, token: v }))}      placeholder="Token" />
                <div className="flex gap-2">
                  {editKeys && <button onClick={() => { setEditKeys(false); setError('') }} className="btn-ghost">Annuler</button>}
                  <button onClick={saveKeys} disabled={saving} className="btn-primary flex items-center gap-2">
                    {saving && <Loader2 size={13} className="animate-spin" />} Vérifier et enregistrer
                  </button>
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <AlertTriangle size={13} className="text-red-500 flex-shrink-0" /><p className="text-xs text-red-600">{error}</p>
              </div>
            )}
          </div>
        </section>

        {/* ── Espèces ── */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center"><Banknote size={18} className="text-green-700" /></div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Espèces à la livraison</p>
              <p className="text-xs text-gray-400 mt-0.5">Le client paie à la réception</p>
            </div>
          </div>
          <Toggle checked={cashEnabled} onChange={handleToggleCash} />
        </section>

        {/* ── Ancienne connexion Wave directe ── */}
        <details className="group bg-white border border-gray-100 rounded-xl">
          <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none list-none">
            <div>
              <p className="text-sm font-medium text-gray-700">Wave Business en direct (ancienne connexion)</p>
              <p className="text-2xs text-gray-400 mt-0.5">Utilisée seulement si le paiement mobile PayDunya n'est pas configuré</p>
            </div>
            <ChevronDown size={16} className="text-gray-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-5 pb-5 space-y-3">
            <SecretInput label="Clé API Wave" value={wave.apiKey} onChange={(v) => setWave((w) => ({ ...w, apiKey: v }))} placeholder="wave_sn_prod_…" />
            <SecretInput label="Webhook Secret" value={wave.webhookSecret} onChange={(v) => setWave((w) => ({ ...w, webhookSecret: v }))} placeholder="whsec_…" />
            <p className="text-2xs text-gray-400">Adresse de notification à indiquer chez Wave : <span className="font-mono bg-gray-50 px-1 rounded">https://api.skanema.com/api/payment/wave/webhook</span></p>
            <div className="flex items-center gap-3">
              <button onClick={saveWave} disabled={waveBusy} className="btn-ghost flex items-center gap-2">{waveBusy && <Loader2 size={13} className="animate-spin" />} Enregistrer</button>
              {waveMsg && <span className="text-xs text-gray-500">{waveMsg}</span>}
            </div>
          </div>
        </details>
      </div>
    </DashboardLayout>
  )
}
