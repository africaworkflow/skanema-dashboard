'use client'
import { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useSetupProgress } from '@/hooks/useSetupProgress'

// « Étape terminée → Suivant » : visible seulement en arrivant depuis le parcours de démarrage (?guide=1),
// une fois que la page indique que son étape est faite (done).
export function NextStepBanner({ current, done }) {
  const [guided, setGuided] = useState(false)
  useEffect(() => { setGuided(new URLSearchParams(window.location.search).get('guide') === '1') }, [])

  const { steps, loading } = useSetupProgress(guided && done)

  if (!guided || !done || loading) return null
  const next = steps.find((s) => !s.done && s.id !== current)
  const href = next?.link ? `${next.link}?guide=1` : '/dashboard'

  return (
    <div role="status" className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl px-4 py-3.5 mb-5">
      <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-green-800">Étape terminée</p>
        <p className="text-xs text-green-700 truncate">{next ? `Suivant : ${next.label.charAt(0).toLowerCase()}${next.label.slice(1)}` : 'Tout est en place'}</p>
      </div>
      <a href={href} className="text-xs font-semibold bg-green-700 text-white px-3.5 py-2 rounded-lg hover:bg-green-800 whitespace-nowrap">
        {next?.link ? 'Continuer →' : 'Retour à l\'accueil'}
      </a>
    </div>
  )
}
