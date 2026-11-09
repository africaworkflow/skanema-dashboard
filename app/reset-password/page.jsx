'use client'
import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skanema.com'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token')

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [error,     setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!password || !passRegex.test(password)) { 
    setError('8 caractères minimum, une majuscule, une minuscule et un chiffre.'); 
  return 
}
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (!token) { setError('Lien invalide.'); return }

    setLoading(true)
    setError('')
    try {
      const res  = await fetch(`${API_URL}/api/auth/reset-password/${token}`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        setTimeout(() => router.push('/login'), 3000)
      } else {
        setError(data.message || 'Lien invalide ou expiré.')
      }
    } catch (_) {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <BrandLogo className="mb-3" />
          <p className="text-sm text-gray-400">Nouveau mot de passe</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-green-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Mot de passe modifié !</p>
              <p className="text-xs text-gray-400">Redirection vers la connexion…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-4">Choisissez un nouveau mot de passe</p>

                <label className="block text-xs font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
                <div className="relative mb-4">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    className="input pr-10"
                    style={{ fontSize: '16px' }}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  style={{ fontSize: '16px' }}
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}
