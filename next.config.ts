import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // Don't precache marketing media on first visit: by default every file in
  // /public is downloaded at SW install (~16 MB incl. a 7 MB video + PDF),
  // which burns mobile data and delays SW activation — and with it the
  // install prompt. Images are still runtime-cached when actually viewed.
  publicExcludes: [
    '!noprecache/**/*',
    '!assets/images/**/*',
    '!assets/screenshots/**/*',
    '!**/*.{mp4,webm,pdf}',
  ],
  // Same reasoning for build output: by default every JS chunk of every
  // route (~470 files, ~9.6 MB) is precached at install. Over slow links
  // that exceeds Chrome's 5-minute SW event limit, install is aborted, and
  // the app never becomes installable. Precache only the core runtime
  // (~450 KB); route/vendor chunks and fonts are runtime-cached on first use
  // by the default CacheFirst/StaleWhileRevalidate rules.
  workboxOptions: {
    exclude: [
      /\.map$/,
      /^manifest.*\.js$/,
      /^static\/media\//,
      /^static\/chunks\/(?!(framework|main|main-app|webpack|polyfills)-)/,
    ],
  },
});

const nextConfig: NextConfig = {
  output: 'standalone',

  images: {
    formats: ['image/avif', 'image/webp'],
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
    // Disabled: default chunking can split Tailwind's single utility sheet
    // across multiple output files whose load order doesn't preserve the
    // base-utilities-before-responsive-variants cascade guarantee, causing
    // unconditional rules (e.g. .flex) to beat matching responsive rules
    // (e.g. md:hidden) when the "base" chunk loads after the "variant" one.
    cssChunking: false,
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