// Logo Skanema (identique à la landing), cliquable vers l'accueil
export function BrandLogo({ tone = 'dark', size = 'md', className = '' }) {
  const h = size === 'sm' ? 26 : 34
  const text = tone === 'light' ? '#FFFFFF' : '#111827'
  return (
    <a href="https://www.skanema.com" aria-label="Retour à l'accueil Skanema"
       className={`inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity ${className}`}>
      <svg width={Math.round(h * 26 / 34)} height={h} viewBox="0 0 52 82" aria-hidden="true">
        <g fill="#DC2626" stroke="#DC2626" strokeWidth="5" strokeLinejoin="round">
          <polygon points="4,18 22,7 22,52 4,63" />
          <polygon points="31,36 49,25 49,69 31,80" />
        </g>
        <circle cx="39" cy="67" r="4" fill="#111827" />
      </svg>
      <span style={{ fontFamily: 'Montserrat, Inter, sans-serif', fontWeight: 900, fontSize: size === 'sm' ? 17 : 22, letterSpacing: '-.02em', textTransform: 'uppercase', lineHeight: .98, color: text }}>
        Skanema
      </span>
    </a>
  )
}
