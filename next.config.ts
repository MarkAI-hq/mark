import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  output: 'standalone',

  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost',                port: '3000' },
      { protocol: 'https', hostname: '**.cloudflarestorage.com', port: '' },
      { protocol: 'https', hostname: '**.unsplash.com',          port: '' },
    ],
  },

  experimental: {
    optimizePackageImports: ['geist'],
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'ngrok-skip-browser-warning',
            value: '1',
          },
        ],
      },
    ];
  },
};

// Only instrument with Sentry during production builds.
// In dev, withSentryConfig adds 60–120s to cold start with zero benefit.
if (process.env.NODE_ENV === 'production') {
  const { withSentryConfig } = require('@sentry/nextjs');
  module.exports = withSentryConfig(withPWA(nextConfig), {
    org:     'markai-labs',
    project: 'mark-web',
    silent:  true,
    widenClientFileUpload: true,
    webpack: {
      treeshake: {
        removeDebugLogging: true,
      },
      autoInstrumentServerFunctions: true,
    },
  });
} else {
  module.exports = withPWA(nextConfig);
}