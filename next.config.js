/** @type {import('next').NextConfig} */
const nextConfig = {
  // got-scraping reads JSON data files at runtime — must not be webpack-bundled
  serverExternalPackages: ['got-scraping', 'header-generator'],

  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Optimisations de performance
  compress: true,
  
  // Optimiser les images
  images: {
    formats: ['image/avif', 'image/webp'],
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

module.exports = nextConfig;
