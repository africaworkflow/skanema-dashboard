// Drapeaux des pays proposés au paiement (SVG, rendu identique sur Windows, Android et iPhone)
function star(cx, cy, r) {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const d = i % 2 ? r * 0.382 : r
    pts.push(`${(cx + d * Math.cos(a)).toFixed(2)},${(cy + d * Math.sin(a)).toFixed(2)}`)
  }
  return pts.join(' ')
}

const V = (a, b, c) => (<><rect width="10" height="20" fill={a} /><rect x="10" width="10" height="20" fill={b} /><rect x="20" width="10" height="20" fill={c} /></>)

const FLAGS = {
  SN: <>{V('#00853F', '#FDEF42', '#E31B23')}<polygon points={star(15, 10, 3.6)} fill="#00853F" /></>,
  CI: V('#F77F00', '#FFFFFF', '#009E60'),
  ML: V('#14B53A', '#FCD116', '#CE1126'),
  BJ: <><rect width="12" height="20" fill="#008751" /><rect x="12" width="18" height="10" fill="#FCD116" /><rect x="12" y="10" width="18" height="10" fill="#E8112D" /></>,
  BF: <><rect width="30" height="10" fill="#EF2B2D" /><rect y="10" width="30" height="10" fill="#009E49" /><polygon points={star(15, 10, 3.6)} fill="#FCD116" /></>,
  TG: <>{[0, 1, 2, 3, 4].map((i) => <rect key={i} y={i * 4} width="30" height="4" fill={i % 2 ? '#FFCE00' : '#006A4E'} />)}<rect width="12" height="12" fill="#D21034" /><polygon points={star(6, 6, 3.4)} fill="#FFFFFF" /></>,
}

export function Flag({ code, className = 'w-6 h-4' }) {
  if (!FLAGS[code]) return null
  return (
    <svg viewBox="0 0 30 20" className={`${className} rounded-[3px] ring-1 ring-black/10 flex-shrink-0`} aria-hidden="true" preserveAspectRatio="none">
      {FLAGS[code]}
    </svg>
  )
}
