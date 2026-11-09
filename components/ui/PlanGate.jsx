'use client'
import { useState } from 'react'
import { X, Zap, ArrowRight } from 'lucide-react'

const PLAN_ORDER = { basic: 0, pro: 1, premium: 2 }

const PLAN_FEATURES = {
  pro: {
    label   : 'Pro',
    price   : '35 000 FCFA / 30 jours',
    features: ['25 articles au menu', '3 zones de livraison', 'Statistiques des ventes', 'Reçus par e-mail'],
  },
  premium: {
    label   : 'Premium',
    price   : '75 000 FCFA / 30 jours',
    features: ['Articles et zones illimités', 'Votre menu mis en ligne par notre équipe', 'Kit QR imprimé pour le comptoir et les tables', 'Ligne WhatsApp directe avec l\'équipe Skanema'],
  },
}

/**
 * Composant gate — bloque une action si le plan est insuffisant
 * Usage :
 *   <PlanGate currentPlan="basic" requiredPlan="pro" feature="Ajouter plus de 10 plats">
 *     <button>Ajouter un plat</button>
 *   </PlanGate>
 */
export function PlanGate({ currentPlan = 'basic', requiredPlan = 'pro', feature, children }) {
  const [showModal, setShowModal] = useState(false)
  const hasAccess = PLAN_ORDER[currentPlan] >= PLAN_ORDER[requiredPlan]

  if (hasAccess) return children

  const upgrade = PLAN_FEATURES[requiredPlan] || PLAN_FEATURES.pro

  return (
    <>
      {/* Clone l'enfant mais intercepte le clic */}
      <div
        onClick={e => { e.preventDefault(); e.stopPropagation(); setShowModal(true) }}
        className="cursor-pointer"
      >
        <div className="pointer-events-none opacity-60">
          {children}
        </div>
      </div>

      {/* Modal upgrade */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                <Zap size={18} className="text-white" />
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X size={15} />
              </button>
            </div>

            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Passez au plan {upgrade.label}
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              <strong className="text-gray-700">{feature}</strong> est disponible à partir du plan {upgrade.label}.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
              {upgrade.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                  <div className="w-4 h-4 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                    <ArrowRight size={8} className="text-white" />
                  </div>
                  {f}
                </div>
              ))}
              <p className="text-xs font-semibold text-gray-900 pt-1">{upgrade.price}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="btn-ghost flex-1 text-xs py-2"
              >
                Plus tard
              </button>
              <button
                onClick={() => { setShowModal(false); window.location.href = '/dashboard/abonnement' }}
                className="btn-primary flex-1 text-xs py-2 flex items-center justify-center gap-1.5"
              >
                Passer au plan {upgrade.label}
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Hook utilitaire pour vérifier l'accès à une feature
 */
export function usePlanAccess(currentPlan = 'basic', requiredPlan = 'pro') {
  return PLAN_ORDER[currentPlan] >= PLAN_ORDER[requiredPlan]
}
