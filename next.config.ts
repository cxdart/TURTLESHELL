import type { NextConfig } from 'next'

const projectRoot = process.cwd()

const nextConfig: NextConfig = {
  compress: true,
  devIndicators: false,
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      { source: '/styles.css', headers: [{ key: 'Cache-Control', value: 'no-cache, must-revalidate' }] },
      { source: '/app.js', headers: [{ key: 'Cache-Control', value: 'no-cache, must-revalidate' }] },
      { source: '/:path*.jpg', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/:path*.webp', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    ]
  },
}

export default nextConfig
