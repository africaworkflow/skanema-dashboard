'use client'
import { useState, useEffect } from 'react'
import { CheckCircle2, ChevronRight, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { useSetupProgress } from '@/hooks/useSetupProgress'

// Parcours de démarrage : l'étape suivante est ouverte d'office, avec sa durée et un bouton pour y aller.
// Le lien ajoute ?guide=1 : la page affiche alors « Étape terminée → Suivant » une fois l'étape faite.
export function SetupChecklist() {
  const { user, loading: authLoading } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [mounted,   setMounted]   = useState(false)
  const [opened,    setOpened]    = useState(undefined) // undefined = l'étape suivante est ouverte

  useEffect(() => { setMounted(true) }, [])

  // Préférence enregistrée en base : synchronisée sur tous les appareils
  const hidden = dismissed || Boolean(user?.uiPreferences?.checklistDismissed)
  const ready  = mounted && !authLoading && Boolean(user?.restaurantId) && !hidden
  const { steps, loading } = useSetupProgress(ready)

  const handleDismiss = async () => {
    setDismissed(true)
    try { await api.patch('/api/auth/ui-preferences', { checklistDismissed: true }) } catch (_) {}
  }

  if (!ready || loading) return null

  const doneCount = steps.filter((s) => s.done).length
  const allDone   = doneCount === steps.length
  const next      = steps.find((s) => !s.done)
  const minutes   = steps.filter((s) => !s.done).reduce((t, s) => t + s.minutes, 0)
  const expanded  = opened === undefined ? next?.id : opened

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6 shadow-sm">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">{allDone ? 'Votre restaurant est prêt' : 'Votre restaurant prend ses premières commandes'}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {doneCount} étape{doneCount > 1 ? 's' : ''} sur {steps.length}{!allDone && minutes > 0 ? ` · environ ${minutes} minutes` : ''}
            </p>
          </div>
          <button onClick={handleDismiss} aria-label="Masquer" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
            <X size={14} />
          </button>
        </div>
        <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gray-900 rounded-full transition-all duration-700" style={{ width: `${Math.round((doneCount / steps.length) * 100)}%` }} />
        </div>
      </div>

      <div className="border-t border-gray-50">
        {steps.map((step, i) => {
          const isExp  = expanded === step.id
          const isNext = next?.id === step.id
          return (
            <div key={step.id} className={`border-b border-gray-50 last:border-0 ${isExp && !step.done ? 'bg-gray-50/70' : ''}`}>
              <button onClick={() => setOpened(isExp ? null : step.id)} aria-expanded={isExp}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left">
                {step.done
                  ? <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
                  : <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-2xs font-bold flex-shrink-0 ${isNext ? 'border-gray-900 text-gray-900' : 'border-gray-200 text-gray-400'}`}>{i + 1}</span>}
                <span className={`flex-1 min-w-0 text-sm ${step.done ? 'text-gray-400 line-through' : isNext ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{step.label}</span>
                {!step.done && step.minutes > 0 && <span className="text-2xs text-gray-400 flex-shrink-0">{step.minutes} min</span>}
                <ChevronRight size={14} className={`text-gray-300 flex-shrink-0 transition-transform duration-200 ${isExp ? 'rotate-90' : ''}`} />
              </button>
              {isExp && (
                <div className="px-5 pb-4 -mt-1 ml-8">
                  <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                  {!step.done && step.link && (
                    <a href={`${step.link}?guide=1`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                      {step.cta} →
                    </a>
                  )}
                  {step.done && (
                    <span className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle2 size={12} /> Fait</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {allDone && (
        <div className="px-5 py-4 bg-green-50 border-t border-green-100 flex items-center justify-between gap-3">
          <p className="text-xs text-green-700 font-medium flex items-center gap-1.5"><CheckCircle2 size={14} className="flex-shrink-0" /> Tout est en place : vos clients peuvent commander sur WhatsApp.</p>
          <button onClick={handleDismiss} className="text-xs text-green-600 underline flex-shrink-0">Fermer</button>
        </div>
      )}
    </div>
  )
}
