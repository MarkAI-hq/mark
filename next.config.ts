import type { NextConfig } from 'next';

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
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

// Only instrument with Sentry during production builds.
// In dev, withSentryConfig adds 60–120s to cold start with zero benefit.
if (process.env.NODE_ENV === 'production') {
  const { withSentryConfig } = require('@sentry/nextjs');
  module.exports = withSentryConfig(nextConfig, {
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
  module.exports = nextConfig;
}