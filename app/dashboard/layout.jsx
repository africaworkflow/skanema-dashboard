'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { NewOrderAlert } from '@/components/ui/NewOrderAlert'

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }

    // Vérifie si trial expiré ou suspendu
    const sub = user?.subscription
    if (!sub) return
    const isTrialExpired = sub.status === 'trial' && new Date() > new Date(sub.trialEnds)
    const isSuspended    = sub.status === 'suspended' || sub.status === 'cancelled' || sub.status === 'pending'

    // La page abonnement reste accessible pour pouvoir payer
    if ((isTrialExpired || isSuspended) && pathname !== '/dashboard/abonnement') {
      router.replace('/dashboard/abonnement')
    }
  }, [user, loading, router, pathname])

  if (loading || !user) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // L'alerte « Nouvelle commande » reste montée d'une page du dashboard à l'autre
  return <>{children}<NewOrderAlert /></>
}
