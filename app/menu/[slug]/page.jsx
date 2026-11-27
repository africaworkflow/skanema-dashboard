'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Search, Clock, ChevronLeft, Plus, Minus, Trash2, ArrowRight, Loader2, MapPin, X, Bike } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skanema.com'

function formatFCFA(n) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA'
}

function Skeleton({ className, style }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} style={style} />
}

function nameToColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const colors = ['#1a1a2e,#16213e','#0f3460,#533483','#1b4332,#2d6a4f','#7b2d00,#a63c00','#370617,#6a040f','#1d3557,#457b9d']
  return colors[Math.abs(hash) % colors.length].split(',')
}

// ── Header ───────────────────────────────────────────────────────
function RestaurantHeader({ restaurant, items }) {
  const coverImages = items.filter(i => i.imageUrl).slice(0, 3).map(i => i.imageUrl)
  const hasCover    = !!restaurant.coverImage
  const hasMosaic   = !hasCover && coverImages.length > 0
  const [from, to]  = nameToColor(restaurant.name)
  const isOpen      = restaurant.isOpen !== false
  const openHint    = restaurant.openHint || ''

  return (
    <div className="relative flex-shrink-0" style={{ height: '240px' }}>
      <div className="absolute inset-0 overflow-hidden">
        {hasCover ? (
          <img src={restaurant.coverImage} alt={restaurant.name} className="w-full h-full object-cover object-center" />
        ) : hasMosaic ? (
          <div className="w-full h-full grid" style={{
            gridTemplateColumns: coverImages.length === 1 ? '1fr' : coverImages.length === 2 ? '1fr 1fr' : '2fr 1fr',
            gridTemplateRows   : coverImages.length === 3 ? '1fr 1fr' : '1fr',
          }}>
            {coverImages.map((url, i) => (
              <img key={i} src={url} alt="" className="w-full h-full object-cover"
                style={coverImages.length === 3 && i === 0 ? { gridRow: '1 / 3' } : {}} />
            ))}
          </div>
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)' }} />
      </div>

      {/* Vague */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: '28px' }}>
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,14 C65,28 130,0 195,14 C260,28 325,0 390,14 L390,28 L0,28 Z" fill="white" />
        </svg>
      </div>

      {/* Badge statut */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
           style={{ background: 'rgba(0,0,0,0.55)' }}>
        <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className="text-xs text-white font-medium">
          {isOpen ? `Ouvert${openHint ? ' · ' + openHint : ''}` : 'Fermé'}
        </span>
      </div>

      {/* Infos */}
      <div className="absolute bottom-10 left-4 right-4">
        <h1 className="font-bold text-white leading-tight mb-1" style={{ fontSize: '24px', letterSpacing: '-0.3px' }}>
          {restaurant.name}
        </h1>
        {restaurant.cuisineType && (
          <p className="text-sm font-medium mb-1" style={{ color: '#fbbf24' }}>{restaurant.cuisineType}</p>
        )}
        {restaurant.address && (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{restaurant.address}</p>
        )}
      </div>
    </div>
  )
}

// ── Badges info ──────────────────────────────────────────────────
function InfoBadges({ avgPrepTime }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
      <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2 flex-shrink-0">
        <Clock size={13} className="text-gray-500" />
        <div>
          <p className="text-xs font-semibold text-gray-900 leading-none">{avgPrepTime}–{avgPrepTime + 15} min</p>
          <p className="text-2xs text-gray-400">Livraison</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2 flex-shrink-0">
        <Bike size={13} className="text-gray-500" />
        <div>
          <p className="text-xs font-semibold text-gray-900 leading-none">Livraison</p>
          <p className="text-2xs text-gray-400">disponible</p>
        </div>
      </div>
    </div>
  )
}

