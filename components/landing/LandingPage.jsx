import s from './Landing.module.css'
import { PhoneDemo } from './PhoneDemo'

const SIGNUP_URL = 'https://dashboard.skanema.com/onboarding'
const LOGIN_URL  = 'https://dashboard.skanema.com/login'

const LEGAL_LINKS = [
  { label: 'Mentions légales',              href: '/mentions-legales' },
  { label: 'Politique de confidentialité',  href: '/politique-de-confidentialite' },
  { label: "Conditions d'utilisation",      href: '/cgu' },
  { label: 'Conditions générales de vente', href: '/cgv' },
]

function Logo({ width, height, color, dot }) {
  return (
    <svg width={width} height={height} viewBox="0 0 52 82" aria-hidden="true">
      <g fill={color} stroke={color} strokeWidth="5" strokeLinejoin="round">
        <polygon points="4,18 22,7 22,52 4,63" />
        <polygon points="31,36 49,25 49,69 31,80" />
      </g>
      <circle cx="39" cy="67" r="4" fill={dot} />
    </svg>
  )
}

const card = { background: '#fff', borderRadius: 20, padding: 28 }
const stepNum = { fontSize: 64, color: '#DC2626' }
const stepTitle = { fontSize: 22, margin: '12px 0 8px' }
const stepText = { margin: 0, lineHeight: 1.5, color: '#374151' }
const grid4 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20, marginTop: 44 }

