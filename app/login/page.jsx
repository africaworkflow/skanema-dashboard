'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const { login } = useAuth()
  const router    = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      router.push('/dashboard')
    } catch (err) {
      setPassword('')
      setError(err.response?.data?.message || 'Identifiants invalides.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <BrandLogo className="mb-3" />
          <p className="text-sm text-gray-400">
            Connectez-vous à votre espace restaurant
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            <div>
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

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-10"
                  style={{ fontSize: '16px' }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <a href="/forgot-password" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Mot de passe oublié ?
              </a>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Skanema © {new Date().getFullYear()} — Plateforme de commande WhatsApp
        </p>
      </div>
    </div>
  )
}