// ── Popup détail plat ────────────────────────────────────────────
function ItemDetail({ item, onClose, onAdd }) {
  const [qty,      setQty]      = useState(1)
  const [selected, setSelected] = useState({})
  const [closing,  setClosing]  = useState(false)
  const [imgError, setImgError] = useState(false)

  // Bloque le scroll de la page derrière
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const handleClose = () => {
    setClosing(true)
    setTimeout(onClose, 260)
  }

  const groups = item.optionGroups || []

  const toggleChoice = (gi, ci, multiple) => {
    setSelected(prev => {
      const cur = prev[gi] || []
      if (multiple) return { ...prev, [gi]: cur.includes(ci) ? cur.filter(x => x !== ci) : [...cur, ci] }
      return { ...prev, [gi]: cur.includes(ci) ? [] : [ci] }
    })
  }

  const extraTotal = groups.reduce((sum, g, gi) =>
    sum + (selected[gi] || []).reduce((s, ci) => s + (Number(g.choices[ci]?.extraPrice) || 0), 0), 0)
  const unitPrice = item.price + extraTotal
  const total     = unitPrice * qty
  const canAdd    = groups.every((g, gi) => !g.required || (selected[gi] || []).length > 0)

  const handleAdd = () => {
    if (!canAdd) return
    const options = groups.reduce((acc, g, gi) => {
      const sel = selected[gi] || []
      if (sel.length > 0) acc.push({ group: g.name, choices: sel.map(ci => g.choices[ci].label) })
      return acc
    }, [])
    onAdd(item, qty, unitPrice, options)
    handleClose()
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: closing ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.4)', transition: 'background 0.26s ease' }}
        onClick={handleClose}
      />

      {/* Sheet — centré sur la même colonne que le menu */}
      <div
        className="fixed z-50 bg-white flex flex-col"
        style={{
          bottom        : 0,
          left          : '50%',
          transform     : 'translateX(-50%)',
          width         : '100%',
          maxWidth      : '480px',
          maxHeight     : '85dvh',
          borderRadius  : '20px 20px 0 0',
          animation     : closing ? 'slideDown 0.26s ease forwards' : 'slideUp 0.26s ease forwards',
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @keyframes slideUp   { from { transform: translateX(-50%) translateY(100%); } to { transform: translateX(-50%) translateY(0); } }
          @keyframes slideDown { from { transform: translateX(-50%) translateY(0); } to { transform: translateX(-50%) translateY(100%); } }
        `}</style>

        {/* Image — hauteur fixe, pas de zoom */}
        <div className="relative flex-shrink-0 rounded-t-[20px] overflow-hidden" style={{ height: '200px' }}>
          {!imgError && item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center text-6xl">
              🍽️
            </div>
          )}
          {/* Bouton fermer — le seul élément en haut */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.45)' }}
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h2>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={12} className="text-gray-400" />
            <span className="text-xs text-gray-400">{item.preparationTime} min de préparation</span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed mb-5">{item.description}</p>

          {groups.map((group, gi) => (
            <div key={gi} className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-semibold text-gray-900">{group.name}</p>
                {group.required && <span className="text-2xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">Obligatoire</span>}
                {group.multiple && <span className="text-2xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Plusieurs choix</span>}
              </div>
              <div className="space-y-2">
                {group.choices.map((choice, ci) => {
                  const isSelected = (selected[gi] || []).includes(ci)
                  return (
                    <button key={ci} onClick={() => toggleChoice(gi, ci, group.multiple)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${
                        isSelected ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                      }`}>
                      <span className="text-sm text-gray-900">{choice.label}</span>
                      <div className="flex items-center gap-3">
                        {choice.extraPrice > 0 && <span className="text-xs text-gray-500">+{formatFCFA(choice.extraPrice)}</span>}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 pt-3 pb-8 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">Quantité</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center active:scale-90 transition-all">
                <Minus size={14} className="text-gray-600" />
              </button>
              <span className="text-base font-bold text-gray-900 w-6 text-center">{qty}</span>
              <button onClick={() => setQty(q => q + 1)}
                className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center active:scale-90 transition-all">
                <Plus size={14} className="text-white" />
              </button>
            </div>
          </div>
          {!canAdd && <p className="text-xs text-red-500 text-center mb-3">Veuillez compléter les choix obligatoires</p>}
          <button onClick={handleAdd} disabled={!canAdd}
            className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-between px-5 active:scale-[0.98] transition-all disabled:opacity-50"
            style={{ background: canAdd ? '#111827' : '#9ca3af' }}>
            <span>Ajouter au panier</span>
            <span>{formatFCFA(total)}</span>
          </button>
        </div>
      </div>
    </>
  )
}

