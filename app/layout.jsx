import './globals.css'
import { Providers } from './providers'

const BASE_URL = 'https://www.skanema.com'

export const metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default : 'Skanema — Commandes et paiements WhatsApp pour commerçants',
    template: '%s | Skanema',
  },
  description:
    'Vos clients découvrent, commandent, paient par Wave ou Orange Money et se font livrer, sans jamais quitter WhatsApp. Pour restaurants, pharmacies et boutiques. Essai gratuit 14 jours.',

  keywords: [
    'commande WhatsApp',
    'catalogue WhatsApp',
    'vendre sur WhatsApp Sénégal',
    'commande en ligne restaurant Dakar',
    'paiement Wave',
    'paiement Orange Money',
    'QR code commande',
    'livraison Sénégal',
    'boutique en ligne WhatsApp',
    'Skanema',
  ],

  authors : [{ name: 'Skanema', url: BASE_URL }],
  creator : 'Skanema',
  publisher: 'Skanema',

  manifest: '/manifest.json',
  themeColor: '#DC2626',
  appleWebApp: {
    capable    : true,
    statusBarStyle: 'default',
    title      : 'Skanema',
},

  openGraph: {
    type       : 'website',
    locale     : 'fr_SN',
    url        : BASE_URL,
    siteName   : 'Skanema',
    title      : 'Skanema — Commandes et paiements WhatsApp pour commerçants',
    description: 'Commande. Paie. Reçois. Vos clients commandent et paient par Wave ou Orange Money sans quitter WhatsApp.',
    images: [
      {
        url   : '/og-image.png',
        width : 1200,
        height: 630,
        alt   : 'Skanema — Commande. Paie. Reçois. Sur WhatsApp, Wave et Orange Money.',
      },
    ],
  },

  twitter: {
    card       : 'summary_large_image',
    title      : 'Skanema — Commandes et paiements WhatsApp pour commerçants',
    description: 'Commande. Paie. Reçois. Vos clients commandent et paient par Wave ou Orange Money sans quitter WhatsApp.',
    images     : ['/og-image.png'],
  },

  robots: {
    index    : true,
    follow   : true,
    googleBot: {
      index              : true,
      follow             : true,
      'max-image-preview': 'large',
      'max-snippet'      : -1,
    },
  },

  alternates: {
    canonical: BASE_URL,
  },

  icons: {
  icon    : '/icon_SKANEMA.png',
  shortcut: '/icon_SKANEMA.png',
  apple   : '/icon_SKANEMA.png',
},
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Skanema" />
        <link rel="apple-touch-icon" href="/icon_SKANEMA.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
