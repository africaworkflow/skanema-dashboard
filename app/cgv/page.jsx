export const metadata = {
  title      : 'Conditions générales de vente | Skanema',
  description: 'Conditions générales de vente et politique tarifaire de Skanema.',
}

const Section = ({ number, title, children }) => (
  <section style={{ display:'grid', gridTemplateColumns:'32px 1fr', gap:'0 24px' }}>
    <span style={{ fontSize:'13px', color:'#bbb', fontWeight:500, paddingTop:'2px' }}>{number}</span>
    <div>
      <h2 style={{ fontSize:'16px', fontWeight:500, color:'#111', margin:'0 0 16px' }}>{title}</h2>
      {children}
    </div>
  </section>
)

const P = ({ children }) => (
  <p style={{ fontSize:'15px', color:'#333', lineHeight:1.75, margin:0 }}>{children}</p>
)

const Row = ({ label, value }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px', background:'#fff', gap:'24px' }}>
    <span style={{ fontSize:'13px', color:'#888', flexShrink:0 }}>{label}</span>
    <span style={{ fontSize:'13px', color:'#111', fontWeight:500, textAlign:'right' }}>{value}</span>
  </div>
)

export default function CGV() {
  return (
    <div style={{ maxWidth:'720px', margin:'0 auto', padding:'48px 24px', fontFamily:'system-ui,sans-serif' }}>

      <a href="/" style={{ fontSize:'13px', color:'#888', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'6px', marginBottom:'40px' }}>
        ← Retour
      </a>

      <div style={{ borderBottom:'0.5px solid #e5e5e5', paddingBottom:'32px', marginBottom:'48px' }}>
        <p style={{ fontSize:'12px', fontWeight:500, color:'#888', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 12px' }}>Légal</p>
        <h1 style={{ fontSize:'32px', fontWeight:500, color:'#111', margin:'0 0 8px', lineHeight:1.2 }}>Conditions générales de vente</h1>
        <p style={{ fontSize:'14px', color:'#888', margin:0 }}>Dernière mise à jour : juin 2026</p>
      </div>

      <div style={{ display:'grid', gap:'40px' }}>

        <Section number="01" title="Vendeur">
          <div style={{ display:'grid', gap:'1px', background:'#e5e5e5', border:'0.5px solid #e5e5e5', borderRadius:'12px', overflow:'hidden' }}>
            {[
              ['Société',   'TERYAT SUARL'],
              ['NINEA',     '012949957'],
              ['RC',        'SN DKR 2026 B 12120'],
              ['Adresse',   'Nord Foire Diamalaye III, Villa N°238, Dakar, Sénégal'],
              ['Email',     'contact@skanema.com'],
            ].map(([label, value]) => <Row key={label} label={label} value={value} />)}
          </div>
        </Section>

        <Section number="02" title="Offres et tarifs">
          <p style={{ fontSize:'15px', color:'#333', lineHeight:1.75, margin:'0 0 16px' }}>Skanema propose une offre d'essai gratuite et les abonnements mensuels suivants, payables en FCFA par mobile money :</p>
          <div style={{ display:'grid', gap:'1px', background:'#e5e5e5', border:'0.5px solid #e5e5e5', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', padding:'10px 20px', background:'#f9f9f9' }}>
              {['Offre','Prix','Articles','Zones'].map(h => (
                <span key={h} style={{ fontSize:'11px', fontWeight:500, color:'#888', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</span>
              ))}
            </div>
            {[
              ['Essai gratuit', '0 FCFA (14 jours)', '10 articles', '1 zone'],
              ['Pro',     '35 000 FCFA', '25 articles', '3 zones'],
              ['Premium', '75 000 FCFA', 'Illimité',  'Illimité'],
            ].map(([plan, prix, plats, zones], i, arr) => (
              <div key={plan} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', padding:'14px 20px', background:'#fff', borderBottom: i < arr.length-1 ? '0.5px solid #e5e5e5' : 'none' }}>
                <span style={{ fontSize:'14px', fontWeight:500, color:'#111' }}>{plan}</span>
                <span style={{ fontSize:'14px', color:'#333' }}>{prix}</span>
                <span style={{ fontSize:'14px', color:'#888' }}>{plats}</span>
                <span style={{ fontSize:'14px', color:'#888' }}>{zones}</span>
              </div>
            ))}
          </div>
          <P>Les tarifs sont exprimés en Francs CFA (XOF) toutes taxes comprises. TERYAT SUARL se réserve le droit de modifier ses tarifs avec un préavis de 30 jours.</P>
        </Section>

        <Section number="03" title="Essai gratuit">
          <P>L'offre d'essai est gratuite pendant 14 jours, sans engagement, et limitée à 10 articles et une zone de livraison. À l'issue de cette période, un abonnement Pro ou Premium est requis pour continuer à utiliser le service. Les offres Pro et Premium choisies à l'inscription sont payables immédiatement et ne comprennent pas de période d'essai.</P>
        </Section>

        <Section number="04" title="Commande et paiement">
          <P>Le paiement s'effectue par mobile money (Wave, Orange Money, MTN, Moov ou autre moyen proposé selon le pays) par l'intermédiaire de notre prestataire de paiement PayDunya. Chaque paiement couvre 30 jours et l'abonnement est activé dès réception du paiement confirmé. Le renouvellement se fait par un nouveau paiement : des rappels sont envoyés 3 jours et 1 jour avant l'échéance, et le service reste actif 3 jours après celle-ci avant d'être suspendu.</P>
        </Section>

        <Section number="05" title="Politique de remboursement">
          <div style={{ background:'#fafafa', border:'0.5px solid #e5e5e5', borderLeft:'3px solid #111', borderRadius:'0 8px 8px 0', padding:'16px 20px' }}>
            <P>Aucun remboursement ne sera effectué pour les abonnements déjà payés, quelle que soit la date de résiliation au cours de la période en cours.</P>
          </div>
        </Section>

        <Section number="06" title="Résiliation">
          <P>L'abonné peut résilier son abonnement à tout moment en contactant le support. La résiliation prend effet à la fin de la période mensuelle en cours. En cas de manquement grave aux CGU, TERYAT SUARL peut résilier le compte sans préavis ni remboursement.</P>
        </Section>

        <Section number="07" title="Suspension de service">
          <P>En cas de non-paiement à l'échéance, le service sera suspendu. Les données sont conservées pendant 30 jours après la suspension, puis le compte peut être définitivement supprimé.</P>
        </Section>

        <Section number="08" title="Droit applicable">
          <P>Les présentes CGV sont soumises au droit sénégalais. Tout litige relève de la compétence exclusive des tribunaux de Dakar, Sénégal.</P>
        </Section>

        <section style={{ borderTop:'0.5px solid #e5e5e5', paddingTop:'32px' }}>
          <p style={{ fontSize:'13px', color:'#888', margin:0 }}>
            Pour toute question :{' '}
            <a href="mailto:contact@skanema.com" style={{ color:'#111', fontWeight:500, textDecoration:'none' }}>contact@skanema.com</a>
          </p>
        </section>

      </div>
    </div>
  )
}