// ── Carte plat ───────────────────────────────────────────────────
function DishCard({ item, qty, onOpen, onAddDirect, onRemoveDirect }) {
  const [imgError,  setImgError]  = useState(false)
  const hasOptions = (item.optionGroups || []).length > 0

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <div onClick={() => onOpen(item)} className="relative overflow-hidden cursor-pointer" style={{ height: '130px' }}>
        {!imgError && item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
            onError={() => setImgError(true)} loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center text-4xl">🍽️</div>
        )}
        {qty > 0 && (
          <div className="absolute top-2 left-2 bg-gray-900 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">{qty}</div>
        )}
      </div>
      <div className="p-3">
        <p onClick={() => onOpen(item)} className="text-sm font-semibold text-gray-900 leading-tight mb-1 line-clamp-1 cursor-pointer">{item.name}</p>
        <p onClick={() => onOpen(item)} className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-2 cursor-pointer" style={{ minHeight: '32px' }}>{item.description}</p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-900">{formatFCFA(item.price)}</p>
          {!hasOptions && qty > 0 ? (
            <div className="flex items-center gap-1.5">
              <button onClick={() => onRemoveDirect(item)}
                className="w-7 h-7 rounded-full border-2 border-gray-200 flex items-center justify-center active:scale-90 transition-all">
                <Minus size={11} className="text-gray-600" />
              </button>
              <span className="text-xs font-bold text-gray-900 w-4 text-center">{qty}</span>
              <button onClick={() => onAddDirect(item)}
                className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center active:scale-90 transition-all">
                <Plus size={11} className="text-white" />
              </button>
            </div>
          ) : (
            <button onClick={() => hasOptions ? onOpen(item) : onAddDirect(item)}
              className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center active:scale-90 transition-all flex-shrink-0">
              <Plus size={14} className="text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Vue panier ───────────────────────────────────────────────────
function CartView({ cart, restaurant, onBack, onAdd, onRemove, slug, sid }) {
  const items    = Object.values(cart).filter(i => i.qty > 0)
  const subtotal = items.reduce((s, i) => s + (i.unitPrice || i.price) * i.qty, 0)
  const [ordering,     setOrdering]     = useState(false)
  const [orderError,   setOrderError]   = useState('')
  const [orderSuccess, setOrderSuccess] = useState(false)
  // Restaurant fermé : pas de commande. Connu à l'ouverture du catalogue, ou appris du serveur si l'heure de fermeture est passée entre-temps.
  const [closed, setClosed] = useState(restaurant.isOpen === false ? { reopens: restaurant.reopens || '' } : null)

  // Le panier s'ouvre en haut (titre et retour visibles), même si on avait fait défiler le menu
  useEffect(() => { window.scrollTo(0, 0) }, [])

  const handleOrder = async () => {
    setOrdering(true)
    setOrderError('')
    try {
      const res  = await fetch(`${API_URL}/api/public/order/create`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ slug, sid: sid || null, items: items.map(i => ({ menuItemId: i.id, quantity: i.qty, options: i.options || [] })) }),
      })
      const data = await res.json()
      if (data.closed) { setClosed({ reopens: data.reopens || '' }); return }
      if (!data.success) { setOrderError(data.message || 'Erreur.'); return }
      if (data.sent) { setOrderSuccess(true) }
      else { window.location.href = 'https://wa.me/' + (restaurant.phone?.replace(/\D/g, '') || '') + '?text=' + encodeURIComponent(data.token) }
    } catch (_) { setOrderError('Erreur réseau. Veuillez réessayer.') }
    finally { setOrdering(false) }
  }

  if (orderSuccess) return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center bg-white">
      <style>{`
        @keyframes scaleIn  { 0%{transform:scale(0)}60%{transform:scale(1.2)}100%{transform:scale(1)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
        @keyframes drawRing { from{stroke-dashoffset:220}to{stroke-dashoffset:0} }
        @keyframes drawCheck{ from{stroke-dashoffset:80}to{stroke-dashoffset:0} }
      `}</style>
      <div style={{ animation: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' }} className="mb-6">
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r="35" fill="none" stroke="#dcfce7" strokeWidth="10" />
          <circle cx="45" cy="45" r="35" fill="none" stroke="#16a34a" strokeWidth="4" strokeDasharray="220" strokeDashoffset="220" strokeLinecap="round" style={{ animation: 'drawRing 0.6s ease 0.2s forwards' }} />
          <polyline points="28,45 40,57 62,33" fill="none" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="80" strokeDashoffset="80" style={{ animation: 'drawCheck 0.4s ease 0.7s forwards' }} />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ animation: 'fadeUp 0.5s ease 0.3s both' }}>Commande envoyée !</h2>
      <p className="text-sm text-gray-500 leading-relaxed mb-6" style={{ animation: 'fadeUp 0.5s ease 0.5s both' }}>
        Vérifiez WhatsApp — le bot vous a envoyé votre commande automatiquement.
      </p>
      <p className="text-xs text-gray-400" style={{ animation: 'fadeUp 0.5s ease 0.7s both' }}>
        Pour une nouvelle commande, tapez <strong className="text-gray-600">menu</strong> sur WhatsApp.
      </p>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-50" style={{ minHeight: '100dvh' }}>
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft size={20} className="text-gray-700" />
        </button>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Mon panier</h2>
          <p className="text-xs text-gray-400">{items.length} article{items.length > 1 ? 's' : ''}</p>
        </div>
      </div>
      <div className="flex-1 px-4 py-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">🛒</div>
            <p className="text-sm font-medium text-gray-700">Panier vide</p>
            <button onClick={onBack} className="mt-4 text-sm font-medium text-gray-900 border border-gray-200 px-4 py-2 rounded-xl">Voir le menu</button>
          </div>
        ) : items.map(item => (
          <div key={item.cartKey || item.id} className="bg-white rounded-2xl p-4 flex items-start gap-3 border border-gray-100">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{item.name}</p>
              {item.options?.length > 0 && <p className="text-xs text-gray-400 mt-0.5">{item.options.map(o => o.choices.join(', ')).join(' · ')}</p>}
              <p className="text-xs text-gray-400 mt-0.5">{formatFCFA(item.unitPrice || item.price)} / unité</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{formatFCFA((item.unitPrice || item.price) * item.qty)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => onRemove(item)} className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center active:scale-90 transition-all">
                {item.qty === 1 ? <Trash2 size={13} className="text-red-400" /> : <Minus size={13} className="text-gray-600" />}
              </button>
              <span className="text-sm font-bold text-gray-900 w-5 text-center">{item.qty}</span>
              <button onClick={() => onAdd(item, 1, item.unitPrice, item.options || [])} className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center active:scale-90 transition-all">
                <Plus size={13} className="text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <div className="bg-white border-t border-gray-100 px-4 pt-4 flex-shrink-0 sticky bottom-0" style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Sous-total</span><span className="font-medium text-gray-900">{formatFCFA(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500 flex items-center gap-1"><MapPin size={12} /> Livraison</span><span className="text-gray-400">Calculée à la commande</span></div>
            <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-100 pt-3 mt-2"><span>Total estimé</span><span>{formatFCFA(subtotal)}</span></div>
          </div>
          {orderError && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-3"><p className="text-xs text-red-600 text-center">{orderError}</p></div>}
          {closed ? (
            <button disabled className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center bg-gray-500">
              Fermé{closed.reopens ? ` · ${closed.reopens}` : ''}
            </button>
          ) : (<>
          <button onClick={handleOrder} disabled={ordering}
            className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-70"
            style={{ background: '#075E54' }}>
            {ordering ? <><Loader2 size={20} className="animate-spin" /> Préparation…</> : <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              Commander via WhatsApp <ArrowRight size={18} />
            </>}
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            {sid ? 'Commande envoyée automatiquement sur WhatsApp' : 'Vous serez redirigé vers WhatsApp'}
          </p>
          </>)}
        </div>
      )}
    </div>
  )
}

