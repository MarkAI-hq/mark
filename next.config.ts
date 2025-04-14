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
    },
    experimental: {
      esmExternals: true,
    },
    transpilePackages: ['nextstepjs'],
    serverActions: {
      bodySizeLimit: '5mb'
    },
}

module.exports = {
  images: {
    domains: ['localhost', 'images.unsplash.com', 'drive.google.com', ''],
  }
}

export default nextConfig