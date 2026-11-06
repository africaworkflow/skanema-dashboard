'use client'
import { useState } from 'react'
import s from './Landing.module.css'
import { Plus, Minus, ChevronLeft, Trash2, MapPin, Clock, Bike, ArrowRight } from 'lucide-react'

// Miniature fidèle du catalogue Skanema (app/menu/[slug]/page.jsx)
// affichée dans le téléphone de la démo de la landing.

const fcfa = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'

const screen   = { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#fff', fontFamily: 'Inter, system-ui, sans-serif', zIndex: 2 }
const roundDark = (size) => ({ width: size, height: size, borderRadius: '50%', background: '#111827', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none', padding: 0 })
const roundLine = (size) => ({ width: size, height: size, borderRadius: '50%', background: '#fff', border: '2px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none', padding: 0 })
const thumb     = { background: 'linear-gradient(135deg,#FFF7ED,#FEF3C7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const clamp     = (lines) => ({ display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden' })

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
  )
}

// ── Vue catalogue ────────────────────────────────────────────────
function CatalogView({ items, count, sub, onAdd, onRemove, onShowCart, onBack }) {
  const [cat, setCat] = useState('Tous')
  const cats  = ['Tous', ...items.reduce((a, i) => (a.includes(i.cat) ? a : [...a, i.cat]), [])]
  const shown = items.filter((i) => cat === 'Tous' || i.cat === cat)

  return (
    <div style={screen}>
      <div className={s.noBar} style={{ flex: 1, overflowY: 'auto' }}>
        {/* Bandeau restaurant */}
        <div style={{ position: 'relative', height: 132, flex: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#7b2d00,#a63c00)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,.1) 0%,rgba(0,0,0,.75) 100%)' }} />
          <button onClick={onBack} aria-label="Retour à la discussion" style={{ position: 'absolute', top: 12, left: 12, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.45)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
            <ChevronLeft size={16} color="#fff" />
          </button>
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 999, background: 'rgba(0,0,0,.55)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
            <span style={{ fontSize: 10, color: '#fff', fontWeight: 500 }}>Ouvert · jusqu&apos;à 23h</span>
          </div>
          <div style={{ position: 'absolute', left: 14, right: 14, bottom: 24 }}>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: 18, letterSpacing: '-.3px', lineHeight: 1.2 }}>Chez Mama Fatou</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#FBBF24', marginTop: 2 }}>Cuisine sénégalaise</div>
          </div>
          <svg viewBox="0 0 390 28" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 16, display: 'block' }} aria-hidden="true">
            <path d="M0,14 C65,28 130,0 195,14 C260,28 325,0 390,14 L390,28 L0,28 Z" fill="#fff" />
          </svg>
        </div>

        {/* Badges info */}
        <div style={{ display: 'flex', gap: 8, padding: '6px 12px 10px', borderBottom: '1px solid #F3F4F6' }}>
          {[[Clock, '30–45 min', 'Livraison'], [Bike, 'Livraison', 'disponible']].map(([Icon, a, b]) => (
            <div key={a + b} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F9FAFB', borderRadius: 10, padding: '5px 9px' }}>
              <Icon size={11} color="#6B7280" />
              <div><div style={{ fontSize: 10, fontWeight: 600, color: '#111827', lineHeight: 1.1 }}>{a}</div><div style={{ fontSize: 9, color: '#9CA3AF' }}>{b}</div></div>
            </div>
          ))}
        </div>

        {/* Catégories */}
        <div style={{ display: 'flex', gap: 6, padding: '10px 12px', borderBottom: '1px solid #F3F4F6' }}>
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} style={{ border: 0, borderRadius: 999, padding: '5px 11px', fontSize: 11, fontWeight: 500, cursor: 'pointer', background: cat === c ? '#111827' : '#F3F4F6', color: cat === c ? '#fff' : '#6B7280' }}>{c}</button>
          ))}
        </div>

        {/* Grille plats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 12 }}>
          {shown.map((it) => (
            <div key={it.id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #F3F4F6' }}>
              <div style={{ ...thumb, position: 'relative', height: 70, fontSize: 30 }}>
                {it.emoji}
                {it.qty > 0 && <span style={{ position: 'absolute', top: 6, left: 6, width: 18, height: 18, borderRadius: '50%', background: '#111827', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{it.qty}</span>}
              </div>
              <div style={{ padding: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', lineHeight: 1.2, ...clamp(1) }}>{it.name}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', lineHeight: 1.35, marginTop: 3, minHeight: 27, ...clamp(2) }}>{it.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>{fcfa(it.price)}</span>
                  {it.qty > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={() => onRemove(it.id)} aria-label={`Retirer ${it.name}`} style={roundLine(22)}><Minus size={10} color="#4B5563" /></button>
                      <button onClick={() => onAdd(it.id)} aria-label={`Ajouter ${it.name}`} style={roundDark(22)}><Plus size={10} color="#fff" /></button>
                    </div>
                  ) : (
                    <button onClick={() => onAdd(it.id)} aria-label={`Ajouter ${it.name}`} style={roundDark(24)}><Plus size={12} color="#fff" /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Barre panier */}
      {count > 0 && (
        <div style={{ padding: '8px 12px 12px', borderTop: '1px solid #F3F4F6', background: '#fff' }}>
          <button onClick={onShowCart} style={{ width: '100%', minHeight: 46, border: 0, borderRadius: 14, background: '#111827', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', cursor: 'pointer' }}>
            <span style={{ background: 'rgba(255,255,255,.2)', borderRadius: 7, padding: '3px 7px', fontSize: 11 }}>{count}</span>
            <span>Voir mon panier</span>
            <span>{fcfa(sub)}</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ── Vue panier ───────────────────────────────────────────────────
function CartView({ items, count, sub, onAdd, onRemove, onBack, onOrder }) {
  const lines = items.filter((i) => i.qty > 0)
  return (
    <div style={{ ...screen, background: '#F9FAFB' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #F3F4F6', padding: '14px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onBack} aria-label="Retour au catalogue" style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}><ChevronLeft size={18} color="#374151" /></button>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Mon panier</div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{lines.length} article{lines.length > 1 ? 's' : ''}</div>
        </div>
      </div>

      <div className={s.noBar} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {lines.map((it) => (
          <div key={it.id} style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 14, padding: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ ...thumb, width: 38, height: 38, borderRadius: 10, fontSize: 18, flex: 'none' }}>{it.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', ...clamp(1) }}>{it.name}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#111827', marginTop: 2 }}>{fcfa(it.price * it.qty)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => onRemove(it.id)} aria-label={`Retirer ${it.name}`} style={roundLine(24)}>
                {it.qty === 1 ? <Trash2 size={11} color="#F87171" /> : <Minus size={11} color="#4B5563" />}
              </button>
              <span style={{ fontSize: 12, fontWeight: 700, minWidth: 12, textAlign: 'center' }}>{it.qty}</span>
              <button onClick={() => onAdd(it.id)} aria-label={`Ajouter ${it.name}`} style={roundDark(24)}><Plus size={11} color="#fff" /></button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderTop: '1px solid #F3F4F6', padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280' }}><span>Sous-total</span><span style={{ color: '#111827', fontWeight: 500 }}>{fcfa(sub)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280', marginTop: 5 }}><span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} /> Livraison</span><span style={{ color: '#9CA3AF' }}>Calculée à la commande</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: '#111827', borderTop: '1px solid #F3F4F6', marginTop: 8, paddingTop: 8 }}><span>Total estimé</span><span>{fcfa(sub)}</span></div>
        <button onClick={onOrder} disabled={!count} style={{ width: '100%', minHeight: 46, marginTop: 10, border: 0, borderRadius: 14, background: '#075E54', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: count ? 'pointer' : 'default', opacity: count ? 1 : .6 }}>
          <WhatsAppIcon /> Commander via WhatsApp <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}

export function PhoneCatalog({ view, items, count, sub, onAdd, onRemove, onShowCart, onBack, onOrder }) {
  if (view === 'cart') return <CartView items={items} count={count} sub={sub} onAdd={onAdd} onRemove={onRemove} onBack={onBack} onOrder={onOrder} />
  return <CatalogView items={items} count={count} sub={sub} onAdd={onAdd} onRemove={onRemove} onShowCart={onShowCart} onBack={onBack} />
}
