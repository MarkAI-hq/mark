import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone', // Add this line for Docker deployment
  images: {
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
      bodySizeLimit: '50mb'
    }
  }
}

export default nextConfig