import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'http',
				hostname: 'localhost',
				port: '8000'
			},
			{
				protocol: 'https',
				hostname: '**.cloudflarestorage.com'
			}
		]
	},
	experimental: {
		serverActions: {
			// allowedOrigins: ['my-proxy.com', '*.my-proxy.com'],
			bodySizeLimit: '5mb'
		}
	}
}

export default nextConfig
