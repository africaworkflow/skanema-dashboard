'use client'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Toggle } from '@/components/ui/Toggle'
import { AddressSearch, countryFromPhone } from '@/components/ui/AddressSearch'
import { NextStepBanner } from '@/components/ui/NextStepBanner'
import { PlanGate } from '@/components/ui/PlanGate'
import { formatFCFA } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { isDefaultPosition } from '@/hooks/useSetupProgress'
import { MapPin, Plus, Pencil, Trash2, X, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getZones, updateZones } from '@/lib/api'

// Zones conseillées pour démarrer (modifiables ensuite). L'essai n'a droit qu'à une zone.
const SUGGESTED = {
  one  : [{ name: 'Zone 1 — jusqu\'à 6 km', radiusKm: 6, fee: 1500, active: true }],
  three: [
    { name: 'Zone 1 — jusqu\'à 3 km',  radiusKm: 3,  fee: 1000, active: true },
    { name: 'Zone 2 — jusqu\'à 6 km',  radiusKm: 6,  fee: 1500, active: true },
    { name: 'Zone 3 — jusqu\'à 10 km', radiusKm: 10, fee: 2000, active: true },
  ],
}
// Zones créées automatiquement à l'inscription : jamais choisies par le restaurant
const isFactoryZones = (zones) => zones.length === 3 &&
  zones.every((z, i) => z.name === ['Zone A', 'Zone B', 'Zone C'][i] && z.radiusKm === [3, 7, 15][i] && z.fee === [1000, 2000, 3000][i])

// Cercles autour du restaurant : le client paie la plus petite zone qui le contient
function Rings() {
  return (
    <svg width="88" height="88" viewBox="0 0 96 96" className="flex-shrink-0" aria-hidden="true">
      <circle cx="48" cy="48" r="46" fill="#F3F4F6" /><circle cx="48" cy="48" r="31" fill="#E5E7EB" />
      <circle cx="48" cy="48" r="16" fill="#D1D5DB" /><circle cx="48" cy="48" r="4" fill="#111827" />
    </svg>
  )
}

