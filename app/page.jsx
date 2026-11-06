import { LandingPage } from '@/components/landing/LandingPage'

export const metadata = {
  title      : { absolute: 'Skanema — Commandes et paiements WhatsApp pour commerçants' },
  description: 'Vos clients découvrent, commandent, paient par Wave ou Orange Money et se font livrer, sans jamais quitter WhatsApp. Pour restaurants, pharmacies et boutiques. Essai gratuit 14 jours.',
  alternates : { canonical: 'https://www.skanema.com' },
}

const jsonLd = {
  '@context'   : 'https://schema.org',
  '@type'      : 'SoftwareApplication',
  name         : 'Skanema',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  description  : 'Plateforme permettant aux commerçants (restaurants, pharmacies, boutiques) de recevoir commandes et paiements Wave ou Orange Money directement sur WhatsApp, avec catalogue en ligne, QR code et suivi de livraison.',
  url          : 'https://www.skanema.com',
  offers       : {
    '@type'   : 'AggregateOffer',
    priceCurrency: 'XOF',
    lowPrice  : '15000',
    highPrice : '75000',
    offerCount: '3',
  },
  creator: {
    '@type': 'Organization',
    name   : 'Skanema',
    url    : 'https://www.skanema.com',
    logo   : 'https://www.skanema.com/icon_SKANEMA.png',
    contactPoint: {
      '@type'      : 'ContactPoint',
      contactType  : 'customer support',
      telephone    : '+221784632103',
      email        : 'contact@skanema.com',
      availableLanguage: ['French'],
    },
    areaServed: [
      'Sénégal', 'Côte d\'Ivoire', 'Mali', 'Guinée',
      'Burkina Faso', 'Niger', 'Togo', 'Bénin',
    ],
  },
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
