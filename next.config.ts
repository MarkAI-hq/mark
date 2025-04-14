// next.config.js

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true, images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000'
      },
      {
        protocol: 'https',
        hostname: '**.cloudflarestorage.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
        port: ''
      }
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb'
    }
  }
}

export default nextConfig