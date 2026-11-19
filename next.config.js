/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source     : '/',
          has        : [{ type: 'host', value: 'dashboard.skanema.com' }],
          destination: '/dashboard',
        },
        {
          source     : '/dashboard',
          has        : [{ type: 'host', value: 'dashboard.skanema.com' }],
          destination: '/dashboard',
        },
      ],
    }
  },

  // Le tableau de bord (dashboard.skanema.com) sert le même site : on interdit son indexation
  // pour que Google ne voie qu'une seule version des pages publiques, celle de www.skanema.com
  async headers() {
    return [
      {
        source : '/:path*',
        has    : [{ type: 'host', value: 'dashboard.skanema.com' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },

  async redirects() {
    return [
      // Redirige skanema.com/dashboard/* → dashboard.skanema.com/dashboard/*
      {
        source     : '/dashboard/:path*',
        has        : [{ type: 'host', value: 'www.skanema.com' }],
        destination: 'https://dashboard.skanema.com/dashboard/:path*',
        permanent  : true,
      },
      {
        source     : '/dashboard/:path*',
        has        : [{ type: 'host', value: 'skanema.com' }],
        destination: 'https://dashboard.skanema.com/dashboard/:path*',
        permanent  : true,
      },
      // Redirige skanema.com/login → dashboard.skanema.com/login
      {
        source     : '/login',
        has        : [{ type: 'host', value: 'www.skanema.com' }],
        destination: 'https://dashboard.skanema.com/login',
        permanent  : true,
      },
      {
        source     : '/login',
        has        : [{ type: 'host', value: 'skanema.com' }],
        destination: 'https://dashboard.skanema.com/login',
        permanent  : true,
      },
      // Redirige skanema.com/onboarding → dashboard.skanema.com/onboarding
      {
        source     : '/onboarding',
        has        : [{ type: 'host', value: 'www.skanema.com' }],
        destination: 'https://dashboard.skanema.com/onboarding',
        permanent  : true,
      },
      {
        source     : '/onboarding',
        has        : [{ type: 'host', value: 'skanema.com' }],
        destination: 'https://dashboard.skanema.com/onboarding',
        permanent  : true,
      },
    ]
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
    ],
  },
}
module.exports = nextConfig
