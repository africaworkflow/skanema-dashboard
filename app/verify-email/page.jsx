'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skanema.com'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token')
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Lien invalide.'); return }

    fetch(`${API_URL}/api/auth/verify-email/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStatus('success')
          setMessage('Votre email est vérifié. Votre bot WhatsApp est maintenant actif !')
          setTimeout(() => router.push('/dashboard'), 3000)
        } else {
          setStatus('error')
          setMessage(data.message || 'Lien invalide ou expiré.')
        }
      })
      .catch(() => { setStatus('error'); setMessage('Erreur réseau. Veuillez réessayer.') })
  }, [token, router])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <BrandLogo className="mb-3" />
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 size={40} className="animate-spin text-gray-300 mx-auto mb-4" />
              <p className="text-sm font-medium text-gray-900">Vérification en cours…</p>
              <p className="text-xs text-gray-400 mt-1">Veuillez patienter</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Email vérifié !</p>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">{message}</p>
              <p className="text-xs text-gray-400">Redirection vers le dashboard…</p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <XCircle size={32} className="text-red-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Lien invalide</p>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">{message}</p>
              <a href="/login" className="btn-primary text-xs py-2 px-4 inline-block">
                Retour à la connexion
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
