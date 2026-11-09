'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Ancienne adresse : l'abonnement se gère désormais sur /dashboard/abonnement
export default function AbonnementExpireRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/abonnement') }, [router])
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
