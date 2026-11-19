import { LandingPage } from '@/components/landing/LandingPage'

export const metadata = {
  title      : { absolute: 'Skanema — Commandes et paiements WhatsApp pour commerçants' },
  description: 'Vos clients découvrent, commandent, paient par Wave ou Orange Money et se font livrer, sans jamais quitter WhatsApp. Pour restaurants, pharmacies et boutiques. Essai gratuit 14 jours.',
  alternates : { canonical: 'https://www.skanema.com' },
}

const SITE = 'https://www.skanema.com'
const ORG = {
  '@type'       : 'Organization',
  '@id'         : `${SITE}/#organisation`,
  name          : 'Skanema',
  legalName     : 'TERYAT SUARL',
  url           : SITE,
  logo          : `${SITE}/icon_SKANEMA.png`,
  description   : 'Skanema est une solution sénégalaise, éditée par TERYAT SUARL à Dakar, qui permet aux commerçants de recevoir commandes et paiements Wave ou Orange Money directement sur WhatsApp.',
  foundingLocation: 'Dakar, Sénégal',
  address       : { '@type': 'PostalAddress', addressLocality: 'Dakar', addressCountry: 'SN' },
  sameAs        : [
    'https://www.instagram.com/appskanema/',
    'https://www.facebook.com/profile.php?id=61573896037799',
    'https://x.com/getskanema',
  ],
  contactPoint  : {
    '@type'          : 'ContactPoint',
    contactType      : 'customer support',
    telephone        : '+221784632103',
    email            : 'contact@skanema.com',
    availableLanguage: ['French'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph'  : [
    ORG,
    {
      '@type'    : 'WebSite',
      '@id'      : `${SITE}/#site`,
      url        : SITE,
      name       : 'Skanema',
      inLanguage : 'fr',
      publisher  : { '@id': `${SITE}/#organisation` },
    },
    {
      '@type'            : 'SoftwareApplication',
      name               : 'Skanema',
      applicationCategory: 'BusinessApplication',
      operatingSystem    : 'Web, WhatsApp',
      url                : SITE,
      description        : 'Commandes et paiements sur WhatsApp pour les commerçants : catalogue en ligne, paiement Wave et Orange Money, zones et frais de livraison, QR codes et tableau de bord en temps réel.',
      publisher          : { '@id': `${SITE}/#organisation` },
      areaServed         : ['Sénégal', 'Côte d\'Ivoire', 'Bénin', 'Burkina Faso', 'Togo', 'Mali'],
      offers             : {
        '@type'      : 'AggregateOffer',
        priceCurrency: 'XOF',
        lowPrice     : '35000',
        highPrice    : '75000',
        offerCount   : '2',
      },
    },
  ],
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  )
}