// ── Page principale ──────────────────────────────────────────────
export default function MenuPage() {
  const { slug }     = useParams()
  const searchParams = useSearchParams()
  const sid          = searchParams.get('sid')

  const [restaurant, setRestaurant] = useState(null)
  const [menuItems,  setMenuItems]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [cart,       setCart]       = useState({})
  const [search,     setSearch]     = useState('')
  const [activeCat,  setActiveCat]  = useState('Tous')
  const [showCart,   setShowCart]   = useState(false)
  const menuScroll = useRef(0)   // où en était le menu à l'ouverture du panier, pour y revenir au retour
  const [detail,     setDetail]     = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/menu/${slug}`)
        if (!res.ok) throw new Error('Restaurant introuvable')
        const data = await res.json()
        setRestaurant(data.restaurant)
        setMenuItems(data.items)
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }
    load()
  }, [slug])

  useEffect(() => {
    const saved = sessionStorage.getItem('skanema_cart_' + slug)
    if (saved) { try { setCart(JSON.parse(saved)) } catch (_) {} }
  }, [slug])

  useEffect(() => {
    sessionStorage.setItem('skanema_cart_' + slug, JSON.stringify(cart))
  }, [cart, slug])

  const addToCart = useCallback((item, qty = 1, unitPrice = null, options = []) => {
    const price   = unitPrice !== null ? unitPrice : item.price
    const baseKey = item._id || item.id
    const optKey  = options.length > 0 ? options.map(o => o.choices.join(',')).join('|').replace(/[^a-zA-Z0-9]/g, '') : ''
    const key     = optKey ? baseKey + '_' + optKey : baseKey
    setCart(prev => ({
      ...prev,
      [key]: { id: baseKey, cartKey: key, name: item.name, price: item.price, unitPrice: price, imageUrl: item.imageUrl, options, qty: (prev[key]?.qty || 0) + qty }
    }))
  }, [])

  const removeFromCart = useCallback((item) => {
    const key = item.cartKey || item._id || item.id
    setCart(prev => {
      const cur = prev[key]?.qty || 0
      if (cur <= 1) { const n = { ...prev }; delete n[key]; return n }
      return { ...prev, [key]: { ...prev[key], qty: cur - 1 } }
    })
  }, [])

  const cartCount = Object.values(cart).reduce((s, i) => s + i.qty, 0)
  const cartTotal = Object.values(cart).reduce((s, i) => s + (i.unitPrice || i.price) * i.qty, 0)
  const categories = ['Tous', ...menuItems.reduce((acc, i) => {
    if (i.category && !acc.includes(i.category)) acc.push(i.category)
    return acc
  }, [])]
  const filtered   = menuItems.filter(item =>
    (activeCat === 'Tous' || item.category === activeCat) &&
    (!search || item.name.toLowerCase().includes(search.toLowerCase())) &&
    item.available
  )

  if (loading) return (
    <div className="min-h-screen bg-white" style={{ maxWidth: '480px', margin: '0 auto' }}>
      <Skeleton style={{ height: '240px', borderRadius: 0 }} />
      <div className="p-4 grid grid-cols-2 gap-3 mt-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
            <Skeleton style={{ height: '130px', borderRadius: 0 }} />
            <div className="p-3 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-full" /></div>
          </div>
        ))}
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl mb-4">😔</div>
      <h1 className="text-lg font-semibold text-gray-900 mb-2">Restaurant introuvable</h1>
      <p className="text-sm text-gray-400">{error}</p>
    </div>
  )

  if (showCart) return (
    <CartView cart={cart} restaurant={restaurant} onBack={() => { setShowCart(false); requestAnimationFrame(() => window.scrollTo(0, menuScroll.current)) }}
      onAdd={addToCart} onRemove={removeFromCart} slug={slug} sid={sid} />
  )

  return (
    // Layout simple — scroll naturel de la page, pas de flex h-screen
    <div className="bg-white" style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh' }}>

      {/* Header */}
      <RestaurantHeader restaurant={restaurant} items={menuItems} />

      {/* Badges */}
      <InfoBadges avgPrepTime={restaurant?.avgPrepTime || 30} />

      {/* Recherche + catégories — sticky */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un plat…"
              className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-700 outline-none"
              style={{ fontSize: '16px' }} />
          </div>
        </div>
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              className={`whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-full transition-all flex-shrink-0 ${
                activeCat === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grille plats */}
      <div className="px-4 py-4 pb-32">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm font-medium text-gray-700">Aucun plat trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(item => (
              <DishCard key={item._id} item={item}
                qty={Object.values(cart).filter(c => c.id === item._id).reduce((s, c) => s + c.qty, 0)}
                onOpen={setDetail}
                onAddDirect={(item) => addToCart(item, 1, null, [])}
                onRemoveDirect={(item) => removeFromCart({ ...item, cartKey: item._id || item.id })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Barre panier — fixed en bas, même largeur que la page */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 z-20 px-4 pb-6 pt-3 bg-white border-t border-gray-100"
             style={{ maxWidth: '480px', width: '100%', left: '50%', transform: 'translateX(-50%)' }}>
          <button onClick={() => { menuScroll.current = window.scrollY; setShowCart(true) }}
            className="w-full text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-between px-5 active:scale-[0.98] transition-all"
            style={{ background: '#111827' }}>
            <div className="bg-white/20 rounded-lg px-2 py-1 text-xs font-bold">{cartCount}</div>
            <span>Voir mon panier</span>
            <span>{formatFCFA(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Popup détail */}
      {detail && (
        <ItemDetail item={detail} onClose={() => setDetail(null)}
          onAdd={(item, qty, unitPrice, options) => { addToCart(item, qty, unitPrice, options); setDetail(null) }} />
      )}
    </div>
  )
}
