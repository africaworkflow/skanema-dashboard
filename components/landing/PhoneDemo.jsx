'use client'
import { useEffect, useRef, useState } from 'react'
import s from './Landing.module.css'
import { PhoneCatalog } from './PhoneCatalog'

// Démo interactive : reproduit le parcours réel du bot Skanema sur WhatsApp.
// 1. Le client démarre la discussion
// 2. Le bot envoie le bouton « Voir le catalogue »
// 3. Le client ouvre le catalogue et compose son panier
// 4. Le bot récupère le panier et demande la localisation
// 5. Le client partage sa position
// 6. Le bot envoie le total et le choix du paiement (Wave / Orange Money)
// 7. Le client choisit, le bot valide la commande

const PRODUCTS = [
  { id: 'a', name: 'Thieb poulet',  price: 3500, cat: 'Plats',    emoji: '🍗', desc: 'Riz au poulet braisé et légumes' },
  { id: 'b', name: 'Yassa poisson', price: 3000, cat: 'Plats',    emoji: '🐟', desc: 'Oignons confits, citron, riz blanc' },
  { id: 'c', name: 'Burger maison', price: 2500, cat: 'Plats',    emoji: '🍔', desc: 'Bœuf, cheddar, frites maison' },
  { id: 'd', name: 'Jus de bissap', price: 800,  cat: 'Boissons', emoji: '🥤', desc: 'Fait maison, bien frais, 50 cl' },
]
const DELIVERY_FEE = 1000
// Code panier fixe (en réel : 'ORDER_' + 8 caractères générés par le backend)
const DEMO_TOKEN   = 'ORDER_7F3A9C2E'
const BOT_DELAY    = 900
const EMPTY_QTY    = { a: 0, b: 0, c: 0, d: 0 }

// Format fixe (identique serveur / navigateur) : 3 500 F
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'

// ── Styles (valeurs de la maquette) ────────────────────────────────
const bubbleBot  = { background: '#fff', borderRadius: 12, padding: '10px 12px', fontSize: 14, alignSelf: 'flex-start', maxWidth: '88%', boxSizing: 'border-box', lineHeight: 1.4 }
const bubbleUser = { background: '#DCF8C6', borderRadius: 12, padding: '10px 12px', fontSize: 14, alignSelf: 'flex-end', maxWidth: '88%', boxSizing: 'border-box', lineHeight: 1.4 }
const ctaBase    = { width: '100%', minHeight: 48, border: 0, borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: 'pointer' }
const ctaOn      = { ...ctaBase, background: '#DC2626', color: '#fff' }
const ctaOff     = { ...ctaBase, background: '#D1D5DB', color: '#4B5563', cursor: 'default' }
const ctaDark    = { ...ctaBase, background: '#111827', color: '#fff' }
const waBtn      = (active) => ({
  width: '100%', minHeight: 40, border: 0, borderTop: '1px solid #E5E7EB', background: 'transparent',
  color: active ? '#DC2626' : '#9CA3AF', fontWeight: 700, fontSize: 14,
  cursor: active ? 'pointer' : 'default', marginTop: 10, paddingTop: 8,
})
const payBtn = (bg) => ({ minHeight: 52, borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: 'pointer', color: '#111827', background: bg, border: '4px solid transparent', width: '100%' })

function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontWeight: bold ? 700 : 400 }}>
      <span>{label}</span><span style={{ whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: 'none' }}>
      <path fill="#DC2626" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
    </svg>
  )
}

