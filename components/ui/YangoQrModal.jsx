'use client'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { X, Copy, Check, Smartphone } from 'lucide-react'

// Sur ordinateur (comptoir) : la course Yango s'ouvre sur le téléphone en scannant ce QR code.
export function YangoQrModal({ link, order, onClose }) {
  const [svg,    setSvg]    = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    QRCode.toString(link, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }).then(setSvg).catch(() => setSvg(''))
  }, [link])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const copyPhone = async () => {
    try { await navigator.clipboard.writeText(order.customerPhone); setCopied(true); setTimeout(() => setCopied(false), 2500) } catch (_) {}
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="yango-title" className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <h2 id="yango-title" className="text-base font-semibold text-gray-900">Livrer avec Yango</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-1.5 -mt-1 -mr-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={15} /></button>
        </div>
        <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-4">
          <Smartphone size={13} className="flex-shrink-0" /> Scannez avec le téléphone qui a l'appli Yango
        </p>

        <div className="mx-auto w-56 h-56 rounded-xl border border-gray-100 p-2 flex items-center justify-center">
          {svg
            ? <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full" role="img" aria-label="QR code de la course Yango" dangerouslySetInnerHTML={{ __html: svg }} />
            : <div className="w-full h-full bg-gray-50 rounded-lg animate-pulse" />}
        </div>
        <p className="text-xs text-gray-500 text-center mt-3">
          La course <b className="text-gray-900">Express Moto</b> s'ouvre, de votre restaurant jusqu'au client ({order.orderNumber}).
        </p>

        <div className="mt-5 bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xs text-gray-400">Destinataire à indiquer dans Yango</p>
            <p className="text-sm font-semibold text-gray-900 tabular-nums">{order.customerPhone}</p>
          </div>
          <button onClick={copyPhone} className="btn-ghost text-xs py-1.5 flex items-center gap-1.5 flex-shrink-0">
            {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />} {copied ? 'Copié' : 'Copier'}
          </button>
        </div>

      </div>
    </div>
  )
}
