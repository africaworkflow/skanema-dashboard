export const metadata = {
  title      : 'Politique de remboursement | Skanema',
  description: 'Annulation et remboursement des commandes payées avec Skanema.',
}

const H2 = ({ children }) => (
  <h2 style={{ fontSize:'11px', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.1em', color:'#888', margin:'0 0 16px' }}>{children}</h2>
)
const P = ({ children }) => (
  <p style={{ fontSize:'15px', color:'#333', lineHeight:1.75, margin:'0 0 12px' }}>{children}</p>
)
const Li = ({ children }) => (
  <li style={{ fontSize:'15px', color:'#333', lineHeight:1.75, marginBottom:'6px' }}>{children}</li>
)

export default function PolitiqueRemboursement() {
  return (
    <div style={{ maxWidth:'720px', margin:'0 auto', padding:'48px 24px', fontFamily:'system-ui,sans-serif' }}>

      <a href="/" style={{ fontSize:'13px', color:'#888', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'6px', marginBottom:'40px' }}>
        ← Retour
      </a>

      <div style={{ borderBottom:'0.5px solid #e5e5e5', paddingBottom:'32px', marginBottom:'48px' }}>
        <p style={{ fontSize:'12px', fontWeight:500, color:'#888', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 12px' }}>Légal</p>
        <h1 style={{ fontSize:'32px', fontWeight:500, color:'#111', margin:'0 0 8px', lineHeight:1.2 }}>Politique de remboursement</h1>
        <p style={{ fontSize:'14px', color:'#888', margin:0 }}>Dernière mise à jour : novembre 2026</p>
      </div>

      <div style={{ display:'grid', gap:'40px' }}>

        <section>
          <H2>À qui s'applique cette politique</H2>
          <P>
            Cette politique concerne les clients qui commandent et paient auprès d'un commerçant utilisant Skanema, par Wave, Orange Money ou en espèces à la livraison.
            Skanema est une solution éditée par TERYAT SUARL : chaque commerçant reste le vendeur des produits et le responsable de ses commandes.
          </P>
          <P>
            Le remboursement des abonnements souscrits par les commerçants est traité dans les <a href="/cgv" style={{ color:'#111', fontWeight:500 }}>conditions générales de vente</a>.
          </P>
        </section>

        <section>
          <H2>Annuler une commande</H2>
          <ul style={{ margin:0, paddingLeft:'20px' }}>
            <Li><b>Avant le paiement :</b> le client peut annuler sa commande à tout moment depuis la conversation WhatsApp, sans aucun frais.</Li>
            <Li><b>Après le paiement :</b> la commande est transmise au commerçant et sa préparation commence. Pour l'annuler, le client contacte directement le commerçant, dont le numéro figure sur le reçu. L'annulation reste à l'appréciation du commerçant si la préparation a déjà commencé.</Li>
          </ul>
        </section>

        <section>
          <H2>Cas donnant droit à un remboursement</H2>
          <P>Le client est remboursé du montant payé dans les cas suivants :</P>
          <ul style={{ margin:0, paddingLeft:'20px' }}>
            <Li>la commande n'a pas été livrée ;</Li>
            <Li>la commande est annulée par le commerçant (produit indisponible, restaurant fermé, zone non desservie…) ;</Li>
            <Li>la commande livrée ne correspond pas à ce qui a été commandé ou payé ;</Li>
            <Li>le client a payé deux fois la même commande.</Li>
          </ul>
          <P>
            Les produits alimentaires et périssables livrés conformes à la commande ne sont ni repris ni remboursés.
          </P>
        </section>

        <section>
          <H2>Comment demander un remboursement</H2>
          <ul style={{ margin:0, paddingLeft:'20px' }}>
            <Li>Contactez le commerçant (son numéro figure sur votre reçu) en indiquant votre numéro de commande.</Li>
            <Li>Si vous n'obtenez pas de réponse sous 48 heures, écrivez-nous à <a href="mailto:contact@skanema.com" style={{ color:'#111', fontWeight:500 }}>contact@skanema.com</a> avec votre numéro de commande : nous vous aiderons à obtenir une solution.</Li>
          </ul>
        </section>

        <section>
          <H2>Délai et mode de remboursement</H2>
          <ul style={{ margin:0, paddingLeft:'20px' }}>
            <Li>Un paiement par Wave ou Orange Money est remboursé sur le même compte mobile money, dans un délai de 7 jours ouvrés après l'accord du remboursement.</Li>
            <Li>Une commande payée en espèces est remboursée directement par le commerçant.</Li>
            <Li>Le montant remboursé correspond au montant payé pour la commande, frais de livraison compris lorsque la commande n'a pas été livrée.</Li>
          </ul>
        </section>

        <section style={{ borderTop:'0.5px solid #e5e5e5', paddingTop:'32px' }}>
          <p style={{ fontSize:'13px', color:'#888', margin:0 }}>
            Pour toute question :{' '}
            <a href="mailto:contact@skanema.com" style={{ color:'#111', fontWeight:500, textDecoration:'none' }}>
              contact@skanema.com
            </a>
          </p>
        </section>

      </div>
    </div>
  )
}