export default function ZonesPage() {
  const { user } = useAuth()
  const [zones,    setZones]    = useState([])
  const [position, setPosition] = useState({ latitude: 14.6937, longitude: -17.4441 })
  const [posSaved, setPosSaved] = useState(false) // position réelle enregistrée (pas celle par défaut)
  const [posEdit,  setPosEdit]  = useState(false)
  const [custom,   setCustom]   = useState(false) // « Créer mes zones moi-même »
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [form,     setForm]     = useState({ name: '', radiusKm: '', fee: '', active: true })
  const [error,    setError]    = useState('')
  const [pageErr,  setPageErr]  = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getZones()
        setZones(res.data.zones || [])
        if (res.data.location) setPosition(res.data.location)
        setPosSaved(!isDefaultPosition(res.data.location))
      } catch (_) {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  // Enregistre ; en cas d'échec rien n'est changé à l'écran
  const saveZones = async (newZones) => {
    setPageErr('')
    try { await updateZones({ zones: newZones }); setZones(newZones); return true }
    catch (e) { setPageErr(e.response?.data?.message || 'Impossible d\'enregistrer les zones. Vérifiez votre connexion et réessayez.'); return false }
  }

  const openCreate = () => {
    setEditing(null); setForm({ name: '', radiusKm: '', fee: '', active: true }); setError(''); setModal(true)
  }
  const openEdit = (z, i) => {
    setEditing(i); setForm({ name: z.name, radiusKm: String(z.radiusKm), fee: String(z.fee), active: z.active }); setError(''); setModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.radiusKm || form.fee === '') { setError('Tous les champs sont obligatoires.'); return }
    setSaving(true)
    const newZones = editing !== null
      ? zones.map((z, i) => i === editing ? { ...z, name: form.name, radiusKm: Number(form.radiusKm), fee: Number(form.fee), active: form.active } : z)
      : [...zones, { name: form.name, radiusKm: Number(form.radiusKm), fee: Number(form.fee), active: true }]
    const ok = await saveZones(newZones)
    setSaving(false)
    if (ok) setModal(false)
  }
  const handleDelete = (i) => saveZones(zones.filter((_, idx) => idx !== i))
  const handleToggle = (i) => saveZones(zones.map((z, idx) => idx === i ? { ...z, active: !z.active } : z))

  const handleSavePosition = async () => {
    setSaving(true); setPageErr('')
    try {
      await updateZones({ latitude: position.latitude, longitude: position.longitude })
      setPosSaved(true); setPosEdit(false)
    } catch (_) { setPageErr('Impossible d\'enregistrer la position. Vérifiez votre connexion et réessayez.') }
    finally { setSaving(false) }
  }

  const applySuggested = async () => {
    setSaving(true)
    if (await saveZones(suggested)) setCustom(true)
    setSaving(false)
  }

  if (loading) return (
    <DashboardLayout title="Zones de livraison" subtitle="Où vous êtes, jusqu'où vous livrez">
      <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-gray-300" /></div>
    </DashboardLayout>
  )

  const plan        = user?.plan || 'basic'
  const maxZones    = { basic: 1, pro: 3, premium: 99 }[plan] ?? 1
  const suggested   = maxZones >= 3 ? SUGGESTED.three : SUGGESTED.one
  const showSuggest = posSaved && !custom && (zones.length === 0 || isFactoryZones(zones))
  const hasActive   = zones.some((z) => z.active !== false)
  const activeCount = zones.filter((z) => z.active !== false).length
  const atLimit     = activeCount >= maxZones
  // À la limite, « Ajouter une zone » ouvre l'invitation à l'offre supérieure (comme pour les articles)
  const zoneGate = {
    currentPlan : plan,
    requiredPlan: atLimit && plan !== 'premium' ? (plan === 'pro' ? 'premium' : 'pro') : 'basic',
    feature     : `Avoir plus de ${maxZones} zone${maxZones > 1 ? 's' : ''} de livraison`,
  }
  const positionOk  = !isDefaultPosition(position)
  const stepDone    = posSaved && hasActive && !showSuggest

  return (
    <DashboardLayout
      title="Zones de livraison"
      subtitle="Où vous êtes, jusqu'où vous livrez"
      actions={posSaved && !showSuggest ? (
        <PlanGate {...zoneGate}>
          <button onClick={openCreate} className="btn-primary flex items-center gap-1.5">
            <Plus size={14} /> <span className="hidden sm:inline">Ajouter une zone</span>
          </button>
        </PlanGate>
      ) : null}
    >
      <div className="space-y-4 max-w-2xl">
        <NextStepBanner current="zones" done={stepDone} />

        {/* Où en est-on */}
        <div className="flex items-center gap-2 text-2xs font-semibold">
          {posSaved
            ? <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={12} /> Position enregistrée</span>
            : <span className="bg-gray-900 text-white rounded-full px-2.5 py-0.5">1 · Votre position</span>}
          <span className="text-gray-300">——</span>
          {stepDone
            ? <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={12} /> Zones prêtes</span>
            : <span className={posSaved ? 'bg-gray-900 text-white rounded-full px-2.5 py-0.5' : 'text-gray-400'}>2 · Vos zones</span>}
        </div>

        {pageErr && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertTriangle size={14} className="text-red-500 flex-shrink-0" /><p className="text-xs text-red-600">{pageErr}</p>
          </div>
        )}

        {/* 1 · Position */}
        {!posSaved || posEdit ? (
          <div className="bg-white border-2 border-gray-900 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Où se trouve votre restaurant ?</h2>
              <p className="text-xs text-gray-500 mt-1">C'est le point de départ : la distance jusqu'au client fixe ses frais de livraison.</p>
            </div>
            <AddressSearch prominentGps latitude={position.latitude} longitude={position.longitude}
              country={countryFromPhone(user?.phone)} near={positionOk ? position : null}
              onSelect={({ latitude, longitude }) => setPosition({ latitude, longitude })} />
            <div className="flex gap-2">
              {posEdit && <button onClick={() => setPosEdit(false)} className="btn-ghost flex-1">Annuler</button>}
              <button onClick={handleSavePosition} disabled={saving || !positionOk}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 disabled:opacity-40">
                {saving && <Loader2 size={13} className="animate-spin" />} Enregistrer cette position
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl px-5 py-3.5 flex items-center gap-3">
            <MapPin size={16} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Position du restaurant</p>
              <p className="text-2xs text-gray-400 font-mono">{Number(position.latitude).toFixed(5)}, {Number(position.longitude).toFixed(5)}</p>
            </div>
            <button onClick={() => setPosEdit(true)} className="text-xs font-medium text-gray-700 underline">Modifier</button>
          </div>
        )}

        {/* 2 · Zones */}
        {!posSaved ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 opacity-50">
            <p className="text-sm font-semibold text-gray-900">Jusqu'où livrez-vous ?</p>
            <p className="text-xs text-gray-400 mt-0.5">Disponible une fois la position enregistrée.</p>
          </div>
        ) : showSuggest ? (
          <div className="bg-white border-2 border-gray-900 rounded-2xl p-5">
            <h2 className="text-base font-bold text-gray-900">Jusqu'où livrez-vous ?</h2>
            <div className="flex gap-4 items-center mt-3">
              <Rings />
              <p className="text-xs text-gray-500 leading-relaxed">Chaque zone est un cercle autour du restaurant. Le client paie les frais de la plus petite zone où il se trouve. Au-delà, on lui dit que vous ne livrez pas chez lui.</p>
            </div>
            <p className="text-xs font-semibold text-gray-700 mt-4 mb-2">Nos conseils pour commencer (modifiables)</p>
            <div className="space-y-2">
              {suggested.map((z) => (
                <div key={z.radiusKm} className="flex justify-between text-sm border border-gray-200 rounded-xl px-3.5 py-2.5">
                  <span>Jusqu'à <b>{z.radiusKm} km</b></span><span className="font-semibold">{formatFCFA(z.fee)}</span>
                </div>
              ))}
            </div>
            <button onClick={applySuggested} disabled={saving} className="btn-primary w-full mt-4 py-3 flex items-center justify-center gap-2">
              {saving && <Loader2 size={13} className="animate-spin" />}
              {suggested.length > 1 ? `Utiliser ces ${suggested.length} zones` : 'Utiliser cette zone'}
            </button>
            <button onClick={() => { setCustom(true); if (isFactoryZones(zones)) return; openCreate() }} className="w-full mt-2 text-xs text-gray-500 underline">
              Créer mes zones moi-même
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-50">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">Jusqu'où livrez-vous ?</p>
                {plan !== 'premium' && (
                  <p className={`text-2xs font-medium whitespace-nowrap ${activeCount > maxZones ? 'text-amber-600' : 'text-gray-400'}`}>
                    {activeCount} zone{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''} sur {maxZones}
                  </p>
                )}
              </div>
              <p className="text-2xs text-gray-400 mt-0.5">Le client paie les frais de la plus petite zone où il se trouve. Une zone désactivée n'est plus proposée.</p>
            </div>
            {zones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <MapPin size={24} className="text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Aucune zone : vos clients ne peuvent pas être livrés.</p>
                <div className="mt-3"><PlanGate {...zoneGate}><button onClick={openCreate} className="btn-primary flex items-center gap-1.5"><Plus size={14} /> Ajouter une zone</button></PlanGate></div>
              </div>
            ) : zones.map((zone, i) => (
              <div key={i} className={`flex items-center gap-4 px-5 py-4 ${i < zones.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{zone.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Jusqu'à {zone.radiusKm} km · {formatFCFA(zone.fee)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Toggle checked={zone.active} onChange={() => handleToggle(i)} />
                  <button onClick={() => openEdit(zone, i)} aria-label="Modifier" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(i)} aria-label="Supprimer" className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal zone */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">{editing !== null ? 'Modifier la zone' : 'Nouvelle zone'}</h2>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={15}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Nom de la zone</label>
                <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Zone A — Centre-ville" className="input"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Rayon maximum (km)</label>
                <input type="number" value={form.radiusKm} onChange={e => setForm(f=>({...f,radiusKm:e.target.value}))} placeholder="5" min={1} className="input"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Frais de livraison (FCFA)</label>
                <input type="number" value={form.fee} onChange={e => setForm(f=>({...f,fee:e.target.value}))} placeholder="1500" min={0} className="input"/>
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <AlertTriangle size={13} className="text-red-500"/>
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setModal(false)} className="btn-ghost flex-1">Annuler</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={13} className="animate-spin"/>}
                  {editing !== null ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
