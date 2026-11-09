'use client'
import { useState } from 'react'
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skanema.com'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Veuillez entrer votre email.'); return }
    setLoading(true)
    setError('')
    try {
      const res  = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (data.success) setSent(true)
      else setError(data.message || 'Une erreur est survenue.')
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
          <p className="text-sm text-gray-400">Réinitialisation du mot de passe</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-green-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Email envoyé !</p>
              <p className="text-xs text-gray-500 leading-relaxed mb-6">
                Si un compte existe avec cet email, vous recevrez un lien de réinitialisation dans quelques minutes.
              </p>
              <a href="/login" className="text-xs text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5">
                <ArrowLeft size={13} /> Retour à la connexion
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Mot de passe oublié ?</p>
                <p className="text-xs text-gray-400 mb-4">Entrez votre email pour recevoir un lien de réinitialisation.</p>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@votresto.sn"
                  className="input"
                  style={{ fontSize: '16px' }}
                  autoComplete="email"
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
                {loading ? 'Envoi en cours…' : 'Envoyer le lien'}
              </button>

              <a href="/login" className="text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1.5 mt-2">
                <ArrowLeft size={13} /> Retour à la connexion
              </a>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
