const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // got-scraping reads JSON data files at runtime — must not be webpack-bundled
  serverExternalPackages: [
    'got-scraping',
    'got',
    'header-generator',
    'generative-bayesian-network',
    'http2-wrapper',
  ],
  outputFileTracingIncludes: {
    '/api/songs/search': [
      './node_modules/header-generator/data_files/**/*',
      './node_modules/generative-bayesian-network/**/*',
    ],
    '/api/cron/update-trending': [
      './node_modules/header-generator/data_files/**/*',
      './node_modules/generative-bayesian-network/**/*',
    ],
  },

  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Optimisations de performance
  compress: true,
  
  // Optimiser les images
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  // Optimisations expérimentales
  experimental: {
    // Optimiser les imports
    optimizePackageImports: ['@heroicons/react'],
  },
  
  // Headers pour le cache
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
        ],
      },
    ]
  },
}

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  authToken: process.env.SENTRY_AUTH_TOKEN,

  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',

  silent: !process.env.CI,
})
