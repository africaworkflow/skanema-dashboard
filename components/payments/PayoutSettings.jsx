'use client'
import { useState } from 'react'
import { Loader2, Lock, AlertTriangle } from 'lucide-react'
import { requestPayoutCode, confirmPayoutCode, updateFeesPaidBy } from '@/lib/api'

const OPS = { wave: { label: 'Wave', logo: '/payments/wave.png' }, om: { label: 'Orange Money', logo: '/payments/orange-money.png' } }
const fmtPhone = (p) => String(p || '').replace(/^(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4')
const fcfa = (n) => `${Number(n).toLocaleString('fr-FR')} FCFA`

function OperatorChoice({ value, onChange }) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold text-gray-900 mb-2">Recevoir l'argent sur</legend>
      <div className="grid grid-cols-2 gap-2.5">
        {Object.entries(OPS).map(([k, o]) => (
          <label key={k} className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl cursor-pointer text-sm ${value === k ? 'border-2 border-gray-900 font-semibold' : 'border border-gray-200 font-medium'}`}>
            <input type="radio" name="payout-operator" checked={value === k} onChange={() => onChange(k)} className="accent-gray-900" />
            <img src={o.logo} alt="" className="w-7 h-7 rounded-lg object-contain" /> {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

// Numéro de réception (confirmé par un code WhatsApp) et, quand Skanema encaisse, qui paie les frais
export function PayoutSettings({ payout, payments, onPayout, onFees }) {
  const [editing, setEditing]   = useState(!payout)
  const [operator, setOperator] = useState(payout?.operator || 'wave')
  const [phone, setPhone]       = useState('')
  const [sent, setSent]         = useState(null)   // { sentTo }
  const [code, setCode]         = useState('')
  const [busy, setBusy]         = useState(false)
  const [error, setError]       = useState('')

  const reset = () => { setSent(null); setCode(''); setPhone(''); setError(''); setEditing(!payout) }

  const ask = async () => {
    setError(''); setBusy(true)
    try { const r = await requestPayoutCode({ operator, phone }); setSent({ sentTo: r.data.sentTo }) }
    catch (e) { setError(e.response?.data?.message || 'Envoi du code impossible. Réessayez.') }
    finally { setBusy(false) }
  }
  const confirm = async () => {
    setError(''); setBusy(true)
    try { const r = await confirmPayoutCode(code); onPayout(r.data.payout); setSent(null); setCode(''); setPhone(''); setEditing(false) }
    catch (e) { setError(e.response?.data?.message || 'Confirmation impossible. Réessayez.') }
    finally { setBusy(false) }
  }
  const setFees = async (v) => {
    const prev = payments.feesPaidBy
    onFees(v)
    try { await updateFeesPaidBy(v) } catch (_) { onFees(prev); setError('Modification non enregistrée. Réessayez.') }
  }

  const ex = payments?.example
  return (
    <>
      <section className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-900">Où recevoir votre argent</p>

        {payout && !editing && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3">
              <img src={OPS[payout.operator]?.logo} alt="" className="w-8 h-8 rounded-lg object-contain" />
              <div>
                <p className="text-2xs text-gray-500">{OPS[payout.operator]?.label}</p>
                <p className="text-base font-semibold text-gray-900">{fmtPhone(payout.phone)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700">Vérifié</span>
              <button onClick={() => { setEditing(true); setOperator(payout.operator) }} className="text-xs font-medium text-gray-700 underline py-2">Changer</button>
            </div>
          </div>
        )}

        {editing && !sent && (
          <div className="space-y-3">
            <OperatorChoice value={operator} onChange={setOperator} />
            <label className="block text-xs font-medium text-gray-700">{payout ? 'Nouveau numéro' : 'Numéro'}
              <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="77 123 45 67"
                className="input mt-1.5 block w-full max-w-xs text-base sm:text-sm" />
            </label>
            <p className="text-2xs text-gray-500">Le numéro doit avoir un compte chez l'opérateur choisi.</p>
            <div className="flex gap-2">
              {payout && <button onClick={reset} className="btn-ghost">Annuler</button>}
              <button onClick={ask} disabled={busy || !phone.trim()} className="btn-primary flex items-center gap-2">{busy && <Loader2 size={13} className="animate-spin" />} Recevoir le code</button>
            </div>
          </div>
        )}

        {sent && (
          <div className="space-y-3">
            <div className="flex gap-2.5 px-3.5 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <Lock size={15} className="flex-shrink-0 mt-px" /> Code envoyé sur votre WhatsApp ({sent.sentTo}).
            </div>
            <label className="block text-xs font-medium text-gray-700">Code reçu
              <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="6 chiffres" className="input mt-1.5 block w-full max-w-[200px] text-base tracking-[4px]" />
            </label>
            <div className="flex gap-2">
              <button onClick={reset} className="btn-ghost">Annuler</button>
              <button onClick={confirm} disabled={busy || code.length !== 6} className="btn-primary flex items-center gap-2">{busy && <Loader2 size={13} className="animate-spin" />} Confirmer</button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertTriangle size={13} className="text-red-500 flex-shrink-0" /><p className="text-xs text-red-600">{error}</p>
          </div>
        )}
      </section>

      {payments?.mode === 'platform' && (
        <section className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-900">Frais de paiement en ligne</p>
          {[['customer', 'Le client paie les frais'], ['merchant', 'Je prends les frais à ma charge']].map(([k, label]) => (
            <label key={k} className={`flex gap-3 items-start px-4 py-3.5 rounded-xl cursor-pointer ${payments.feesPaidBy === k ? 'border-2 border-gray-900' : 'border border-gray-200'}`}>
              <input type="radio" name="fees" checked={payments.feesPaidBy === k} onChange={() => setFees(k)} className="mt-0.5 accent-gray-900" />
              <span>
                <span className="block text-sm font-semibold text-gray-900">{label}</span>
                {ex && <span className="block mt-1 text-xs text-gray-600">Ex. {Number(ex.total).toLocaleString('fr-FR')} → vous recevez {fcfa(ex[k].net)}</span>}
              </span>
            </label>
          ))}
        </section>
      )}
    </>
  )
}
