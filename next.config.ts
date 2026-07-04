import './env-config.ts'

import type { NextConfig } from 'next'

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self' https://accounts.google.com",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https://accounts.google.com https://www.googleapis.com",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  pageExtensions: ['page.tsx', 'api.tsx', 'api.ts'],
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/agenda',
        permanent: false,
      },
      {
        source: '/register/:path*',
        destination: '/agenda',
        permanent: false,
      },
      {
        source: '/schedule/:path*',
        destination: '/agenda',
        permanent: false,
      },
      {
        source: '/docs/:path*',
        destination: '/agenda',
        permanent: false,
      },
      {
        source: '/api/docs/:path*',
        destination: '/agenda',
        permanent: false,
      },
      {
        source: '/api/users/:path*',
        destination: '/agenda',
        permanent: false,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
