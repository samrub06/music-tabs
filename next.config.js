/** @type {import('next').NextConfig} */
const nextConfig = {
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