export function LandingPage() {
  return (
    <div className={s.root}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{ background: '#DC2626', color: '#fff' }}>
        <div className={s.wrap} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, height: 'auto', minHeight: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Logo width={30} height={40} color="#fff" dot="#DC2626" />
            <span className={s.h} style={{ fontSize: 26 }}>Skanema</span>
          </div>
          <nav style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap', fontWeight: 600, fontSize: 15 }}>
            <a className={s.nl} href="#flux" style={{ textDecoration: 'none' }}>Le parcours</a>
            <a className={s.nl} href="#demo" style={{ textDecoration: 'none' }}>Démo</a>
            <a className={s.nl} href="#metiers" style={{ textDecoration: 'none' }}>Métiers</a>
            <a className={s.nl} href={LOGIN_URL} style={{ textDecoration: 'none' }}>Se connecter</a>
            <a href={SIGNUP_URL} className={s.btn} style={{ background: '#fff', color: '#DC2626', padding: '0 22px', minHeight: 48 }}>
              Essayer<span className={s.nl} style={{ marginLeft: '.4em' }}>gratuitement</span>
            </a>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section style={{ background: '#DC2626', color: '#fff', padding: '40px 0 150px', clipPath: 'polygon(0 0,100% 0,100% calc(100% - 90px),0 100%)' }}>
        <div className={s.wrap} style={{ display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'center' }}>
          <div style={{ flex: '1 1 520px' }}>
            <p style={{ fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', margin: '0 0 20px' }}>Sur WhatsApp · Wave · Orange Money</p>
            <h1 className={s.h} style={{ fontSize: 'clamp(38px,8vw,104px)' }}>Commande.<br />Paie.<br />Reçois.</h1>
            <p style={{ fontSize: 20, lineHeight: 1.5, maxWidth: 560, margin: '28px 0 36px' }}>
              Vos clients découvrent, commandent, paient par Wave ou Orange Money et se font livrer, sans jamais quitter WhatsApp.
            </p>
            <div className={s.hb} style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href={SIGNUP_URL} className={s.btn} style={{ background: '#111827', color: '#fff' }}>Essayer gratuitement</a>
              <a href="#demo" className={s.btn} style={{ background: 'transparent', color: '#fff', boxShadow: 'inset 0 0 0 2px #fff' }}>Tester la démo</a>
            </div>
            {/* Mobile uniquement : le lien « Se connecter » du header est masqué faute de place */}
            <p className={s.mo} style={{ margin: '20px 0 0', fontSize: 15, textAlign: 'center' }}>
              Déjà client ? <a href={LOGIN_URL} style={{ fontWeight: 700, textDecoration: 'underline' }}>Se connecter</a>
            </p>
          </div>
          <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/sticker-qr-skanema.png"
              alt="Autocollant QR Skanema"
              width={1200}
              height={1680}
              style={{ width: 'min(100%,340px)', height: 'auto', transform: 'rotate(-6deg)', borderRadius: 28, boxShadow: '0 30px 60px rgba(17,24,39,.35)' }}
            />
            <div className={s.h} style={{ marginTop: -22, transform: 'rotate(-6deg)', background: '#fff', color: '#DC2626', fontSize: 18, padding: '14px 22px', borderRadius: 999, boxShadow: '0 12px 30px rgba(17,24,39,.25)', textTransform: 'none' }}>
              tonresto.skanema.com
            </div>
          </div>
        </div>
      </section>

      {/* ── Le parcours ────────────────────────────────────── */}
      <section id="flux" style={{ padding: '40px 0 90px' }}>
        <div className={s.wrap}>
          <h2 className={s.h} style={{ fontSize: 'clamp(34px,5vw,60px)', maxWidth: 760 }}>Quatre gestes. Zéro appli à installer.</h2>
          <div style={grid4}>
            <div style={card}>
              <div className={s.h} style={stepNum}>01</div>
              <h3 className={s.h} style={stepTitle}>Découvrir</h3>
              <p style={stepText}>Un lien dans votre bio ou un QR code, et le client arrive directement sur votre catalogue.</p>
            </div>
            <div style={card}>
              <div className={s.h} style={stepNum}>02</div>
              <h3 className={s.h} style={stepTitle}>Commander</h3>
              <p style={stepText}>Le client compose son panier en quelques touches, sans compte ni formulaire, et la commande arrive sur WhatsApp.</p>
            </div>
            <div style={card}>
              <div className={s.h} style={stepNum}>03</div>
              <h3 className={s.h} style={stepTitle}>Payer</h3>
              <p style={{ ...stepText, margin: '0 0 14px' }}>Paiement mobile en un geste.</p>
              <span style={{ display: 'inline-block', background: '#1DA1F2', color: '#111827', fontWeight: 700, borderRadius: 8, padding: '6px 12px', marginRight: 6 }}>Wave</span>
              <span style={{ display: 'inline-block', background: '#FF7900', color: '#111827', fontWeight: 700, borderRadius: 8, padding: '6px 12px' }}>Orange Money</span>
            </div>
            <div style={{ ...card, background: '#111827', color: '#fff' }}>
              <div className={s.h} style={{ ...stepNum, color: '#F87171' }}>04</div>
              <h3 className={s.h} style={stepTitle}>Livrer</h3>
              <p style={{ ...stepText, color: '#E5E7EB' }}>Le commerçant suit chaque commande et le client reçoit les mises à jour sur WhatsApp.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Démo interactive ───────────────────────────────── */}
      <section id="demo" style={{ background: '#111827', color: '#fff', padding: '130px 0 150px', clipPath: 'polygon(0 70px,100% 0,100% calc(100% - 70px),0 100%)' }}>
        <div className={s.wrap} style={{ display: 'flex', flexWrap: 'wrap', gap: 56, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ flex: '1 1 400px', maxWidth: 520 }}>
            <p style={{ color: '#F87171', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', margin: '0 0 16px' }}>Démo interactive</p>
            <h2 className={s.h} style={{ fontSize: 'clamp(36px,5vw,64px)' }}>Touchez le téléphone. Passez commande.</h2>
            <p style={{ fontSize: 18, lineHeight: 1.55, color: '#E5E7EB', margin: '24px 0 0' }}>
              Ajoutez des plats, choisissez Wave ou Orange Money, suivez la livraison. Exactement ce que vivra votre client.
            </p>
          </div>
          <PhoneDemo />
        </div>
      </section>

      {/* ── Métiers ────────────────────────────────────────── */}
      <section id="metiers" style={{ padding: '30px 0 110px' }}>
        <div className={s.wrap}>
          <h2 className={s.h} style={{ fontSize: 'clamp(34px,5vw,60px)', maxWidth: 820 }}>Pensé pour les commerces qui vivent sur WhatsApp.</h2>
          <div style={grid4}>
            <div style={{ background: '#DC2626', color: '#fff', borderRadius: 20, padding: 32, minHeight: 180, boxSizing: 'content-box' }}>
              <h3 className={s.h} style={{ fontSize: 28 }}>Restaurants</h3>
              <p style={{ margin: '14px 0 0', lineHeight: 1.5 }}>Menu en ligne, commandes et livraison à domicile.</p>
            </div>
            <div style={{ background: '#111827', color: '#fff', borderRadius: 20, padding: 32, minHeight: 180, boxSizing: 'content-box' }}>
              <h3 className={s.h} style={{ fontSize: 28 }}>Pharmacies</h3>
              <p style={{ margin: '14px 0 0', lineHeight: 1.5 }}>Produits disponibles, commande rapide, livraison.</p>
            </div>
            <div style={{ background: '#fff', borderRadius: 20, padding: 32, minHeight: 180, boxSizing: 'content-box' }}>
              <h3 className={s.h} style={{ fontSize: 28, color: '#DC2626' }}>Boutiques</h3>
              <p style={{ margin: '14px 0 0', lineHeight: 1.5, color: '#374151' }}>Un catalogue vivant, partagé d’un simple lien.</p>
            </div>
            <div style={{ background: '#fff', borderRadius: 20, padding: 32, minHeight: 180, boxSizing: 'content-box' }}>
              <h3 className={s.h} style={{ fontSize: 28, color: '#DC2626' }}>Et plus</h3>
              <p style={{ margin: '14px 0 0', lineHeight: 1.5, color: '#374151' }}>Tout commerce qui prend des commandes au quotidien.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Un lien. Toute la boutique. ────────────────────── */}
      <section style={{ background: '#DC2626', color: '#fff', padding: '120px 0 150px', clipPath: 'polygon(0 70px,100% 0,100% 100%,0 100%)' }}>
        <div className={s.wrap} style={{ textAlign: 'center' }}>
          <h2 className={s.h} style={{ fontSize: 'clamp(34px,7vw,88px)' }}>Un lien.<br />Toute la boutique.</h2>
          <p style={{ fontSize: 19, maxWidth: 620, margin: '24px auto 40px', lineHeight: 1.5 }}>
            Partagez-le là où vos clients vous voient déjà : chaque clic ou scan ouvre votre catalogue et déclenche une commande sur WhatsApp.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 16, textAlign: 'left', maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ background: '#fff', color: '#111827', borderRadius: 20, padding: 26 }}>
              <h3 className={s.h} style={{ fontSize: 20, color: '#DC2626' }}>Réseaux sociaux</h3>
              <p style={{ margin: '12px 0 0', lineHeight: 1.5 }}>Mettez votre lien WhatsApp dans votre bio et vos publications : on commande en un clic.</p>
            </div>
            <div style={{ background: '#111827', color: '#fff', borderRadius: 20, padding: 26 }}>
              <h3 className={s.h} style={{ fontSize: 20 }}>QR au comptoir</h3>
              <p style={{ margin: '12px 0 0', lineHeight: 1.5, color: '#E5E7EB' }}>Vos clients physiques scannent, puis commandent depuis chez eux dès qu’ils veulent se faire livrer.</p>
            </div>
            <div style={{ background: '#111827', color: '#fff', borderRadius: 20, padding: 26 }}>
              <h3 className={s.h} style={{ fontSize: 20 }}>Sticker sur chaque commande</h3>
              <p style={{ margin: '12px 0 0', lineHeight: 1.5, color: '#E5E7EB' }}>C&apos;est votre carte de visite pour booster vos ventes&nbsp;</p>
            </div>
          </div>
          <a href={SIGNUP_URL} className={s.btn} style={{ background: '#fff', color: '#DC2626', marginTop: 40 }}>Essayer gratuitement</a>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer style={{ background: '#111827', color: '#fff', padding: '110px 0 40px', marginTop: -70 }}>
        <div className={s.wrap} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Logo width={26} height={34} color="#DC2626" dot="#111827" />
            <span className={s.h} style={{ fontSize: 22 }}>Skanema</span>
          </div>
          <span style={{ fontSize: 14, color: '#D1D5DB' }}>Commande facile, livraison rapide · skanema.com</span>
        </div>
        <div className={s.wrap}>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.12)', marginTop: 28, paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#9CA3AF' }}>
            <nav aria-label="Liens légaux" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 22px' }}>
              {LEGAL_LINKS.map((l) => <a key={l.href} href={l.href} className={s.fl}>{l.label}</a>)}
            </nav>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 22px' }}>
              <a href={LOGIN_URL} className={s.fl}>Se connecter</a>
              <a href="mailto:contact@skanema.com" className={s.fl}>contact@skanema.com</a>
              <a href="https://wa.me/221784632103" target="_blank" rel="noopener noreferrer" className={s.fl}>WhatsApp Support</a>
            </div>
          </div>
          <p style={{ margin: '18px 0 0', fontSize: 12, color: '#6B7280' }}>© {new Date().getFullYear()} Skanema · TERYAT · NINEA 012949957 · Dakar, Sénégal</p>
        </div>
      </footer>
    </div>
  )
}
