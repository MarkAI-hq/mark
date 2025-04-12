// next.config.js

import type { NextConfig } from 'next'

const nextConfig: NextConfig = { reactStrictMode: true, images: {
  remotePatterns: [
    {
      protocol: 'http',
      hostname: 'localhost',
      port: '8000',},
      {
        protocol: 'https',
        hostname: '**.cloudflarestorage.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'github.com',
        pathname: '/Projectx-mark/images/**',
      },
    ],
      domains: ['images.unsplash.com', 'drive.google.com'],
    },
    experimental: {
      esmExternals: true,
    },
    transpilePackages: ['nextstepjs'],
    serverActions: {
      bodySizeLimit: '5mb'
    },
}

export default nextConfig