export function PhoneDemo() {
  // stage : start → catalog → location → payment → done
  const [stage,       setStage]       = useState('start')
  const [messages,    setMessages]    = useState([])
  const [typing,      setTyping]      = useState(false)
  const [view,        setView]        = useState(null) // null | 'catalog' | 'cart'
  const [qty,         setQty]         = useState(EMPTY_QTY)
  const [order,       setOrder]       = useState(null)

  const chatRef  = useRef(null)
  const timerRef = useRef(null)
  const idRef    = useRef(0)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  // Défile uniquement la zone de discussion (pas la page)
  useEffect(() => {
    const el = chatRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, typing])

  const push = (msg) => setMessages((list) => [...list, { ...msg, id: ++idRef.current }])

  // Le bot répond avec un ou plusieurs messages successifs
  const botReply = (msgs, nextStage) => {
    const queue = Array.isArray(msgs) ? msgs : [msgs]
    clearTimeout(timerRef.current)
    const next = (i) => {
      setTyping(true)
      timerRef.current = setTimeout(() => {
        push({ from: 'bot', ...queue[i] })
        if (i + 1 < queue.length) next(i + 1)
        else { setTyping(false); setStage(nextStage) }
      }, i === 0 ? BOT_DELAY : 700)
    }
    next(0)
  }

  const items = PRODUCTS.map((p) => ({ ...p, qty: qty[p.id] }))
  const cart  = items.filter((i) => i.qty > 0)
  const count = cart.reduce((n, i) => n + i.qty, 0)
  const sub   = cart.reduce((n, i) => n + i.qty * i.price, 0)

  const setItem = (id, d) => setQty((q) => ({ ...q, [id]: Math.max(0, q[id] + d) }))

  // ── Actions ──────────────────────────────────────────────────────
  const start = () => {
    if (stage !== 'start' || typing) return
    push({ from: 'user', kind: 'text', text: 'Bonjour' })
    botReply({ kind: 'welcome' }, 'catalog')
  }

  const openCatalog = () => {
    if (stage !== 'catalog' || typing) return
    setView('catalog')
  }

  const sendCart = () => {
    if (!count) return
    const snapshot = { lines: cart.map((i) => ({ name: i.name, qty: i.qty, total: i.qty * i.price })), sub }
    setOrder(snapshot)
    setView(null)
    // Comme en réel : le catalogue envoie le code du panier, le bot le récupère
    push({ from: 'user', kind: 'text', text: DEMO_TOKEN })
    botReply([{ kind: 'cartReceived' }, { kind: 'askLocation' }], 'location')
  }

  const shareLocation = () => {
    if (stage !== 'location' || typing) return
    push({ from: 'user', kind: 'location' })
    botReply({ kind: 'total' }, 'payment')
  }

  const pay = (name) => {
    if (stage !== 'payment' || typing) return
    push({ from: 'user', kind: 'text', text: name })
    botReply({ kind: 'validated', pay: name }, 'done')
  }

  const reset = () => {
    clearTimeout(timerRef.current)
    setTyping(false)
    setMessages([])
    setQty(EMPTY_QTY)
    setOrder(null)
    setView(null)
    setStage('start')
  }

  // ── Rendu des messages ───────────────────────────────────────────
  const renderMessage = (m) => {
    if (m.from === 'user') {
      if (m.kind === 'location') return (
        <div key={m.id} className={s.msg} style={{ ...bubbleUser, padding: 6, width: 190 }}>
          <div style={{ height: 80, borderRadius: 8, background: 'repeating-linear-gradient(45deg,#E5E7EB 0 10px,#F3F4F6 10px 20px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path fill="#DC2626" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" /></svg>
          </div>
          <div style={{ padding: '6px 6px 2px', fontWeight: 600 }}>Position partagée</div>
        </div>
      )
      return <div key={m.id} className={s.msg} style={bubbleUser}>{m.text}</div>
    }

    // Messages du bot
    if (m.kind === 'welcome') return (
      <div key={m.id} className={s.msg} style={bubbleBot}>
        Bienvenue chez <b>Mama Fatou</b> ! Découvrez notre catalogue et composez votre commande.
        <button onClick={openCatalog} style={waBtn(stage === 'catalog' && !typing)} disabled={stage !== 'catalog'}>Voir le catalogue</button>
      </div>
    )
    if (m.kind === 'cartReceived') return (
      <div key={m.id} className={s.msg} style={{ ...bubbleBot, width: '88%' }}>
        <b>✅ Commande reçue !</b>
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {order.lines.map((l) => <Row key={l.name} label={`• ${l.name} ×${l.qty}`} value={fmt(l.total)} />)}
        </div>
        <div style={{ borderTop: '1px solid #E5E7EB', marginTop: 6, paddingTop: 6 }}>
          <Row label="💰 Sous-total" value={fmt(order.sub)} bold />
        </div>
      </div>
    )
    if (m.kind === 'askLocation') return (
      <div key={m.id} className={s.msg} style={bubbleBot}>
        Partagez votre position pour la livraison.
        <button onClick={shareLocation} style={{ ...waBtn(stage === 'location' && !typing), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} disabled={stage !== 'location'}>
          <PinIcon /> Envoyer ma position
        </button>
      </div>
    )
    if (m.kind === 'total') return (
      <div key={m.id} className={s.msg} style={{ ...bubbleBot, width: '88%' }}>
        <b>Récapitulatif</b>
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Row label="Sous-total" value={fmt(order.sub)} />
          <Row label="Livraison"  value={fmt(DELIVERY_FEE)} />
        </div>
        <div style={{ borderTop: '1px solid #E5E7EB', marginTop: 6, paddingTop: 6, fontSize: 15 }}>
          <Row label="Total" value={fmt(order.sub + DELIVERY_FEE)} bold />
        </div>
        <div style={{ marginTop: 10, fontWeight: 700 }}>Comment souhaitez-vous payer ?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, opacity: stage === 'payment' ? 1 : .55 }}>
          <button onClick={() => pay('Wave')}         style={payBtn('#1DA1F2')} disabled={stage !== 'payment'}>Wave</button>
          <button onClick={() => pay('Orange Money')} style={payBtn('#FF7900')} disabled={stage !== 'payment'}>Orange Money</button>
        </div>
      </div>
    )
    if (m.kind === 'validated') return (
      <div key={m.id} className={s.msg} style={{ ...bubbleBot, width: '88%' }}>
        <b style={{ color: '#16A34A' }}>Commande validée !</b>
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Row label="Commande" value="#SK-1042" />
          <Row label="Paiement" value={m.pay} />
          <Row label="Total"    value={fmt(order.sub + DELIVERY_FEE)} bold />
        </div>
        <div style={{ marginTop: 8 }}>Merci ! Le restaurant prépare votre commande, vous recevrez chaque mise à jour ici.</div>
      </div>
    )
    return null
  }

  // ── Barre d'action du bas ────────────────────────────────────────
  let cta
  if (typing)               cta = <button style={ctaOff} disabled>…</button>
  else if (stage === 'start')    cta = <button onClick={start} style={ctaOn}>Démarrer la discussion</button>
  else if (stage === 'catalog')  cta = <button onClick={openCatalog} style={ctaOn}>Voir le catalogue</button>
  else if (stage === 'location') cta = <button onClick={shareLocation} style={ctaOn}>Envoyer ma position</button>
  else if (stage === 'payment')  cta = <button style={ctaOff} disabled>Choisissez votre paiement</button>
  else                           cta = <button onClick={reset} style={ctaDark}>Recommencer</button>

  return (
    <div style={{ width: 310, height: 620, background: '#000', borderRadius: 44, padding: 10, boxSizing: 'border-box', boxShadow: '0 0 0 3px #DC2626,0 40px 80px rgba(0,0,0,.5)', flex: 'none' }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', background: '#ECE5DD', borderRadius: 34, overflow: 'hidden', display: 'flex', flexDirection: 'column', color: '#111827' }}>

        {/* En-tête WhatsApp */}
        <div style={{ background: '#DC2626', color: '#fff', padding: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="20" height="26" viewBox="0 0 52 82" aria-hidden="true"><g fill="#fff" stroke="#fff" strokeWidth="5" strokeLinejoin="round"><polygon points="4,18 22,7 22,52 4,63" /><polygon points="31,36 49,25 49,69 31,80" /></g></svg>
          <div><div style={{ fontWeight: 700, fontSize: 15 }}>Chez Mama Fatou</div><div style={{ fontSize: 12 }}>compte professionnel</div></div>
        </div>

        {/* Discussion */}
        <div ref={chatRef} className={s.noBar} style={{ flex: 1, padding: 14, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.length === 0 && !typing && (
            <div style={{ alignSelf: 'center', background: '#FFF7D6', color: '#4B5563', borderRadius: 10, padding: '8px 12px', fontSize: 12, textAlign: 'center', lineHeight: 1.4 }}>
              Le client scanne le QR code ou clique sur votre lien : la discussion WhatsApp s&apos;ouvre.
            </div>
          )}
          {messages.map(renderMessage)}
          {typing && (
            <div className={s.msg} style={{ ...bubbleBot, display: 'flex', gap: 4, padding: '12px 14px' }} aria-label="Le bot écrit">
              <span className={s.dot} /><span className={s.dot} /><span className={s.dot} />
            </div>
          )}
        </div>

        {/* Catalogue Skanema (même rendu que la page menu/[slug], en miniature) */}
        {view && (
          <PhoneCatalog
            view={view}
            items={items}
            count={count}
            sub={sub}
            onAdd={(id) => setItem(id, 1)}
            onRemove={(id) => setItem(id, -1)}
            onShowCart={() => setView('cart')}
            onBack={() => setView(view === 'cart' ? 'catalog' : null)}
            onOrder={sendCart}
          />
        )}

        {/* Barre d'action */}
        <div style={{ padding: 12, background: '#F5F5F4' }}>{cta}</div>
      </div>
    </div>
  )
}
