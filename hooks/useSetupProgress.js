'use client'
import { useState, useEffect, useCallback } from 'react'
import api, { getMenu, getZones, getStats } from '@/lib/api'

// Parcours de démarrage : une seule définition pour la liste de l'accueil et le bandeau « Étape terminée ».
export const SETUP_STEPS = [
  { id: 'account',  label: 'Compte créé',                desc: 'Votre restaurant est enregistré sur Skanema.', link: null, minutes: 0 },
  { id: 'menu',     label: 'Ajoutez vos plats',          desc: 'Commencez par vos 5 plats les plus vendus, avec leur prix. Vous compléterez plus tard.', link: '/dashboard/menu', minutes: 5, cta: 'Ajouter mes plats' },
  { id: 'zones',    label: 'Indiquez où vous livrez',    desc: 'La position du restaurant et vos frais de livraison. Sans ça, vos clients ne peuvent pas commander.', link: '/dashboard/zones', minutes: 2, cta: 'C\'est parti' },
  { id: 'whatsapp', label: 'Connectez votre WhatsApp',   desc: 'Le numéro sur lequel vos clients vont commander. Prévoyez un numéro qui n\'est pas encore sur WhatsApp.', link: '/dashboard/whatsapp', minutes: 5, cta: 'Connecter WhatsApp' },
  { id: 'test',     label: 'Passez une commande test',   desc: 'Depuis un autre téléphone, envoyez « Bonjour » au numéro WhatsApp du restaurant et commandez un plat en cash. L\'étape se coche toute seule.', link: null, minutes: 2 },
]

// Position par défaut à l'inscription (Dakar-Plateau) : tant qu'elle n'a pas changé, la position n'est pas renseignée
const DEFAULT_POS = { latitude: 14.6937, longitude: -17.4441 }
export const isDefaultPosition = (loc) =>
  !loc || (Math.abs(loc.latitude - DEFAULT_POS.latitude) < 0.001 && Math.abs(loc.longitude - DEFAULT_POS.longitude) < 0.001)

export const isWhatsAppConnected = (pid) => Boolean(pid) && !String(pid).startsWith('PENDING_') && pid !== 'A_CONFIGURER'

export function useSetupProgress(enabled = true) {
  const [done,    setDone]    = useState(null) // { account, menu, zones, whatsapp, test }
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const [menuRes, zonesRes, meRes, statsRes] = await Promise.allSettled([getMenu(), getZones(), api.get('/api/auth/me'), getStats()])
    const ok = (r) => r.status === 'fulfilled'
    const zones = ok(zonesRes) ? zonesRes.value.data.zones || [] : []
    setDone({
      account : true,
      menu    : ok(menuRes) && menuRes.value.data.count > 0,
      zones   : ok(zonesRes) && !isDefaultPosition(zonesRes.value.data.location) && zones.some((z) => z.active !== false),
      whatsapp: ok(meRes) && isWhatsAppConnected(meRes.value.data.data?.whatsappPhoneNumberId),
      test    : ok(statsRes) && (statsRes.value.data.data?.totalOrders || 0) > 0,
    })
    setLoading(false)
  }, [])

  useEffect(() => { if (enabled) refresh().catch(() => setLoading(false)) }, [enabled, refresh])

  const steps = SETUP_STEPS.map((s) => ({ ...s, done: Boolean(done?.[s.id]) }))
  return { steps, loading, refresh }
}
