const BASE_URL = 'https://www.skanema.com'

// Pages publiques uniquement : /login, /onboarding et /dashboard sont exclues (voir robots.txt)
const LEGAL_PAGES = ['/mentions-legales', '/politique-de-confidentialite', '/cgu', '/cgv']

export default function sitemap() {
  return [
    {
      url         : BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority    : 1,
    },
    ...LEGAL_PAGES.map((path) => ({
      url         : `${BASE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority    : 0.2,
    })),
  ]
}
