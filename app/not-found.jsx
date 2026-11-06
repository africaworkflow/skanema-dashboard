'use client'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">

      {/* Logo */}
      <Link href="https://www.skanema.com" className="flex items-center gap-2.5 mb-16">
        <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <span className="text-gray-900 text-base font-semibold">Skanema</span>
      </Link>

      {/* 404 */}
      <div className="mb-6">
        <p className="text-8xl font-black text-gray-900 leading-none tracking-tighter">404</p>
      </div>

      <h1 className="text-xl font-semibold text-gray-900 mb-3">
        Cette page n'existe pas
      </h1>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-10">
        Le lien que vous avez suivi est peut-être incorrect ou la page a été déplacée.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link href="https://dashboard.skanema.com/dashboard"
          className="bg-gray-900 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors">
          Retour au dashboard
        </Link>
        <Link href="https://www.skanema.com"
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-6 py-3">
          Accueil Skanema
        </Link>
      </div>

      {/* Support */}
      <p className="text-xs text-gray-300 mt-16">
        Un problème ?{' '}
        <a href="https://wa.me/221784632103" target="_blank" rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-600 underline transition-colors">
          Contactez le support
        </a>
      </p>
    </div>
  )
}
